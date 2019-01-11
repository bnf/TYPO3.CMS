<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Core\Package;

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

use Interop\Container\ServiceProviderInterface;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerAwareInterface;
use TYPO3\CMS\Core\Exception;
use TYPO3\CMS\Core\Log\LogManager;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * @internal
 */
abstract class AbstractServiceProvider implements ServiceProviderInterface
{
    /**
     * Path to the package location, including trailing slash
     * should usually be assigned to: __DIR__ . '/../'
     * for ServiceProviders located in the Classes/ directory
     *
     * @var string|null
     */
    const PATH = null;

    /**
     * @return array
     */
    public function getFactories(): array
    {
        return [];
    }

    /**
     * @return array
     */
    public function getExtensions(): array
    {
        return [
            'middlewares' => [ static::class, 'configureMiddlewares' ],
        ];
    }

    /**
     * @param ContainerInterface $container
     * @param array $middlewares
     * @param string $path supplied when invoked internally through PseudoServiceProvider
     * @return array
     */
    public static function configureMiddlewares(ContainerInterface $container, array $middlewares, string $path = null): array
    {
        $packageConfiguration = static::getPackagePath($path) . 'Configuration/RequestMiddlewares.php';
        if (file_exists($packageConfiguration)) {
            $middlewaresInPackage = require $packageConfiguration;
            if (is_array($middlewaresInPackage)) {
                $middlewares = array_replace_recursive($middlewares, $middlewaresInPackage);
            }
        }

        return $middlewares;
    }

    /**
     * Create an instance of a class. Supports auto injection of the logger.
     *
     * @param ContainerInterface $container
     * @param string $className name of the class to instantiate, must not be empty and not start with a backslash
     * @param array $constructorArguments Arguments for the constructor
     * @return mixed
     */
    protected static function new(ContainerInterface $container, string $className, array $constructorArguments = [])
    {
        // Use makeInstanceForDi to respect $GLOBALS['TYPO3_CONF_VARS']['SYS']['Objects'] and
        // class alias mappings
        $instance = GeneralUtility::makeInstanceForDi($className, ...$constructorArguments);

        if ($instance instanceof LoggerAwareInterface) {
            $instance->setLogger($container->get(LogManager::class)->getLogger($className));
        }
        return $instance;
    }

    /**
     * @param string $computedPath supplied when invoked internally through PseudoServiceProvider
     * @return string
     */
    private static function getPackagePath(string $computedPath = null): string
    {
        // Do only take $path argument into account when invoked from the PseudoServiceProvider
        if (static::class === PseudoServiceProvider::class) {
            return $computedPath;
        }

        if (static::PATH !== null) {
            return static::PATH;
        }

        throw new Exception('ServiceProvider constant ' . static::class . '::PATH is missing.', 1536303539);
    }
}
