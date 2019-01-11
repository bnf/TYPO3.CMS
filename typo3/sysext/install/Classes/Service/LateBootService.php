<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Install\Service;

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

use Psr\Container\ContainerInterface;
use TYPO3\CMS\Core\Core\Bootstrap;
use TYPO3\CMS\Core\DependencyInjection\ContainerBuilder;
use TYPO3\CMS\Core\Package\PackageManager;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Basic service to perform late booting.
 *
 * @internal This is NOT an API class, it is for internal use in the install tool only.
 */
class LateBootService
{
    /**
     * @var ContainerBuilder
     */
    private $containerBuilder;

    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @var ContainerInterface
     */
    private $fullBlownContainer = null;

    /**
     * Construct
     */
    public function __construct(ContainerBuilder $containerBuilder, ContainerInterface $failsafeContainer)
    {
        $this->containerBuilder = $containerBuilder;
        $this->failsafeContainer = $failsafeContainer;
    }

    /**
     * @return ContainerInterface
     */
    public function getFullContainer(bool $disableCaching = true)
    {
        return $this->fullBlownContainer ?? $this->prepareContainer($disableCaching);
    }

    /**
     * @param bool $disableCaching
     * @return ContainerInterface
     */
    private function prepareContainer(bool $disableCaching = true): ContainerInterface
    {
        $coreCache = Bootstrap::createCache('core', $disableCaching);
        $packageManager = Bootstrap::createPackageManager(PackageManager::class, $coreCache);

        $failsafe = false;
        // @todo add a way to overwrite defaultEntries(?)
        // Build a full blown non-failsafe container which is required for loading ext_localconf
        return $this->fullBlownContainer = $this->containerBuilder->createDependencyInjectionContainer($packageManager, $coreCache, $failsafe);
    }

    /**
     * Switch global context to a new context, or revert
     * to the original booting container if no container
     * is specified
     *
     * @param ContainerInterface $container
     * @param array $backup
     * @return array
     */
    public function makeCurrent(ContainerInterface $container = null, $oldBackup = []): array
    {
        $container = $container ?? $this->failsafeContainer;

        // @todo: verify if needed
        $backup = [
            'singletonInstances', GeneralUtility::getSingletonInstances(),
        ];

        GeneralUtility::purgeInstances();

        // Set global state to full blown container and instances
        GeneralUtility::setContainer($container);
        ExtensionManagementUtility::setPackageManager($container->get(PackageManager::class));

        $backupSingletonInstances = $oldBackup['singletonInstances'] ?? [];
        foreach ($backupSingletonInstances as $className => $instance) {
            GeneralUtility::setSingletonInstance($className, $instance);
        }

        return $backup;
    }

    /**
     * Bootstraps a full container and load ext_localconf
     *
     * Returns the full blown container interface which contains classes
     * as configured
     *
     * @param bool $disableCaching
     * @return ContainerInterface
     */
    public function loadExtLocalconfDatabaseAndExtTables(): ContainerInterface
    {
        $container = $this->getFullContainer();

        $backup = $this->makeCurrent($container);

        Bootstrap::loadTypo3LoadedExtAndExtLocalconf(false, $coreCache);
        Bootstrap::unsetReservedGlobalVariables();
        Bootstrap::loadBaseTca(false, $coreCache);
        Bootstrap::loadExtTables(false);

        $this->makeCurrent(null, $backup);

        return $container;
    }
}