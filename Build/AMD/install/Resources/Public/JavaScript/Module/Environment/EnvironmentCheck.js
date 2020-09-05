define(['../../../../../../core/Resources/Public/JavaScript/Contrib/jquery', '../../../../../../core/Resources/Public/JavaScript/Ajax/AjaxRequest', '../../../../../../core/Resources/Public/JavaScript/Contrib/bootstrap', '../../../../../../backend/Resources/Public/JavaScript/Modal', '../../../../../../backend/Resources/Public/JavaScript/Notification', '../AbstractInteractableModule', '../../Renderable/Severity', '../../Renderable/InfoBox', '../../Renderable/ProgressBar', '../../Router'], function (jquery, AjaxRequest, bootstrap, Modal, Notification, AbstractInteractableModule, Severity, InfoBox, ProgressBar, Router) { 'use strict';

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
    /**
     * Module: TYPO3/CMS/Install/EnvironmentCheck
     */
    class EnvironmentCheck extends AbstractInteractableModule.AbstractInteractableModule {
        constructor() {
            super(...arguments);
            this.selectorGridderBadge = '.t3js-environmentCheck-badge';
            this.selectorExecuteTrigger = '.t3js-environmentCheck-execute';
            this.selectorOutputContainer = '.t3js-environmentCheck-output';
        }
        initialize(currentModal) {
            this.currentModal = currentModal;
            // Get status on initialize to have the badge and content ready
            this.runTests();
            currentModal.on('click', this.selectorExecuteTrigger, (e) => {
                e.preventDefault();
                this.runTests();
            });
        }
        runTests() {
            this.setModalButtonsState(false);
            const modalContent = this.getModalBody();
            const $errorBadge = jquery(this.selectorGridderBadge);
            $errorBadge.text('').hide();
            const message = ProgressBar.render(Severity.loading, 'Loading...', '');
            modalContent.find(this.selectorOutputContainer).empty().append(message);
            (new AjaxRequest(Router.getUrl('environmentCheckGetStatus')))
                .get({ cache: 'no-cache' })
                .then(async (response) => {
                const data = await response.resolve();
                modalContent.empty().append(data.html);
                Modal.setButtons(data.buttons);
                let warningCount = 0;
                let errorCount = 0;
                if (data.success === true && typeof (data.status) === 'object') {
                    jquery.each(data.status, (i, element) => {
                        if (Array.isArray(element) && element.length > 0) {
                            element.forEach((aStatus) => {
                                if (aStatus.severity === 1) {
                                    warningCount++;
                                }
                                if (aStatus.severity === 2) {
                                    errorCount++;
                                }
                                const aMessage = InfoBox.render(aStatus.severity, aStatus.title, aStatus.message);
                                modalContent.find(this.selectorOutputContainer).append(aMessage);
                            });
                        }
                    });
                    if (errorCount > 0) {
                        $errorBadge.removeClass('label-warning').addClass('label-danger').text(errorCount).show();
                    }
                    else if (warningCount > 0) {
                        $errorBadge.removeClass('label-error').addClass('label-warning').text(warningCount).show();
                    }
                }
                else {
                    Notification.error('Something went wrong', 'The request was not processed successfully. Please check the browser\'s console and TYPO3\'s log.');
                }
            }, (error) => {
                Router.handleAjaxError(error, modalContent);
            });
        }
    }
    var EnvironmentCheck$1 = new EnvironmentCheck();

    return EnvironmentCheck$1;

});