<?php
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

// Exit early if php requirement is not satisfied.
if (version_compare(PHP_VERSION, '7.2.0', '<')) {
    die('This version of TYPO3 CMS requires PHP 7.2 or above');
}

// Set up the application for the Frontend
call_user_func(function () {
    $classLoader = require __DIR__ . '/../../../../../../vendor/autoload.php';

    \TYPO3\CMS\Core\Core\ContainerFactory::create($classLoader)->get(\TYPO3\CMS\Frontend\Http\Application::class)->run();
});
