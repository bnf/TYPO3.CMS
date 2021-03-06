<?php
namespace TYPO3\CMS\Core\Tests\Unit\Messaging;

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
class FlashMessageServiceTest extends UnitTestCase
{
    /**
     * @var \TYPO3\CMS\Core\Messaging\FlashMessageService|\PHPUnit\Framework\MockObject\MockObject|\TYPO3\TestingFramework\Core\AccessibleObjectInterface
     */
    protected $flashMessageService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->flashMessageService = $this->getAccessibleMock(\TYPO3\CMS\Core\Messaging\FlashMessageService::class, ['dummy']);
    }

    /**
     * @test
     */
    public function flashMessageServiceInitiallyIsEmpty()
    {
        self::assertSame([], $this->flashMessageService->_get('flashMessageQueues'));
    }

    /**
     * @test
     */
    public function getMessageQueueByIdentifierRegistersNewFlashmessageQueuesOnlyOnce()
    {
        self::assertSame(
            $this->flashMessageService->getMessageQueueByIdentifier('core.template.flashMessages'),
            $this->flashMessageService->getMessageQueueByIdentifier('core.template.flashMessages')
        );
    }
}
