<?php
namespace TYPO3\CMS\Core\Core;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

use Composer\Autoload\ClassLoader;
use DI\Container;
use Doctrine\Common\Annotations\AnnotationReader;
use Doctrine\Common\Annotations\AnnotationRegistry;
use Psr\Container\ContainerInterface;
use TYPO3\CMS\Core\Cache\Backend\BackendInterface;
use TYPO3\CMS\Core\Cache\Backend\NullBackend;
use TYPO3\CMS\Core\Cache\Backend\Typo3DatabaseBackend;
use TYPO3\CMS\Core\Cache\CacheManager;
use TYPO3\CMS\Core\Cache\Exception\InvalidBackendException;
use TYPO3\CMS\Core\Cache\Exception\InvalidCacheException;
use TYPO3\CMS\Core\Cache\Frontend\FrontendInterface;
use TYPO3\CMS\Core\Cache\Frontend\VariableFrontend;
use TYPO3\CMS\Core\Configuration\ConfigurationManager;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\IO\PharStreamWrapperInterceptor;
use TYPO3\CMS\Core\Localization\Locales;
use TYPO3\CMS\Core\Log\LogManager;
use TYPO3\CMS\Core\Package\FailsafePackageManager;
use TYPO3\CMS\Core\Package\PackageManager;
use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\PharStreamWrapper\Behavior;
use TYPO3\PharStreamWrapper\Manager;
use TYPO3\PharStreamWrapper\PharStreamWrapper;

/**
 * This class encapsulates bootstrap related methods.
 * It is required directly as the very first thing in entry scripts and
 * used to define all base things like constants and paths and so on.
 *
 * Most methods in this class have dependencies to each other. They can
 * not be called in arbitrary order. The methods are ordered top down, so
 * a method at the beginning has lower dependencies than a method further
 * down. Do not fiddle with the load order in own scripts except you know
 * exactly what you are doing!
 */
class Bootstrap
{
    /**
     * Bootstrap TYPO3 and return a Container that may be used
     * to initialize an Application class.
     *
     * @param ClassLoader $classLoader an instance of the class loader
     * @param bool $failsafe true if no caching and a failsaife package manager should be used
     * @return ContainerInterface
     */
    public static function init(
        ClassLoader $classLoader,
        bool $failsafe = false
    ): ContainerInterface {
        $requestId = substr(md5(uniqid('', true)), 0, 13);

        static::initializeClassLoader($classLoader);
        if (!Environment::isComposerMode() && ClassLoadingInformation::isClassLoadingInformationAvailable()) {
            ClassLoadingInformation::registerClassLoadingInformation();
        }

        static::startOutputBuffering();

        $configurationManager = static::createConfigurationManager();
        if (!static::checkIfEssentialConfigurationExists($configurationManager)) {
            $failsafe = true;
        }
        static::populateLocalConfiguration($configurationManager);
        static::initializeErrorHandling();
        static::initializeIO();

        $disableCaching = $failsafe ? true : false;

        $logManager = new LogManager($requestId);
        $coreCache = static::createCache('cache_core', $disableCaching);
        $packageManager = static::createPackageManager(
            $failsafe ? FailsafePackageManager::class : PackageManager::class,
            $coreCache
        );

        // Push singleton instances to GeneralUtility and ExtensionManagementUtility
        // They should be fetched through a container (later) but currently a PackageManager
        // singleton instance is required by PackageManager->activePackageDuringRuntime
        GeneralUtility::setSingletonInstance(LogManager::class, $logManager);
        GeneralUtility::setSingletonInstance(PackageManager::class, $packageManager);
        ExtensionManagementUtility::setPackageManager($packageManager);

        static::initializeRuntimeActivatedPackagesFromConfiguration($packageManager);

        static::setDefaultTimezone();
        $locales = Locales::initialize();
        static::setMemoryLimit();

        $assetsCache = static::createCache('assets', $disableCaching);
        if (!$failsafe) {
            IconRegistry::setCache($assetsCache);
            PageRenderer::setCache($assetsCache);
            static::loadTypo3LoadedExtAndExtLocalconf(true, $coreCache);
            static::unsetReservedGlobalVariables();
            static::loadBaseTca(true, $coreCache);
            static::checkEncryptionKey();
        }

        // Create the global CacheManager singleton instance and inject early cache instances.
        // This can be removed once we have a system wide dependency injection container, where
        // the CacheManager instance could be created on demand (early cache instances would
        // be injected as dependency from $defaultContainerEntries)
        $cacheManager = static::createCacheManager($disableCaching, [$coreCache, $assetsCache]);
        GeneralUtility::setSingletonInstance(CacheManager::class, $cacheManager);

        $defaultContainerEntries = [
            ClassLoader::class => $classLoader,
            'request.id' => $requestId,
            ConfigurationManager::class => $configurationManager,
            LogManager::class => $logManager,
            'cache.core' => $coreCache,
            'cache.assets' => $assetsCache,
            CacheManager::class => $cacheManager,
            PackageManager::class => $packageManager,
            Locales::class => $locales,
        ];

        return static::createDependencyInjectionContainer(
            $failsafe,
            $packageManager,
            $defaultContainerEntries
        );
    }

