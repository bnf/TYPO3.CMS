<?php

declare(strict_types=1);

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

namespace TYPO3\CMS\Core;

use ArrayObject;
use Psr\Container\ContainerInterface;
use Psr\EventDispatcher\EventDispatcherInterface;
use TYPO3\CMS\Core\Core\Environment;
use TYPO3\CMS\Core\Package\AbstractServiceProvider;

/**
 * @internal
 */
class ServiceProvider extends AbstractServiceProvider
{
    protected static function getPackagePath(): string
    {
        return __DIR__ . '/../';
    }

    public function getFactories(): array
    {
        return [
            Cache\CacheManager::class => [ static::class, 'getCacheManager' ],
            Console\CommandApplication::class => [ static::class, 'getConsoleCommandApplication' ],
            Console\CommandRegistry::class => [ static::class, 'getConsoleCommandRegistry' ],
            Context\Context::class => [ static::class, 'getContext' ],
            Configuration\SiteConfiguration::class => [ static::class, 'getSiteConfiguration' ],
            Resource\Index\FileIndexRepository::class => [ static::class, 'getFileIndexRepository' ],
            EventDispatcher\EventDispatcher::class => [ static::class, 'getEventDispatcher' ],
            EventDispatcher\ListenerProvider::class => [ static::class, 'getEventListenerProvider' ],
            Http\MiddlewareStackResolver::class => [ static::class, 'getMiddlewareStackResolver' ],
            Http\RequestFactory::class => [ static::class, 'getRequestFactory' ],
            Package\FailsafePackageManager::class => [ static::class, 'getFailsafePackageManager' ],
            Service\DependencyOrderingService::class => [ static::class, 'getDependencyOrderingService' ],
            Crypto\PasswordHashing\PasswordHashFactory::class => [ static::class, 'getPasswordHashFactory' ],
            Resource\ResourceFactory::class => [ static::class, 'getResourceFactory' ],
            Registry::class => [ static::class, 'getRegistry' ],
            Imaging\IconFactory::class => [ static::class, 'getIconFactory' ],
            Imaging\IconRegistry::class => [ static::class, 'getIconRegistry' ],
            /* FlashMessageService is injected into Extbase\Mvc\Controller\ControllerContext when
             * a StandaloneView is created. */
            Messaging\FlashMessageService::class => [ static::class, 'getFlashMessageService' ],
            Localization\LanguageService::class => [ static::class, 'getLanguageService' ],
            Localization\LanguageStore::class => [ static::class, 'getLanguageStore' ],
            Localization\Locales::class => [ static::class, 'getLocales' ],
            Localization\LocalizationFactory::class => [ static::class, 'getLocalizationFactory' ],
            /* Required by Imaging\GraphicalFunctions which is needed by image processing methods
             * in TYPO3\CMS\Install\Controller\EnvironmentController */
            Charset\CharsetConverter::class => [ static::class, 'getCharsetConverter' ],
            Mail\TransportFactory::class => [ static::class, 'getMailTransportFactory' ],
            Resource\ProcessedFileRepository::class => [ static::class, 'getProcessedFileRepository' ],
            Resource\StorageRepository::class => [ static::class, 'getStorageRepository' ],
            Resource\Driver\DriverRegistry::class => [ static::class, 'getDriverRegistry' ],
            Service\FlexFormService::class => [ static::class, 'getFlexFormService' ],
            Service\OpcodeCacheService::class => [ static::class, 'getOpcodeCacheService' ],
            TimeTracker\TimeTracker::class => [ static::class, 'getTimeTracker' ],
            TypoScript\TypoScriptService::class => [ static::class, 'getTypoScriptService' ],
            TypoScript\Parser\ConstantConfigurationParser::class => [ static::class, 'getTypoScriptConstantConfigurationParser' ],
            'middlewares' => [ static::class, 'getMiddlewares' ],
        ];
    }

