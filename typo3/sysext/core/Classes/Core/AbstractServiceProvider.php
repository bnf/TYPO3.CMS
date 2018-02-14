<?php
declare(strict_types = 1);
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

use Interop\Container\ServiceProviderInterface;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerAwareInterface;
use TYPO3\CMS\Core\Log\LogManager;
use TYPO3\CMS\Core\SingletonInterface;
use TYPO3\CMS\Core\Utility\GeneralUtility;

abstract class AbstractServiceProvider implements ServiceProviderInterface
{
    public function getFactories(): array
    {
        return [];
    }

    public function getExtensions(): array
    {
        return [
            'TCAConfiguration' => [ static::class, 'getTcaConfiguration' ],
            'TCAOverrides' => [ static::class, 'getTcaOverrides' ],
            'middlewares' => [ static::class, 'getMiddlewares' ],
        ];
    }

    /**
     * Create an instance of a class
     *
     * Supports auto injection of the logger and registering as (legacy) singleton instance.
     *
     * @param ContainerInterface $container
     * @param string $className name of the class to instantiate, must not be empty and not start with a backslash
     * @param array $constructorArguments Arguments for the constructor
     */
    protected static function new(ContainerInterface $container, string $className, array $constructorArguments = [])
    {
        $instance = new $className(...$constructorArguments);
        if ($instance instanceof SingletonInterface) {
            GeneralUtility::setSingletonInstance($className, $instance);
        }
        if ($instance instanceof LoggerAwareInterface) {
            $instance->setLogger($container->get(LogManager::class)->getLogger($className));
        }
        return $instance;
    }

    public static function getTcaConfiguration(ContainerInterface $container, array $TCA, string $path = null): array
    {
        $tcaConfigurationDirectory = ($path ?? static::PATH) . 'Configuration/TCA';
        if (is_dir($tcaConfigurationDirectory)) {
            $files = scandir($tcaConfigurationDirectory);
            foreach ($files as $file) {
                if (
                    is_file($tcaConfigurationDirectory . '/' . $file)
                    && ($file !== '.')
                    && ($file !== '..')
                    && (substr($file, -4, 4) === '.php')
                ) {
                    $tcaOfTable = require($tcaConfigurationDirectory . '/' . $file);
                    if (is_array($tcaOfTable)) {
                        // TCA table name is filename without .php suffix, eg 'sys_notes', not 'sys_notes.php'
                        $tcaTableName = substr($file, 0, -4);
                        $TCA[$tcaTableName] = $tcaOfTable;
                    }
                }
            }
        }
        return $TCA;
    }

    public static function getTcaOverrides(ContainerInterface $container, array $TCA, string $path = null): array
    {
        // Execute override files from Configuration/TCA/Overrides
        $tcaOverridesPathForPackage = ($path ?? static::PATH) . 'Configuration/TCA/Overrides';
        if (!is_dir($tcaOverridesPathForPackage)) {
            return $TCA;
        }

        $files = scandir($tcaOverridesPathForPackage);
        if (empty($files)) {
            return $TCA;
        }

        $GLOBALS['TCA'] = $TCA;
        foreach ($files as $file) {
            if (
                is_file($tcaOverridesPathForPackage . '/' . $file)
                && ($file !== '.')
                && ($file !== '..')
                && (substr($file, -4, 4) === '.php')
            ) {
                require($tcaOverridesPathForPackage . '/' . $file);
            }
        }
        $TCA = $GLOBALS['TCA'];

        return $TCA;
    }

    protected static function getMiddlewares(ContainerInterface $container, array $middlewares, string $path = null): array
    {
        $packageConfiguration = ($path ?? static::PATH) . 'Configuration/RequestMiddlewares.php';
        if (file_exists($packageConfiguration)) {
            $middlewaresInPackage = require $packageConfiguration;
            if (is_array($middlewaresInPackage)) {
                $middlewares = array_merge_recursive($middlewares, $middlewaresInPackage);
            }
        }

        return $middlewares;
    }
}
