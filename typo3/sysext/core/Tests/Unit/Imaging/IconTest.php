<?php
namespace TYPO3\CMS\Core\Tests\Unit\Imaging;

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

use Prophecy\Argument;
use TYPO3\CMS\Core\Cache\CacheManager;
use TYPO3\CMS\Core\Cache\Frontend\FrontendInterface;
use TYPO3\CMS\Core\Imaging\Icon;
use TYPO3\CMS\Core\Imaging\IconFactory;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\Type\Icon\IconState;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\SignalSlot\Dispatcher;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;

/**
 * Test case
 */
class IconTest extends UnitTestCase
{
    /**
     * @var Icon
     */
    protected $subject;

    /**
     * @var string
     */
    protected $iconIdentifier = 'actions-close';

    /**
     * @var string
     */
    protected $overlayIdentifier = 'overlay-readonly';

    /**
     * Set up
     */
    protected function setUp(): void
    {
        parent::setUp();
        $cacheManagerProphecy = $this->prophesize(CacheManager::class);
        GeneralUtility::setSingletonInstance(CacheManager::class, $cacheManagerProphecy->reveal());
        $cacheFrontendProphecy = $this->prophesize(FrontendInterface::class);
        $cacheManagerProphecy->getCache('assets')->willReturn($cacheFrontendProphecy->reveal());
        $cacheFrontendProphecy->get(Argument::cetera())->willReturn(false);
        $cacheFrontendProphecy->set(Argument::cetera())->willReturn(null);
        $dispatcherProphecy = $this->prophesize(Dispatcher::class);
        $dispatcherProphecy->dispatch(Argument::any(), Argument::any(), Argument::type('array'))->willReturnArgument(2);

        // @todo: Mock IconRegistry, as in IconFactoryTest
        $iconFactory = new IconFactory(new IconRegistry(), $dispatcherProphecy->reveal());
        $this->subject = $iconFactory->getIcon($this->iconIdentifier, Icon::SIZE_SMALL, $this->overlayIdentifier, IconState::cast(IconState::STATE_DISABLED));
    }

    public function tearDown(): void
    {
        // Drop cache manager singleton again
        GeneralUtility::purgeInstances();
        parent::tearDown();
    }

    /**
     * @test
     */
    public function renderAndCastToStringReturnsTheSameCode()
    {
        $this->assertEquals($this->subject->render(), (string)$this->subject);
    }

    /**
     * @test
     */
    public function getIdentifierReturnsCorrectIdentifier()
    {
        $this->assertEquals($this->iconIdentifier, $this->subject->getIdentifier());
    }

    /**
     * @test
     */
    public function getOverlayIdentifierReturnsCorrectIdentifier()
    {
        $this->assertEquals($this->overlayIdentifier, $this->subject->getOverlayIcon()->getIdentifier());
    }

    /**
     * @test
     */
    public function getSizedentifierReturnsCorrectIdentifier()
    {
        $this->assertEquals(Icon::SIZE_SMALL, $this->subject->getSize());
    }

    /**
     * @test
     */
    public function getStateReturnsCorrectIdentifier()
    {
        $this->assertTrue($this->subject->getState()->equals(IconState::STATE_DISABLED));
    }
}
