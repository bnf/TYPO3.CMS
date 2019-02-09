<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Install\Controller;

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
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Core\Environment;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Fluid\View\StandaloneView;
use TYPO3\CMS\Install\Service\LateBootService;

/**
 * Controller abstract for shared parts of the install tool
 * @internal This class is a specific controller implementation and is not considered part of the Public TYPO3 API.
 */
class AbstractController
{
    /**
     * Helper method to initialize a standalone view instance.
     *
     * @param ServerRequestInterface $request
     * @param string $templatePath
     * @return StandaloneView
     * @internal param string $template
     */
    protected function initializeStandaloneView(ServerRequestInterface $request, string $templatePath): StandaloneView
    {
        $viewRootPath = GeneralUtility::getFileAbsFileName('EXT:install/Resources/Private/');
        $view = GeneralUtility::makeInstance(StandaloneView::class);
        $view->getRequest()->setControllerExtensionName('Install');
        $view->setTemplatePathAndFilename($viewRootPath . 'Templates/' . $templatePath);
        $view->setLayoutRootPaths([$viewRootPath . 'Layouts/']);
        $view->setPartialRootPaths([$viewRootPath . 'Partials/']);
        $view->assignMultiple([
            'controller' => $request->getQueryParams()['install']['controller'] ?? 'maintenance',
            'context' => $request->getQueryParams()['install']['context'] ?? '',
            'composerMode' => Environment::isComposerMode(),
        ]);
        return $view;
    }
}
