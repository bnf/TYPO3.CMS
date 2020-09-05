define(['./Enum/KeyTypes', '../../../../core/Resources/Public/JavaScript/Contrib/jquery', '../../../../core/Resources/Public/JavaScript/Ajax/AjaxRequest', '../../../../core/Resources/Public/JavaScript/SecurityUtility', './Severity', './Modal', './Utility/MessageUtility', '../../../../core/Resources/Public/JavaScript/Contrib/nprogress'], function (KeyTypes, jquery, AjaxRequest, SecurityUtility, Severity, Modal, MessageUtility, nprogress) { 'use strict';

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
     * Module: TYPO3/CMS/Backend/OnlineMedia
     * Javascript for show the online media dialog
     */
    class OnlineMedia {
        constructor() {
            this.securityUtility = new SecurityUtility();
            jquery(() => {
                this.registerEvents();
            });
        }
        registerEvents() {
            const me = this;
            jquery(document).on('click', '.t3js-online-media-add-btn', (e) => {
                me.triggerModal(jquery(e.currentTarget));
            });
        }
        /**
         * @param {JQuery} $trigger
         * @param {string} url
         */
        addOnlineMedia($trigger, url) {
            const target = $trigger.data('target-folder');
            const allowed = $trigger.data('online-media-allowed');
            const irreObjectUid = $trigger.data('file-irre-object');
            nprogress.start();
            new AjaxRequest(TYPO3.settings.ajaxUrls.online_media_create).post({
                url: url,
                targetFolder: target,
                allowed: allowed,
            }).then(async (response) => {
                const data = await response.resolve();
                if (data.file) {
                    const message = {
                        actionName: 'typo3:foreignRelation:insert',
                        objectGroup: irreObjectUid,
                        table: 'sys_file',
                        uid: data.file,
                    };
                    MessageUtility.MessageUtility.send(message);
                }
                else {
                    const $confirm = Modal.confirm('ERROR', data.error, Severity.error, [{
                            text: TYPO3.lang['button.ok'] || 'OK',
                            btnClass: 'btn-' + Severity.getCssClass(Severity.error),
                            name: 'ok',
                            active: true,
                        }]).on('confirm.button.ok', () => {
                        $confirm.modal('hide');
                    });
                }
                nprogress.done();
            });
        }
        /**
         * @param {JQuery} $currentTarget
         */
        triggerModal($currentTarget) {
            const btnSubmit = $currentTarget.data('btn-submit') || 'Add';
            const placeholder = $currentTarget.data('placeholder') || 'Paste media url here...';
            const allowedExtMarkup = jquery.map($currentTarget.data('online-media-allowed').split(','), (ext) => {
                return '<span class="label label-success">' + this.securityUtility.encodeHtml(ext.toUpperCase(), false) + '</span>';
            });
            const allowedHelpText = $currentTarget.data('online-media-allowed-help-text') || 'Allow to embed from sources:';
            const $markup = jquery('<div>')
                .attr('class', 'form-control-wrap')
                .append([
                jquery('<input>')
                    .attr('type', 'text')
                    .attr('class', 'form-control online-media-url')
                    .attr('placeholder', placeholder),
                jquery('<div>')
                    .attr('class', 'help-block')
                    .html(this.securityUtility.encodeHtml(allowedHelpText, false) + '<br>' + allowedExtMarkup.join(' ')),
            ]);
            const $modal = Modal.show($currentTarget.attr('title'), $markup, Severity.notice, [{
                    text: btnSubmit,
                    btnClass: 'btn btn-primary',
                    name: 'ok',
                    trigger: () => {
                        const url = $modal.find('input.online-media-url').val();
                        if (url) {
                            $modal.modal('hide');
                            this.addOnlineMedia($currentTarget, url);
                        }
                    },
                }]);
            $modal.on('shown.bs.modal', (e) => {
                // focus the input field
                jquery(e.currentTarget).find('input.online-media-url').first().focus().on('keydown', (kdEvt) => {
                    if (kdEvt.keyCode === KeyTypes.KeyTypesEnum.ENTER) {
                        $modal.find('button[name="ok"]').trigger('click');
                    }
                });
            });
        }
    }
    var OnlineMedia$1 = new OnlineMedia();

    return OnlineMedia$1;

});