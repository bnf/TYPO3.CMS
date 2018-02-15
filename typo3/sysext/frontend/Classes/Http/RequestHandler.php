<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Frontend\Http;

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

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface as PsrRequestHandlerInterface;
use TYPO3\CMS\Backend\FrontendBackendUserAuthentication;
use TYPO3\CMS\Core\Core\Bootstrap;
use TYPO3\CMS\Core\FrontendEditing\FrontendEditingController;
use TYPO3\CMS\Core\Http\NullResponse;
use TYPO3\CMS\Core\Http\RequestHandlerInterface;
use TYPO3\CMS\Core\TimeTracker\TimeTracker;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Utility\MathUtility;
use TYPO3\CMS\Frontend\Controller\TypoScriptFrontendController;
use TYPO3\CMS\Frontend\Page\PageGenerator;
use TYPO3\CMS\Frontend\Utility\CompressionUtility;
use TYPO3\CMS\Frontend\View\AdminPanelView;

/**
 * This is the main entry point of the TypoScript driven standard front-end
 *
 * Basically put, this is the script which all requests for TYPO3 delivered pages goes to in the
 * frontend (the website). The script instantiates a $TSFE object, includes libraries and does a little logic here
 * and there in order to instantiate the right classes to create the webpage.
 * Previously, this was called index_ts.php and also included the logic for the lightweight "eID" concept,
 * which is now handled in a separate middleware (EidHandler).
 */
class RequestHandler implements RequestHandlerInterface, PsrRequestHandlerInterface
{
    /**
     * Instance of the timetracker
     * @var TimeTracker
     */
    protected $timeTracker;

    /**
     * Instance of the TSFE object
     * @var TypoScriptFrontendController
     */
    protected $controller;

    /**
     * The request handed over
     * @var ServerRequestInterface
     */
    protected $request;

    /**
     * Handles a frontend request
     *
     * @param ServerRequestInterface $request
     * @return ResponseInterface
     */
    public function handleRequest(ServerRequestInterface $request): ResponseInterface
    {
        return $this->handle($request);
    }

    /**
     * Handles a frontend request, after finishing running middlewares
     *
     * @param ServerRequestInterface $request
     * @return ResponseInterface|null
     */
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $response = null;
        $this->request = $request;
        // Fetch the initialized time tracker object
        $this->timeTracker = GeneralUtility::makeInstance(TimeTracker::class);
        $this->initializeController();

        if ($GLOBALS['TYPO3_CONF_VARS']['FE']['pageUnavailable_force']
            && !GeneralUtility::cmpIP(
                GeneralUtility::getIndpEnv('REMOTE_ADDR'),
                $GLOBALS['TYPO3_CONF_VARS']['SYS']['devIPmask']
            )
        ) {
            $this->controller->pageUnavailableAndExit('This page is temporarily unavailable.');
        }

        $this->controller->connectToDB();

        // Output compression
        // Remove any output produced until now
        Bootstrap::endOutputBufferingAndCleanPreviousOutput();
        $this->initializeOutputCompression();

        // Initializing the Frontend User
        $this->timeTracker->push('Front End user initialized', '');
        $this->controller->initFEuser();
        $this->timeTracker->pull();

        // Initializing a possible logged-in Backend User
        /** @var $GLOBALS['BE_USER'] \TYPO3\CMS\Backend\FrontendBackendUserAuthentication */
        $GLOBALS['BE_USER'] = $this->controller->initializeBackendUser();

        // Process the ID, type and other parameters.
        // After this point we have an array, $page in TSFE, which is the page-record
        // of the current page, $id.
        $this->timeTracker->push('Process ID', '');
        // Initialize admin panel since simulation settings are required here:
        if ($this->controller->isBackendUserLoggedIn()) {
            $GLOBALS['BE_USER']->initializeAdminPanel();
            Bootstrap::initializeBackendRouter();
            Bootstrap::loadExtTables();
        }
        $this->controller->checkAlternativeIdMethods();
        $this->controller->clear_preview();
        $this->controller->determineId();

        // Now, if there is a backend user logged in and he has NO access to this page,
        // then re-evaluate the id shown! _GP('ADMCMD_noBeUser') is placed here because
        // \TYPO3\CMS\Version\Hook\PreviewHook might need to know if a backend user is logged in.
        if (
            $this->controller->isBackendUserLoggedIn()
            && (!$GLOBALS['BE_USER']->extPageReadAccess($this->controller->page) || GeneralUtility::_GP('ADMCMD_noBeUser'))
        ) {
            // Remove user
            unset($GLOBALS['BE_USER']);
            $this->controller->beUserLogin = false;
            // Re-evaluate the page-id.
            $this->controller->checkAlternativeIdMethods();
            $this->controller->clear_preview();
            $this->controller->determineId();
        }

        $this->controller->makeCacheHash();
        $this->timeTracker->pull();

        // Admin Panel & Frontend editing
        if ($this->controller->isBackendUserLoggedIn()) {
            $GLOBALS['BE_USER']->initializeFrontendEdit();
            if ($GLOBALS['BE_USER']->adminPanel instanceof AdminPanelView) {
                Bootstrap::initializeLanguageObject();
            }
            if ($GLOBALS['BE_USER']->frontendEdit instanceof FrontendEditingController) {
                $GLOBALS['BE_USER']->frontendEdit->initConfigOptions();
            }
        }

