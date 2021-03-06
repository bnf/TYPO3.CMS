<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Extensionmanager\Tests\Unit\Report;

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

use TYPO3\CMS\Core\Localization\LanguageService;
use TYPO3\CMS\Extbase\Object\ObjectManagerInterface;
use TYPO3\CMS\Extensionmanager\Domain\Model\Extension;
use TYPO3\CMS\Extensionmanager\Domain\Model\Repository;
use TYPO3\CMS\Extensionmanager\Domain\Repository\RepositoryRepository;
use TYPO3\CMS\Extensionmanager\Report\ExtensionStatus;
use TYPO3\CMS\Extensionmanager\Utility\ListUtility;
use TYPO3\CMS\Reports\Status;
use TYPO3\CMS\Reports\StatusProviderInterface;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;

/**
 * Test case
 */
class ExtensionStatusTest extends UnitTestCase
{
    /**
     * @var ObjectManagerInterface
     */
    protected $mockObjectManager;

    /**
     * @var RepositoryRepository
     */
    protected $mockRepositoryRepository;

    /**
     * @var LanguageService
     */
    protected $mockLanguageService;

    /**
     * Set up
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->mockObjectManager = $this->getMockBuilder(ObjectManagerInterface::class)->getMock();
        /** @var $mockRepositoryRepository RepositoryRepository|\PHPUnit\Framework\MockObject\MockObject */
        $this->mockRepositoryRepository = $this->getMockBuilder(RepositoryRepository::class)
            ->setConstructorArgs([$this->mockObjectManager])
            ->getMock();
        $this->mockLanguageService = $this->createMock(LanguageService::class);
    }

    /**
     * @test
     */
    public function extensionStatusImplementsStatusProviderInterface()
    {
        $reportMock = $this->createMock(ExtensionStatus::class);
        self::assertInstanceOf(StatusProviderInterface::class, $reportMock);
    }

    /**
     * @test
     */
    public function getStatusReturnsArray()
    {
        $report = $this->getMockBuilder(ExtensionStatus::class)
            ->setMethods(['getSecurityStatusOfExtensions', 'getMainRepositoryStatus'])
            ->disableOriginalConstructor()
            ->getMock();
        self::assertIsArray($report->getStatus());
    }

    /**
     * @test
     */
    public function getStatusReturnArrayContainsFiveEntries()
    {
        $report = $this->getMockBuilder(ExtensionStatus::class)
            ->setMethods(['getSecurityStatusOfExtensions', 'getMainRepositoryStatus'])
            ->disableOriginalConstructor()
            ->getMock();
        self::assertSame(5, \count($report->getStatus()));
    }

    /**
     * @test
     */
    public function getStatusReturnArrayContainsInstancesOfReportsStatusStatus()
    {
        $statusObject = $this->getMockBuilder(Status::class)
            ->setConstructorArgs(['title', 'value'])
            ->getMock();
        /** @var ExtensionStatus $report */
        $report = $this->getMockBuilder(ExtensionStatus::class)
            ->setMethods(['getSecurityStatusOfExtensions', 'getMainRepositoryStatus'])
            ->disableOriginalConstructor()
            ->getMock();
        $report->expects(self::any())->method('getMainRepositoryStatus')->willReturn($statusObject);
        $resultStatuses = $report->getStatus();
        foreach ($resultStatuses as $status) {
            if ($status) {
                self::assertInstanceOf(Status::class, $status);
            }
        }
    }

    /**
     * @test
     */
    public function getStatusCallsGetMainRepositoryStatusForMainRepositoryStatusResult()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(0);
        $mockExtensionList = [
            'enetcache' => [
                'installed' => true,
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['getMainRepositoryStatus'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);
        $mockReport
            ->expects(self::once())
            ->method('getMainRepositoryStatus')
            ->willReturn('foo');

        $result = $mockReport->getStatus();
        self::assertSame('foo', $result['mainRepositoryStatus']);
    }

    /**
     * @test
     */
    public function getMainRepositoryStatusReturnsErrorStatusIfRepositoryIsNotFound()
    {
        $this->mockRepositoryRepository
            ->expects(self::once())
            ->method('findOneTypo3OrgRepository')
            ->willReturn(null);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::once())
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::ERROR)
            ->willReturn($statusMock);
        $mockReport->_set('repositoryRepository', $this->mockRepositoryRepository);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getMainRepositoryStatus');
        self::assertSame($statusMock, $result);
    }

    /**
     * @test
     */
    public function getMainRepositoryStatusReturnsNoticeIfRepositoryUpdateIsLongerThanSevenDaysAgo()
    {
        /** @var $mockRepositoryRepository Repository|\PHPUnit\Framework\MockObject\MockObject */
        $mockRepository = $this->getMockBuilder(Repository::class)->getMock();
        $mockRepository
            ->expects(self::once())
            ->method('getLastUpdate')
            ->willReturn(new \DateTime('-8 days'));

        $this->mockRepositoryRepository
            ->expects(self::once())
            ->method('findOneTypo3OrgRepository')
            ->willReturn($mockRepository);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::once())
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::NOTICE)
            ->willReturn($statusMock);
        $mockReport->_set('repositoryRepository', $this->mockRepositoryRepository);
        $mockReport->_set('languageService', $this->mockLanguageService);

        /** @var $result Status */
        $result = $mockReport->_call('getMainRepositoryStatus');
        self::assertSame($statusMock, $result);
    }

    /**
     * @test
     */
    public function getMainRepositoryStatusReturnsOkIfUpdatedLessThanSevenDaysAgo()
    {
        /** @var $mockRepositoryRepository Repository|\PHPUnit\Framework\MockObject\MockObject */
        $mockRepository = $this->getMockBuilder(Repository::class)->getMock();
        $mockRepository
            ->expects(self::once())
            ->method('getLastUpdate')
            ->willReturn(new \DateTime('-6 days'));

        $this->mockRepositoryRepository
            ->expects(self::once())
            ->method('findOneTypo3OrgRepository')
            ->willReturn($mockRepository);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::once())
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::OK)
            ->willReturn($statusMock);
        $mockReport->_set('repositoryRepository', $this->mockRepositoryRepository);
        $mockReport->_set('languageService', $this->mockLanguageService);

        /** @var $result Status */
        $result = $mockReport->_call('getMainRepositoryStatus');
        self::assertSame($statusMock, $result);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsOkForLoadedExtensionIfNoInsecureExtensionIsLoaded()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(0);
        $mockExtensionList = [
            'enetcache' => [
                'installed' => true,
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(0))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::OK)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->loaded;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsErrorForLoadedExtensionIfInsecureExtensionIsLoaded()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(-1);
        $mockExtensionList = [
            'enetcache' => [
                'installed' => true,
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(0))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::ERROR)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->loaded;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsOkForExistingExtensionIfNoInsecureExtensionExists()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(0);
        $mockExtensionList = [
            'enetcache' => [
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(1))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::OK)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->existing;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsErrorForExistingExtensionIfInsecureExtensionExists()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(-1);
        $mockExtensionList = [
            'enetcache' => [
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(1))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::WARNING)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->existing;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsOkForLoadedExtensionIfNoOutdatedExtensionIsLoaded()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(0);
        $mockExtensionList = [
            'enetcache' => [
                'installed' => true,
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(2))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::OK)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->loadedoutdated;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsErrorForLoadedExtensionIfOutdatedExtensionIsLoaded()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(-2);
        $mockExtensionList = [
            'enetcache' => [
                'installed' => true,
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(2))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::WARNING)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->loadedoutdated;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsOkForExistingExtensionIfNoOutdatedExtensionExists()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(0);
        $mockExtensionList = [
            'enetcache' => [
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(3))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::OK)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->existingoutdated;
        self::assertSame($statusMock, $loadedResult);
    }

    /**
     * @test
     */
    public function getSecurityStatusOfExtensionsReturnsErrorForExistingExtensionIfOutdatedExtensionExists()
    {
        /** @var $mockTerObject Extension|\PHPUnit\Framework\MockObject\MockObject */
        $mockTerObject = $this->getMockBuilder(Extension::class)->getMock();
        $mockTerObject
            ->expects(self::any())
            ->method('getVersion')
            ->willReturn('1.0.6');
        $mockTerObject
            ->expects(self::atLeastOnce())
            ->method('getReviewState')
            ->willReturn(-2);
        $mockExtensionList = [
            'enetcache' => [
                'terObject' => $mockTerObject
            ],
        ];
        /** @var $mockListUtility ListUtility|\PHPUnit\Framework\MockObject\MockObject */
        $mockListUtility = $this->getMockBuilder(ListUtility::class)->getMock();
        $mockListUtility
            ->expects(self::once())
            ->method('getAvailableAndInstalledExtensionsWithAdditionalInformation')
            ->willReturn($mockExtensionList);

        /** @var $mockReport ExtensionStatus|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface */
        $mockReport = $this->getAccessibleMock(ExtensionStatus::class, ['dummy'], [], '', false);
        $mockReport->_set('objectManager', $this->mockObjectManager);
        $statusMock = $this->createMock(Status::class);
        $this->mockObjectManager
            ->expects(self::at(3))
            ->method('get')
            ->with(self::anything(), self::anything(), self::anything(), self::anything(), Status::WARNING)
            ->willReturn($statusMock);
        $mockReport->_set('listUtility', $mockListUtility);
        $mockReport->_set('languageService', $this->mockLanguageService);

        $result = $mockReport->_call('getSecurityStatusOfExtensions');
        /** @var $loadedResult Status */
        $loadedResult = $result->existingoutdated;
        self::assertSame($statusMock, $loadedResult);
    }
}