    /**
     * Prevent any unwanted output that may corrupt AJAX/compression.
     * This does not interfere with "die()" or "echo"+"exit()" messages!
     *
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function startOutputBuffering()
    {
        ob_start();
    }

    /**
     * Run the base setup that checks server environment, determines paths,
     * populates base files and sets common configuration.
     *
     * Script execution will be aborted if something fails here.
     *
     * @throws \RuntimeException when TYPO3_REQUESTTYPE was not set before, setRequestType() needs to be called before
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function baseSetup()
    {
        if (!defined('TYPO3_REQUESTTYPE')) {
            throw new \RuntimeException('No Request Type was set, TYPO3 does not know in which context it is run.', 1450561838);
        }
        if (!Environment::isComposerMode() && ClassLoadingInformation::isClassLoadingInformationAvailable()) {
            ClassLoadingInformation::registerClassLoadingInformation();
        }
    }

    public static function createDependencyInjectionContainer(
        bool $failsafe = false,
        PackageManager $packageManager,
        array $defaultEntries
    ): ContainerInterface {
        $wrapContainer = new \TYPO3\CMS\Core\Core\Container();

        $builder = new \DI\ContainerBuilder();
        $builder->wrapContainer($wrapContainer);

        if (!$failsafe) {
            $builder->enableCompilation(Environment::getVarPath() . '/cache/code/phpdi');
            $builder->writeProxiesToFile(true, Environment::getVarPath() . '/cache/code/phpdi/proxies');
        }
        $builder->useAnnotations(false);

        $packages = $packageManager->getActivePackages();
        foreach ($packages as $package) {
            $diConfigDir = $package->getPackagePath() . 'Configuration/';
            if (file_exists($diConfigDir . 'Services.php')) {
                $builder->addDefinitions($diConfigDir . 'Services.php');
            }
        }
        $container = $builder->build();
        $wrapContainer->setChildContainer($container);

        foreach ($defaultEntries as $id => $service) {
            $container->set($id, $service);
        }

        return $wrapContainer;
    }

    /**
     * Sets the class loader to the bootstrap
     *
     * @param ClassLoader $classLoader an instance of the class loader
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function initializeClassLoader(ClassLoader $classLoader)
    {
        ClassLoadingInformation::setClassLoader($classLoader);

        /** @see initializeAnnotationRegistry */
        AnnotationRegistry::registerLoader([$classLoader, 'loadClass']);

        // Annotations used in unit tests
        AnnotationReader::addGlobalIgnoredName('test');