        // Starts the template
        $this->timeTracker->push('Start Template', '');
        $this->controller->initTemplate();
        $this->timeTracker->pull();
        // Get from cache
        $this->timeTracker->push('Get Page from cache', '');
        $this->controller->getFromCache();
        $this->timeTracker->pull();
        // Get config if not already gotten
        // After this, we should have a valid config-array ready
        $this->controller->getConfigArray();
        // Setting language and locale
        $this->timeTracker->push('Setting language and locale', '');
        $this->controller->settingLanguage();
        $this->controller->settingLocale();
        $this->timeTracker->pull();

        // Convert POST data to utf-8 for internal processing if metaCharset is different
        $this->controller->convPOSTCharset();

        $this->controller->initializeRedirectUrlHandlers();

        $this->controller->handleDataSubmission();

        // Check for shortcut page and redirect
        $this->controller->checkPageForShortcutRedirect();
        $this->controller->checkPageForMountpointRedirect();

        // Generate page
        $this->controller->setUrlIdToken();
        $this->timeTracker->push('Page generation', '');
        if ($this->controller->isGeneratePage()) {
            $this->controller->generatePage_preProcessing();
            $this->controller->preparePageContentGeneration();
            // Content generation
            if (!$this->controller->isINTincScript()) {
                PageGenerator::renderContent();
                $this->controller->setAbsRefPrefix();
            }
            $this->controller->generatePage_postProcessing();
        } elseif ($this->controller->isINTincScript()) {
            $this->controller->preparePageContentGeneration();
        }
        $this->controller->releaseLocks();
        $this->timeTracker->pull();

        // Render non-cached parts
        if ($this->controller->isINTincScript()) {
            $this->timeTracker->push('Non-cached objects', '');
            $this->controller->INTincScript();
            $this->timeTracker->pull();
        }

        // Output content
        $sendTSFEContent = false;
        if ($this->controller->isOutputting()) {
            $this->timeTracker->push('Print Content', '');
            $this->controller->processOutput();
            $sendTSFEContent = true;
            $this->timeTracker->pull();
        }
        // Store session data for fe_users
        $this->controller->storeSessionData();

        // Create a Response object when sending content
        if ($sendTSFEContent) {
            $response = GeneralUtility::makeInstance(\TYPO3\CMS\Core\Http\Response::class);
        }

        // Statistics
        $GLOBALS['TYPO3_MISC']['microtime_end'] = microtime(true);
        if ($sendTSFEContent) {
            if (isset($this->controller->config['config']['debug'])) {
                $includeParseTime = (bool)$this->controller->config['config']['debug'];
            } else {
                $includeParseTime = !empty($GLOBALS['TYPO3_CONF_VARS']['FE']['debug']);
            }
            if ($includeParseTime) {
                $response = $response->withHeader('X-TYPO3-Parsetime', $this->timeTracker->getParseTime() . 'ms');
            }
        }
        $redirectResponse = $this->controller->redirectToExternalUrl();
        if ($redirectResponse instanceof ResponseInterface) {
            return $redirectResponse;
        }

        // Preview info
        $this->controller->previewInfo();
        // Hook for end-of-frontend
        $this->controller->hook_eofe();
        // Finish timetracking
        $this->timeTracker->pull();

        // Admin panel
        if ($this->controller->isBackendUserLoggedIn() && $GLOBALS['BE_USER'] instanceof FrontendBackendUserAuthentication) {
            if ($GLOBALS['BE_USER']->isAdminPanelVisible()) {
                $this->controller->content = str_ireplace('</body>', $GLOBALS['BE_USER']->displayAdminPanel() . '</body>', $this->controller->content);
            }
        }

        if ($sendTSFEContent) {
            $response->getBody()->write($this->controller->content);
        }

        return $response ?: new NullResponse();
    }

    /**
     * This request handler can handle any frontend request.
     *
     * @param ServerRequestInterface $request
     * @return bool If the request is not an eID request, TRUE otherwise FALSE
     */
    public function canHandleRequest(ServerRequestInterface $request): bool
    {
        return true;
    }

    /**
     * Returns the priority - how eager the handler is to actually handle the
     * request.
     *
     * @return int The priority of the request handler.
     */
    public function getPriority(): int
    {
        return 50;
    }

    /**
     * Initializes output compression when enabled, could be split up and put into Bootstrap
     * at a later point
     */
    protected function initializeOutputCompression()
    {
        if ($GLOBALS['TYPO3_CONF_VARS']['FE']['compressionLevel'] && extension_loaded('zlib')) {
            if (MathUtility::canBeInterpretedAsInteger($GLOBALS['TYPO3_CONF_VARS']['FE']['compressionLevel'])) {
                @ini_set('zlib.output_compression_level', (string)$GLOBALS['TYPO3_CONF_VARS']['FE']['compressionLevel']);
            }
            ob_start([GeneralUtility::makeInstance(CompressionUtility::class), 'compressionOutputHandler']);
        }
    }

    /**
     * Creates an instance of TSFE and sets it as a global variable
     */
    protected function initializeController()
    {
        $this->controller = GeneralUtility::makeInstance(
            TypoScriptFrontendController::class,
            null,
            GeneralUtility::_GP('id'),
            GeneralUtility::_GP('type'),
            GeneralUtility::_GP('no_cache'),
            GeneralUtility::_GP('cHash'),
            null,
            GeneralUtility::_GP('MP')
        );
        // setting the global variable for the controller
        // We have to define this as reference here, because there is code around
        // which exchanges the TSFE object in the global variable. The reference ensures
        // that the $controller member always works on the same object as the global variable.
        // This is a dirty workaround and bypasses the protected access modifier of the controller member.
        $GLOBALS['TSFE'] = &$this->controller;
    }
}
