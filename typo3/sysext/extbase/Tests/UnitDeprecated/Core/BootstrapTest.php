<?php
namespace TYPO3\CMS\Extbase\Tests\UnitDeprecated\Core;

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

use TYPO3\TestingFramework\Core\Unit\UnitTestCase;

/**
 * Test case
 */
class BootstrapTest extends UnitTestCase
{
    /**
     * @var bool Reset singletons created by subject
     */
    protected $resetSingletonInstances = true;

    /**
     * @test
     */
    public function configureObjectManagerRespectsOverridingOfAlternativeObjectRegistrationViaPluginConfiguration()
    {
        /** @var $objectContainer \TYPO3\CMS\Extbase\Object\Container\Container|\PHPUnit_Framework_MockObject_MockObject */
        $objectContainer = $this->getMockBuilder(\TYPO3\CMS\Extbase\Object\Container\Container::class)
            ->setMethods(['registerImplementation'])
            ->getMock();
        $objectContainer->expects($this->once())->method('registerImplementation')->with(\TYPO3\CMS\Extbase\Persistence\PersistenceManagerInterface::class, 'TYPO3\CMS\Extbase\Persistence\Reddis\PersistenceManager');
        \TYPO3\CMS\Core\Utility\GeneralUtility::setSingletonInstance(\TYPO3\CMS\Extbase\Object\Container\Container::class, $objectContainer);

        $frameworkSettings['objects'] = [
            'TYPO3\CMS\Extbase\Persistence\PersistenceManagerInterface.' => [
                'className' => 'TYPO3\CMS\Extbase\Persistence\Reddis\PersistenceManager'
            ]
        ];

        /** @var $configurationManagerMock \TYPO3\CMS\Extbase\Configuration\ConfigurationManager|\PHPUnit_Framework_MockObject_MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $configurationManagerMock = $this->getAccessibleMock(\TYPO3\CMS\Extbase\Configuration\ConfigurationManager::class, ['getConfiguration']);
        $configurationManagerMock->expects($this->any())->method('getConfiguration')->with('Framework')->will($this->returnValue($frameworkSettings));

        /** @var \TYPO3\CMS\Extbase\Object\ObjectManagerInterface|\PHPUnit_Framework_MockObject_MockObject  $objectManager */
        $objectManager = $this->createMock(\TYPO3\CMS\Extbase\Object\ObjectManager::class);

        /** @var $bootstrapMock \TYPO3\CMS\Extbase\Core\Bootstrap|\PHPUnit_Framework_MockObject_MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $bootstrapMock = $this->getAccessibleMock(\TYPO3\CMS\Extbase\Core\Bootstrap::class, ['inject'], [], '', false);
        $bootstrapMock->_set('objectManager', $objectManager);
        $bootstrapMock->_set('configurationManager', $configurationManagerMock);
        $bootstrapMock->configureObjectManager();
    }
}
