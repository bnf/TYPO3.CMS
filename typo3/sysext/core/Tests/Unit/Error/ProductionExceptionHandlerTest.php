<?php
namespace TYPO3\CMS\Core\Tests\Unit\Error;

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

use TYPO3\CMS\Core\Information\Typo3Information;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;

/**
 * testcase for the \TYPO3\CMS\Core\Error\ProductionExceptionHandler class.
 */
class ProductionExceptionHandlerTest extends UnitTestCase
{
    protected $resetSingletonInstances = true;

    /**
     * @var \TYPO3\CMS\Core\Error\ProductionExceptionHandler|\PHPUnit\Framework\MockObject\MockObject
     */
    protected $subject;

    /**
     * Sets up this test case.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->subject = $this->getMockBuilder(\TYPO3\CMS\Core\Error\ProductionExceptionHandler::class)
            ->setMethods(['discloseExceptionInformation', 'sendStatusHeaders', 'writeLogEntries'])
            ->disableOriginalConstructor()
            ->getMock();
        $this->subject->expects(self::any())->method('discloseExceptionInformation')->willReturn(true);
    }

    /**
     * @test
     */
    public function echoExceptionWebEscapesExceptionMessage()
    {
        $typo3InformationProphecy = $this->prophesize(Typo3Information::class);
        $typo3InformationProphecy->getCopyrightYear()->willReturn('1999-20XX');
        GeneralUtility::addInstance(Typo3Information::class, $typo3InformationProphecy->reveal());
        $message = '<b>b</b><script>alert(1);</script>';
        $exception = new \Exception($message, 1476049364);
        ob_start();
        $this->subject->echoExceptionWeb($exception);
        $output = ob_get_contents();
        ob_end_clean();
        self::assertStringContainsString(htmlspecialchars($message), $output);
        self::assertStringNotContainsString($message, $output);
    }

    /**
     * @test
     */
    public function echoExceptionWebEscapesExceptionTitle()
    {
        $typo3InformationProphecy = $this->prophesize(Typo3Information::class);
        $typo3InformationProphecy->getCopyrightYear()->willReturn('1999-20XX');
        GeneralUtility::addInstance(Typo3Information::class, $typo3InformationProphecy->reveal());
        $title = '<b>b</b><script>alert(1);</script>';
        /** @var $exception \Exception|\PHPUnit\Framework\MockObject\MockObject */
        $exception = $this->getMockBuilder('Exception')
            ->setMethods(['getTitle'])
            ->setConstructorArgs(['some message'])
            ->getMock();
        $exception->expects(self::any())->method('getTitle')->willReturn($title);
        ob_start();
        $this->subject->echoExceptionWeb($exception);
        $output = ob_get_contents();
        ob_end_clean();
        self::assertStringContainsString(htmlspecialchars($title), $output);
        self::assertStringNotContainsString($title, $output);
    }
}
