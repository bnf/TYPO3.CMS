define(['../../../../core/Resources/Public/JavaScript/Contrib/jquery', '../../../../core/Resources/Public/JavaScript/Ajax/AjaxRequest', '../../../../backend/Resources/Public/JavaScript/Severity', '../../../../backend/Resources/Public/JavaScript/Modal', '../../../../backend/Resources/Public/JavaScript/Notification', '../../../../core/Resources/Public/JavaScript/Contrib/nprogress', '../../../../core/Resources/Public/JavaScript/Event/RegularEvent', '../../../../backend/Resources/Public/JavaScript/Input/Clearable', '../../../../core/Resources/Public/JavaScript/Contrib/tablesort'], function (jquery, AjaxRequest, Severity, Modal, Notification, nprogress, RegularEvent, Clearable, tablesort) { 'use strict';

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
    class Repository {
        constructor() {
            this.downloadPath = '';
            this.getDependencies = async (response) => {
                const data = await response.resolve();
                nprogress.done();
                if (data.hasDependencies) {
                    Modal.confirm(data.title, jquery(data.message), Severity.info, [
                        {
                            text: TYPO3.lang['button.cancel'],
                            active: true,
                            btnClass: 'btn-default',
                            trigger: () => {
                                Modal.dismiss();
                            },
                        }, {
                            text: TYPO3.lang['button.resolveDependencies'],
                            btnClass: 'btn-info',
                            trigger: () => {
                                this.getResolveDependenciesAndInstallResult(data.url
                                    + '&tx_extensionmanager_tools_extensionmanagerextensionmanager[downloadPath]=' + this.downloadPath);
                                Modal.dismiss();
                            },
                        },
                    ]);
                }
                else {
                    if (data.hasErrors) {
                        Notification.error(data.title, data.message, 15);
                    }
                    else {
                        this.getResolveDependenciesAndInstallResult(data.url
                            + '&tx_extensionmanager_tools_extensionmanagerextensionmanager[downloadPath]=' + this.downloadPath);
                    }
                }
            };
        }
        initDom() {
            nprogress.configure({ parent: '.module-loading-indicator', showSpinner: false });
            const terVersionTable = document.getElementById('terVersionTable');
            const terSearchTable = document.getElementById('terSearchTable');
            if (terVersionTable !== null) {
                new Tablesort(terVersionTable);
            }
            if (terSearchTable !== null) {
                new Tablesort(terSearchTable);
            }
            this.bindDownload();
            this.bindSearchFieldResetter();
        }
        bindDownload() {
            const me = this;
            new RegularEvent('click', function (e) {
                e.preventDefault();
                const form = this.closest('form');
                const url = form.dataset.href;
                me.downloadPath = form.querySelector('input.downloadPath:checked').value;
                nprogress.start();
                new AjaxRequest(url).get().then(me.getDependencies);
            }).delegateTo(document, '.downloadFromTer form.download button[type=submit]');
        }
        getResolveDependenciesAndInstallResult(url) {
            nprogress.start();
            new AjaxRequest(url).get().then(async (response) => {
                // FIXME: As of now, the endpoint doesn't set proper headers, thus we have to parse the response text
                // https://review.typo3.org/c/Packages/TYPO3.CMS/+/63438
                const data = await response.raw().json();
                if (data.errorCount > 0) {
                    Modal.confirm(data.errorTitle, jquery(data.errorMessage), Severity.error, [
                        {
                            text: TYPO3.lang['button.cancel'],
                            active: true,
                            btnClass: 'btn-default',
                            trigger: () => {
                                Modal.dismiss();
                            },
                        }, {
                            text: TYPO3.lang['button.resolveDependenciesIgnore'],
                            btnClass: 'btn-danger disabled t3js-dependencies',
                            trigger: (e) => {
                                if (!jquery(e.currentTarget).hasClass('disabled')) {
                                    this.getResolveDependenciesAndInstallResult(data.skipDependencyUri);
                                    Modal.dismiss();
                                }
                            },
                        },
                    ]);
                    Modal.currentModal.on('shown.bs.modal', () => {
                        const $actionButton = Modal.currentModal.find('.t3js-dependencies');
                        jquery('input[name="unlockDependencyIgnoreButton"]', Modal.currentModal).on('change', (e) => {
                            $actionButton.toggleClass('disabled', !jquery(e.currentTarget).prop('checked'));
                        });
                    });
                }
                else {
                    let successMessage = TYPO3.lang['extensionList.dependenciesResolveDownloadSuccess.message'
                        + data.installationTypeLanguageKey].replace(/\{0\}/g, data.extension);
                    successMessage += '\n' + TYPO3.lang['extensionList.dependenciesResolveDownloadSuccess.header'] + ': ';
                    jquery.each(data.result, (index, value) => {
                        successMessage += '\n\n' + TYPO3.lang['extensionList.dependenciesResolveDownloadSuccess.item'] + ' ' + index + ': ';
                        jquery.each(value, (extkey) => {
                            successMessage += '\n* ' + extkey;
                        });
                    });
                    Notification.info(TYPO3.lang['extensionList.dependenciesResolveFlashMessage.title' + data.installationTypeLanguageKey]
                        .replace(/\{0\}/g, data.extension), successMessage, 15);
                    top.TYPO3.ModuleMenu.App.refreshMenu();
                }
            }).finally(() => {
                nprogress.done();
            });
        }
        bindSearchFieldResetter() {
            let searchField;
            if ((searchField = document.querySelector('.typo3-extensionmanager-searchTerForm input[type="text"]')) !== null) {
                const searchResultShown = ('' !== searchField.value);
                // make search field clearable
                searchField.clearable({
                    onClear: (input) => {
                        if (searchResultShown) {
                            input.closest('form').submit();
                        }
                    },
                });
            }
        }
    }

    return Repository;

});