    public function getExtensions(): array
    {
        return [
            EventDispatcherInterface::class => [ static::class, 'provideFallbackEventDispatcher' ],
        ] + parent::getExtensions();
    }

    public static function getCacheManager(ContainerInterface $container): Cache\CacheManager
    {
        if (!$container->get('boot.state')->done) {
            throw new \LogicException(Cache\CacheManager::class . ' can not be injected/instantiated during ext_localconf.php loading. Use lazy loading instead.', 1549446998);
        }

        $cacheConfigurations = $GLOBALS['TYPO3_CONF_VARS']['SYS']['caching']['cacheConfigurations'] ?? [];
        $disableCaching = $container->get('boot.state')->cacheDisabled;
        $defaultCaches = [
            $container->get('cache.core'),
            $container->get('cache.assets'),
            $container->get('cache.di'),
        ];

        $cacheManager = self::new($container, Cache\CacheManager::class, [$disableCaching]);
        $cacheManager->setCacheConfigurations($cacheConfigurations);
        $cacheConfigurations['di']['groups'] = ['system'];
        foreach ($defaultCaches as $cache) {
            $cacheManager->registerCache($cache, $cacheConfigurations[$cache->getIdentifier()]['groups'] ?? ['all']);
        }

        return $cacheManager;
    }

    public static function getConsoleCommandApplication(ContainerInterface $container): Console\CommandApplication
    {
        return new Console\CommandApplication(
            $container->get(Context\Context::class),
            $container->get(Console\CommandRegistry::class)
        );
    }

    public static function getConsoleCommandRegistry(ContainerInterface $container): Console\CommandRegistry
    {
        return new Console\CommandRegistry($container->get(Package\PackageManager::class), $container);
    }

    public static function getEventDispatcher(ContainerInterface $container): EventDispatcher\EventDispatcher
    {
        return new EventDispatcher\EventDispatcher(
            $container->get(EventDispatcher\ListenerProvider::class)
        );
    }

    public static function getEventListenerProvider(ContainerInterface $container): EventDispatcher\ListenerProvider
    {
        return new EventDispatcher\ListenerProvider($container);
    }

    public static function getDependencyOrderingService(ContainerInterface $container): Service\DependencyOrderingService
    {
        return new Service\DependencyOrderingService();
    }

    public static function getContext(ContainerInterface $container): Context\Context
    {
        return new Context\Context();
    }

    public static function getSiteConfiguration(ContainerInterface $container): Configuration\SiteConfiguration
    {
        return new Configuration\SiteConfiguration(Environment::getConfigPath() . '/sites');
    }

    public static function getFileIndexRepository(ContainerInterface $container): Resource\Index\FileIndexRepository
    {
        return new Resource\Index\FileIndexRepository($container->get(EventDispatcherInterface::class));
    }

    public static function getPasswordHashFactory(ContainerInterface $container): Crypto\PasswordHashing\PasswordHashFactory
    {
        return new Crypto\PasswordHashing\PasswordHashFactory();
    }

    public static function getRegistry(ContainerInterface $container): Registry
    {
        return self::new($container, Registry::class);
    }

    public static function getIconFactory(ContainerInterface $container): Imaging\IconFactory
    {
        return self::new($container, Imaging\IconFactory::class, [
            $container->get(EventDispatcherInterface::class),
            $container->get(Imaging\IconRegistry::class)
        ]);
    }

    public static function getIconRegistry(ContainerInterface $container): Imaging\IconRegistry
    {
        return self::new($container, Imaging\IconRegistry::class);
    }

    public static function getFlashMessageService(ContainerInterface $container): Messaging\FlashMessageService
    {
        return self::new($container, Messaging\FlashMessageService::class);
    }

    public static function getLanguageService(ContainerInterface $container): Localization\LanguageService
    {
        return self::new($container, Localization\LanguageService::class, [
            $container->get(Localization\Locales::class),
            $container->get(Localization\LocalizationFactory::class)
        ]);
    }