        // Annotations that control the extension scanner
        AnnotationReader::addGlobalIgnoredName('extensionScannerIgnoreFile');
        AnnotationReader::addGlobalIgnoredName('extensionScannerIgnoreLine');
    }

    /**
     * checks if LocalConfiguration.php or PackageStates.php is missing,
     * used to see if a redirect to the install tool is needed
     *
     * @param ConfigurationManager $configurationManager
     * @return bool TRUE when the essential configuration is available, otherwise FALSE
     * @internal This is not a public API method, do not use in own extensions
     */
    protected static function checkIfEssentialConfigurationExists(ConfigurationManager $configurationManager): bool
    {
        return file_exists($configurationManager->getLocalConfigurationFileLocation())
            && file_exists(Environment::getLegacyConfigPath() . '/PackageStates.php');
    }

    /**
     * Initializes the package system and loads the package configuration and settings
     * provided by the packages.
     *
     * @param string $packageManagerClassName Define an alternative package manager implementation (usually for the installer)
     * @param FrontendInterface $coreCache
     * @return PackageManager
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function createPackageManager($packageManagerClassName, FrontendInterface $coreCache): PackageManager
    {
        $dependencyOrderingService = GeneralUtility::makeInstance(\TYPO3\CMS\Core\Service\DependencyOrderingService::class);
        /** @var \TYPO3\CMS\Core\Package\PackageManager $packageManager */
        $packageManager = new $packageManagerClassName($dependencyOrderingService);
        $packageManager->injectCoreCache($coreCache);
        $packageManager->initialize();

        return $packageManager;
    }

    /**
     * Activates a package during runtime. This is used in AdditionalConfiguration.php
     * to enable extensions under conditions.
     *
     * @param PackageManager $packageManager
     */
    protected static function initializeRuntimeActivatedPackagesFromConfiguration(PackageManager $packageManager)
    {
        $packages = $GLOBALS['TYPO3_CONF_VARS']['EXT']['runtimeActivatedPackages'] ?? [];
        if (!empty($packages)) {
            foreach ($packages as $runtimeAddedPackageKey) {
                $packageManager->activatePackageDuringRuntime($runtimeAddedPackageKey);
            }
        }
    }

    /**
     * Load ext_localconf of extensions
     *
     * @param bool $allowCaching
     * @param FrontendInterface $coreCache
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function loadTypo3LoadedExtAndExtLocalconf($allowCaching = true, FrontendInterface $coreCache = null)
    {
        if ($allowCaching) {
            $coreCache = $coreCache ?? GeneralUtility::makeInstance(CacheManager::class)->getCache('cache_core');
        }
        ExtensionManagementUtility::loadExtLocalconf($allowCaching, $coreCache);
    }

    /**
     * We need an early instance of the configuration manager.
     * Since makeInstance relies on the object configuration, we create it here with new instead.
     *
     * @return ConfigurationManager
     */
    public static function createConfigurationManager(): ConfigurationManager
    {
        return new ConfigurationManager();
    }

    /**
     * We need an early instance of the configuration manager.
     * Since makeInstance relies on the object configuration, we create it here with new instead.
     *
     * @param ConfigurationManager $configurationManager
     * @internal This is not a public API method, do not use in own extensions
     */
    protected static function populateLocalConfiguration(ConfigurationManager $configurationManager)
    {
        $configurationManager->exportConfiguration();
    }

    /**
     * Instantiates an early cache instance
     *
     * Creates a cache instances independently from the CacheManager.
     * The is used to create the core cache during early bootstrap when the CacheManager
     * is not yet available (i.e. configuration is not yet loaded).
     *
     * @param string $identifier
     * @param bool $disableCaching
     * @return FrontendInterface
     * @internal
     */
    protected static function createCache(string $identifier, bool $disableCaching = false): FrontendInterface
    {
        $configuration = $GLOBALS['TYPO3_CONF_VARS']['SYS']['caching']['cacheConfigurations'][$identifier] ?? [];

        $frontend = $configuration['frontend'] ?? VariableFrontend::class;
        $backend = $configuration['backend'] ?? Typo3DatabaseBackend::class;
        $options = $configuration['options'] ?? [];

        if ($disableCaching) {
            $backend = NullBackend::class;
            $options = [];
        }

        $backendInstance = new $backend('production', $options);
        if (!$backendInstance instanceof BackendInterface) {
            throw new InvalidBackendException('"' . $backend . '" is not a valid cache backend object.', 1545260108);
        }
        if (is_callable([$backendInstance, 'initializeObject'])) {
            $backendInstance->initializeObject();
        }

        $frontendInstance = new $frontend($identifier, $backendInstance);
        if (!$frontendInstance instanceof FrontendInterface) {
            throw new InvalidCacheException('"' . $frontend . '" is not a valid cache frontend object.', 1545260109);
        }
        if (is_callable([$frontendInstance, 'initializeObject'])) {
            $frontendInstance->initializeObject();
        }

        return $frontendInstance;
    }

    /**
     * Initialize caching framework, and re-initializes it (e.g. in the install tool) by recreating the instances
     * again despite the Singleton instance
     *
     * @param bool $disableCaching
     * @param array $defaultCaches
     * @return CacheManager
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function createCacheManager(bool $disableCaching = false, array $defaultCaches = []): CacheManager
    {
        $cacheConfigurations = $GLOBALS['TYPO3_CONF_VARS']['SYS']['caching']['cacheConfigurations'];
        $cacheManager = new CacheManager($disableCaching);
        $cacheManager->setCacheConfigurations($cacheConfigurations);
        foreach ($defaultCaches as $cache) {
            $cacheManager->registerCache($cache, $cacheConfigurations[$cache->getIdentifier()]['groups'] ?? ['all']);
        }
        return $cacheManager;
    }

    /**
     * Set default timezone
     */
    protected static function setDefaultTimezone()
    {
        $timeZone = $GLOBALS['TYPO3_CONF_VARS']['SYS']['phpTimeZone'];
        if (empty($timeZone)) {
            // Time zone from the server environment (TZ env or OS query)
            $defaultTimeZone = @date_default_timezone_get();
            if ($defaultTimeZone !== '') {
                $timeZone = $defaultTimeZone;
            } else {
                $timeZone = 'UTC';
            }
        }
        // Set default to avoid E_WARNINGs with PHP > 5.3
        date_default_timezone_set($timeZone);
    }

    /**
     * Configure and set up exception and error handling
     *
     * @throws \RuntimeException
     */
    protected static function initializeErrorHandling()
    {
        $productionExceptionHandlerClassName = $GLOBALS['TYPO3_CONF_VARS']['SYS']['productionExceptionHandler'];
        $debugExceptionHandlerClassName = $GLOBALS['TYPO3_CONF_VARS']['SYS']['debugExceptionHandler'];

        $errorHandlerClassName = $GLOBALS['TYPO3_CONF_VARS']['SYS']['errorHandler'];
        $errorHandlerErrors = $GLOBALS['TYPO3_CONF_VARS']['SYS']['errorHandlerErrors'];
        $exceptionalErrors = $GLOBALS['TYPO3_CONF_VARS']['SYS']['exceptionalErrors'];

        $displayErrorsSetting = (int)$GLOBALS['TYPO3_CONF_VARS']['SYS']['displayErrors'];
        switch ($displayErrorsSetting) {
            case -1:
                $ipMatchesDevelopmentSystem = GeneralUtility::cmpIP(GeneralUtility::getIndpEnv('REMOTE_ADDR'), $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask']);
                $exceptionHandlerClassName = $ipMatchesDevelopmentSystem ? $debugExceptionHandlerClassName : $productionExceptionHandlerClassName;
                $displayErrors = $ipMatchesDevelopmentSystem ? 1 : 0;
                $exceptionalErrors = $ipMatchesDevelopmentSystem ? $exceptionalErrors : 0;
                break;
            case 0:
                $exceptionHandlerClassName = $productionExceptionHandlerClassName;
                $displayErrors = 0;
                break;
            case 1:
                $exceptionHandlerClassName = $debugExceptionHandlerClassName;
                $displayErrors = 1;
                break;
            default:
                if (!(TYPO3_REQUESTTYPE & TYPO3_REQUESTTYPE_INSTALL)) {
                    // Throw exception if an invalid option is set.
                    throw new \RuntimeException(
                        'The option $TYPO3_CONF_VARS[SYS][displayErrors] is not set to "-1", "0" or "1".',
                        1476046290
                    );
                }
        }
        @ini_set('display_errors', (string)$displayErrors);

        if (!empty($errorHandlerClassName)) {
            // Register an error handler for the given errorHandlerError
            $errorHandler = GeneralUtility::makeInstance($errorHandlerClassName, $errorHandlerErrors);
            $errorHandler->setExceptionalErrors($exceptionalErrors);
            if (is_callable([$errorHandler, 'setDebugMode'])) {
                $errorHandler->setDebugMode($displayErrors === 1);
            }
        }
        if (!empty($exceptionHandlerClassName)) {
            // Registering the exception handler is done in the constructor
            GeneralUtility::makeInstance($exceptionHandlerClassName);
        }
    }

    /**
     * Initializes IO and stream wrapper related behavior.
     */
    protected static function initializeIO()
    {
        if (in_array('phar', stream_get_wrappers())) {
            // destroy and re-initialize PharStreamWrapper for TYPO3 core
            Manager::destroy();
            Manager::initialize(
                (new Behavior())
                    ->withAssertion(new PharStreamWrapperInterceptor())
            );

            stream_wrapper_unregister('phar');
            stream_wrapper_register('phar', PharStreamWrapper::class);
        }
    }

    /**
     * Set PHP memory limit depending on value of
     * $GLOBALS['TYPO3_CONF_VARS']['SYS']['setMemoryLimit']
     */
    protected static function setMemoryLimit()
    {
        if ((int)$GLOBALS['TYPO3_CONF_VARS']['SYS']['setMemoryLimit'] > 16) {
            @ini_set('memory_limit', (string)((int)$GLOBALS['TYPO3_CONF_VARS']['SYS']['setMemoryLimit'] . 'm'));
        }
    }

    /**
     * Unsetting reserved global variables:
     * Those are set in "ext:core/ext_tables.php" file:
     *
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function unsetReservedGlobalVariables()
    {
        unset($GLOBALS['PAGES_TYPES']);
        unset($GLOBALS['TCA']);
        unset($GLOBALS['TBE_MODULES']);
        unset($GLOBALS['TBE_STYLES']);
        unset($GLOBALS['BE_USER']);
        // Those set otherwise:
        unset($GLOBALS['TBE_MODULES_EXT']);
        unset($GLOBALS['TCA_DESCR']);
        unset($GLOBALS['LOCAL_LANG']);
    }

    /**
     * Load $TCA
     *
     * This will mainly set up $TCA through extMgm API.
     *
     * @param bool $allowCaching True, if loading TCA from cache is allowed
     * @param FrontendInterface $coreCache
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function loadBaseTca(bool $allowCaching = true, FrontendInterface $coreCache = null)
    {
        if ($allowCaching) {
            $coreCache = $coreCache ?? GeneralUtility::makeInstance(CacheManager::class)->getCache('cache_core');
        }
        ExtensionManagementUtility::loadBaseTca($allowCaching, $coreCache);
    }

    /**
     * Check if a configuration key has been configured
     */
    protected static function checkEncryptionKey()
    {
        if (empty($GLOBALS['TYPO3_CONF_VARS']['SYS']['encryptionKey'])) {
            throw new \RuntimeException(
                'TYPO3 Encryption is empty. $GLOBALS[\'TYPO3_CONF_VARS\'][\'SYS\'][\'encryptionKey\'] needs to be set for TYPO3 to work securely',
                1502987245
            );
        }
    }

    /**
     * Load ext_tables and friends.
     *
     * This will mainly load and execute ext_tables.php files of loaded extensions
     * or the according cache file if exists.
     *
     * @param bool $allowCaching True, if reading compiled ext_tables file from cache is allowed
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function loadExtTables(bool $allowCaching = true)
    {
        ExtensionManagementUtility::loadExtTables($allowCaching);
        static::runExtTablesPostProcessingHooks();
    }

    /**
     * Check for registered ext tables hooks and run them
     *
     * @throws \UnexpectedValueException
     */
    protected static function runExtTablesPostProcessingHooks()
    {
        foreach ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['GLOBAL']['extTablesInclusion-PostProcessing'] ?? [] as $className) {
            /** @var \TYPO3\CMS\Core\Database\TableConfigurationPostProcessingHookInterface $hookObject */
            $hookObject = GeneralUtility::makeInstance($className);
            if (!$hookObject instanceof \TYPO3\CMS\Core\Database\TableConfigurationPostProcessingHookInterface) {
                throw new \UnexpectedValueException(
                    '$hookObject "' . $className . '" must implement interface TYPO3\\CMS\\Core\\Database\\TableConfigurationPostProcessingHookInterface',
                    1320585902
                );
            }
            $hookObject->processData();
        }
    }

    /**
     * Initialize the Routing for the TYPO3 Backend
     * Loads all routes registered inside all packages and stores them inside the Router
     *
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function initializeBackendRouter()
    {
        // See if the Routes.php from all active packages have been built together already
        $cacheIdentifier = 'BackendRoutesFromPackages_' . sha1(TYPO3_version . Environment::getProjectPath() . 'BackendRoutesFromPackages');

        /** @var \TYPO3\CMS\Core\Cache\Frontend\FrontendInterface $codeCache */
        $codeCache = GeneralUtility::makeInstance(\TYPO3\CMS\Core\Cache\CacheManager::class)->getCache('cache_core');
        $routesFromPackages = [];
        if ($codeCache->has($cacheIdentifier)) {
            // substr is necessary, because the php frontend wraps php code around the cache value
            $routesFromPackages = unserialize(substr($codeCache->get($cacheIdentifier), 6, -2));
        } else {
            // Loop over all packages and check for a Configuration/Backend/Routes.php file
            $packageManager = GeneralUtility::makeInstance(\TYPO3\CMS\Core\Package\PackageManager::class);
            $packages = $packageManager->getActivePackages();
            foreach ($packages as $package) {
                $routesFileNameForPackage = $package->getPackagePath() . 'Configuration/Backend/Routes.php';
                if (file_exists($routesFileNameForPackage)) {
                    $definedRoutesInPackage = require $routesFileNameForPackage;
                    if (is_array($definedRoutesInPackage)) {
                        $routesFromPackages = array_merge($routesFromPackages, $definedRoutesInPackage);
                    }
                }
                $routesFileNameForPackage = $package->getPackagePath() . 'Configuration/Backend/AjaxRoutes.php';
                if (file_exists($routesFileNameForPackage)) {
                    $definedRoutesInPackage = require $routesFileNameForPackage;
                    if (is_array($definedRoutesInPackage)) {
                        foreach ($definedRoutesInPackage as $routeIdentifier => $routeOptions) {
                            // prefix the route with "ajax_" as "namespace"
                            $routeOptions['path'] = '/ajax' . $routeOptions['path'];
                            $routesFromPackages['ajax_' . $routeIdentifier] = $routeOptions;
                            $routesFromPackages['ajax_' . $routeIdentifier]['ajax'] = true;
                        }
                    }
                }
            }
            // Store the data from all packages in the cache
            $codeCache->set($cacheIdentifier, serialize($routesFromPackages));
        }

        // Build Route objects from the data
        $router = GeneralUtility::makeInstance(\TYPO3\CMS\Backend\Routing\Router::class);
        foreach ($routesFromPackages as $name => $options) {
            $path = $options['path'];
            unset($options['path']);
            $route = GeneralUtility::makeInstance(\TYPO3\CMS\Backend\Routing\Route::class, $path, $options);
            $router->addRoute($name, $route);
        }
    }

    /**
     * Initialize backend user object in globals
     *
     * @param string $className usually \TYPO3\CMS\Core\Authentication\BackendUserAuthentication::class but can be used for CLI
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function initializeBackendUser($className = \TYPO3\CMS\Core\Authentication\BackendUserAuthentication::class)
    {
        /** @var \TYPO3\CMS\Core\Authentication\BackendUserAuthentication $backendUser */
        $backendUser = GeneralUtility::makeInstance($className);
        // The global must be available very early, because methods below
        // might trigger code which relies on it. See: #45625
        $GLOBALS['BE_USER'] = $backendUser;
        $backendUser->start();
    }

    /**
     * Initializes and ensures authenticated access
     *
     * @internal This is not a public API method, do not use in own extensions
     * @param bool $proceedIfNoUserIsLoggedIn if set to TRUE, no forced redirect to the login page will be done
     */
    public static function initializeBackendAuthentication($proceedIfNoUserIsLoggedIn = false)
    {
        $GLOBALS['BE_USER']->backendCheckLogin($proceedIfNoUserIsLoggedIn);
    }

    /**
     * Initialize language object
     *
     * @internal This is not a public API method, do not use in own extensions
     */
    public static function initializeLanguageObject()
    {
        /** @var $GLOBALS['LANG'] \TYPO3\CMS\Core\Localization\LanguageService */
        $GLOBALS['LANG'] = GeneralUtility::makeInstance(\TYPO3\CMS\Core\Localization\LanguageService::class);
        $GLOBALS['LANG']->init($GLOBALS['BE_USER']->uc['lang']);
    }
}