    public static function getLanguageStore(ContainerInterface $container): Localization\LanguageStore
    {
        return self::new($container, Localization\LanguageStore::class);
    }

    public static function getLocales(ContainerInterface $container): Localization\Locales
    {
        return self::new($container, Localization\Locales::class);
    }

    public static function getLocalizationFactory(ContainerInterface $container): Localization\LocalizationFactory
    {
        return self::new($container, Localization\LocalizationFactory::class, [
            $container->get(Localization\LanguageStore::class),
            $container->get(Cache\CacheManager::class)
        ]);
    }

    public static function getCharsetConverter(ContainerInterface $container): Charset\CharsetConverter
    {
        return self::new($container, Charset\CharsetConverter::class);
    }

    public static function getMailTransportFactory(ContainerInterface $container): Mail\TransportFactory
    {
        return self::new($container, Mail\TransportFactory::class);
    }

    public static function getResourceFactory(ContainerInterface $container): Resource\ResourceFactory
    {
        return self::new($container, Resource\ResourceFactory::class, [
            $container->get(EventDispatcherInterface::class)
        ]);
    }

    public static function getProcessedFileRepository(ContainerInterface $container): Resource\ProcessedFileRepository
    {
        return self::new($container, Resource\ProcessedFileRepository::class);
    }

    public static function getStorageRepository(ContainerInterface $container): Resource\StorageRepository
    {
        return self::new($container, Resource\StorageRepository::class);
    }

    public static function getDriverRegistry(ContainerInterface $container): Resource\Driver\DriverRegistry
    {
        return self::new($container, Resource\Driver\DriverRegistry::class);
    }

    public static function getFlexFormService(ContainerInterface $container): Service\FlexFormService
    {
        return self::new($container, Service\FlexFormService::class);
    }

    public static function getOpcodeCacheService(ContainerInterface $container): Service\OpcodeCacheService
    {
        return self::new($container, Service\OpcodeCacheService::class);
    }

    public static function getTimeTracker(ContainerInterface $container): TimeTracker\TimeTracker
    {
        return self::new($container, TimeTracker\TimeTracker::class);
    }

    public static function getTypoScriptService(ContainerInterface $container): TypoScript\TypoScriptService
    {
        return self::new($container, TypoScript\TypoScriptService::class);
    }

    public static function getTypoScriptConstantConfigurationParser(ContainerInterface $container): TypoScript\Parser\ConstantConfigurationParser
    {
        return self::new($container, TypoScript\Parser\ConstantConfigurationParser::class);
    }

    public static function getRequestFactory(ContainerInterface $container): Http\RequestFactory
    {
        return new Http\RequestFactory();
    }

    public static function getFailsafePackageManager(ContainerInterface $container): Package\FailsafePackageManager
    {
        $packageManager = $container->get(Package\PackageManager::class);
        if ($packageManager instanceof Package\FailsafePackageManager) {
            return $packageManager;
        }
        throw new \RuntimeException('FailsafePackageManager can only be instantiated in failsafe (maintenance tool) mode.', 1586861816);
    }

    public static function getMiddlewareStackResolver(ContainerInterface $container): Http\MiddlewareStackResolver
    {
        return new Http\MiddlewareStackResolver(
            $container,
            $container->get(Service\DependencyOrderingService::class),
            $container->get('cache.core')
        );
    }

    public static function getMiddlewares(ContainerInterface $container): ArrayObject
    {
        return new ArrayObject();
    }

    public static function provideFallbackEventDispatcher(
        ContainerInterface $container,
        EventDispatcherInterface $eventDispatcher = null
    ): EventDispatcherInterface {
        // Provide a dummy / empty event dispatcher for the install tool when $eventDispatcher is null (that means when we run without symfony DI)
        return $eventDispatcher ?? new EventDispatcher\EventDispatcher(
            new EventDispatcher\ListenerProvider($container)
        );
    }
}
