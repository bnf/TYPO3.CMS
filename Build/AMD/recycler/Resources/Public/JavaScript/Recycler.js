define(['../../../../core/Resources/Public/JavaScript/Contrib/jquery', '../../../../backend/Resources/Public/JavaScript/Severity', '../../../../backend/Resources/Public/JavaScript/Modal', '../../../../backend/Resources/Public/JavaScript/Notification', '../../../../core/Resources/Public/JavaScript/Contrib/nprogress', '../../../../backend/Resources/Public/JavaScript/Input/Clearable', '../../../../backend/Resources/Public/JavaScript/ActionButton/DeferredAction'], function (jquery, Severity, Modal, Notification, nprogress, Clearable, DeferredAction) { 'use strict';

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
    var RecyclerIdentifiers;
    (function (RecyclerIdentifiers) {
        RecyclerIdentifiers["searchForm"] = "#recycler-form";
        RecyclerIdentifiers["searchText"] = "#recycler-form [name=search-text]";
        RecyclerIdentifiers["searchSubmitBtn"] = "#recycler-form button[type=submit]";
        RecyclerIdentifiers["depthSelector"] = "#recycler-form [name=depth]";
        RecyclerIdentifiers["tableSelector"] = "#recycler-form [name=pages]";
        RecyclerIdentifiers["recyclerTable"] = "#itemsInRecycler";
        RecyclerIdentifiers["paginator"] = "#recycler-index nav";
        RecyclerIdentifiers["reloadAction"] = "a[data-action=reload]";
        RecyclerIdentifiers["massUndo"] = "button[data-action=massundo]";
        RecyclerIdentifiers["massDelete"] = "button[data-action=massdelete]";
        RecyclerIdentifiers["toggleAll"] = ".t3js-toggle-all";
    })(RecyclerIdentifiers || (RecyclerIdentifiers = {}));
    /**
     * Module: TYPO3/CMS/Recycler/Recycler
     * RequireJS module for Recycler
     */
    class Recycler {
        constructor() {
            this.elements = {}; // filled in getElements()
            this.paging = {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: TYPO3.settings.Recycler.pagingSize,
            };
            this.markedRecordsForMassAction = [];
            this.allToggled = false;
            /**
             * Handles the clicks on checkboxes in the records table
             */
            this.handleCheckboxSelects = (e) => {
                const $checkbox = jquery(e.currentTarget);
                const $tr = $checkbox.parents('tr');
                const table = $tr.data('table');
                const uid = $tr.data('uid');
                const record = table + ':' + uid;
                if ($checkbox.prop('checked')) {
                    this.markedRecordsForMassAction.push(record);
                    $tr.addClass('warning');
                }
                else {
                    const index = this.markedRecordsForMassAction.indexOf(record);
                    if (index > -1) {
                        this.markedRecordsForMassAction.splice(index, 1);
                    }
                    $tr.removeClass('warning');
                }
                if (this.markedRecordsForMassAction.length > 0) {
                    if (this.elements.$massUndo.hasClass('disabled')) {
                        this.elements.$massUndo.removeClass('disabled').removeAttr('disabled');
                    }
                    if (this.elements.$massDelete.hasClass('disabled')) {
                        this.elements.$massDelete.removeClass('disabled').removeAttr('disabled');
                    }
                    const btnTextUndo = this.createMessage(TYPO3.lang['button.undoselected'], [this.markedRecordsForMassAction.length]);
                    const btnTextDelete = this.createMessage(TYPO3.lang['button.deleteselected'], [this.markedRecordsForMassAction.length]);
                    this.elements.$massUndo.find('span.text').text(btnTextUndo);
                    this.elements.$massDelete.find('span.text').text(btnTextDelete);
                }
                else {
                    this.resetMassActionButtons();
                }
            };
            this.deleteRecord = (e) => {
                if (TYPO3.settings.Recycler.deleteDisable) {
                    return;
                }
                const $tr = jquery(e.currentTarget).parents('tr');
                const isMassDelete = $tr.parent().prop('tagName') !== 'TBODY'; // deleteRecord() was invoked by the mass delete button
                let records;
                let message;
                if (isMassDelete) {
                    records = this.markedRecordsForMassAction;
                    message = TYPO3.lang['modal.massdelete.text'];
                }
                else {
                    const uid = $tr.data('uid');
                    const table = $tr.data('table');
                    const recordTitle = $tr.data('recordtitle');
                    records = [table + ':' + uid];
                    message = table === 'pages' ? TYPO3.lang['modal.deletepage.text'] : TYPO3.lang['modal.deletecontent.text'];
                    message = this.createMessage(message, [recordTitle, '[' + records[0] + ']']);
                }
                Modal.confirm(TYPO3.lang['modal.delete.header'], message, Severity.error, [
                    {
                        text: TYPO3.lang['button.cancel'],
                        btnClass: 'btn-default',
                        trigger: function () {
                            Modal.dismiss();
                        },
                    }, {
                        text: TYPO3.lang['button.delete'],
                        btnClass: 'btn-danger',
                        action: new DeferredAction(() => {
                            return Promise.resolve(this.callAjaxAction('delete', records, isMassDelete));
                        }),
                    },
                ]);
            };
            this.undoRecord = (e) => {
                const $tr = jquery(e.currentTarget).parents('tr');
                const isMassUndo = $tr.parent().prop('tagName') !== 'TBODY'; // undoRecord() was invoked by the mass delete button
                let records;
                let messageText;
                let recoverPages;
                if (isMassUndo) {
                    records = this.markedRecordsForMassAction;
                    messageText = TYPO3.lang['modal.massundo.text'];
                    recoverPages = true;
                }
                else {
                    const uid = $tr.data('uid');
                    const table = $tr.data('table');
                    const recordTitle = $tr.data('recordtitle');
                    records = [table + ':' + uid];
                    recoverPages = table === 'pages';
                    messageText = recoverPages ? TYPO3.lang['modal.undopage.text'] : TYPO3.lang['modal.undocontent.text'];
                    messageText = this.createMessage(messageText, [recordTitle, '[' + records[0] + ']']);
                    if (recoverPages && $tr.data('parentDeleted')) {
                        messageText += TYPO3.lang['modal.undo.parentpages'];
                    }
                }
                let $message = null;
                if (recoverPages) {
                    $message = jquery('<div />').append(jquery('<p />').text(messageText), jquery('<div />', { class: 'checkbox' }).append(jquery('<label />').append(TYPO3.lang['modal.undo.recursive']).prepend(jquery('<input />', {
                        id: 'undo-recursive',
                        type: 'checkbox',
                    }))));
                }
                else {
                    $message = jquery('<p />').text(messageText);
                }
                Modal.confirm(TYPO3.lang['modal.undo.header'], $message, Severity.ok, [
                    {
                        text: TYPO3.lang['button.cancel'],
                        btnClass: 'btn-default',
                        trigger: function () {
                            Modal.dismiss();
                        },
                    }, {
                        text: TYPO3.lang['button.undo'],
                        btnClass: 'btn-success',
                        action: new DeferredAction(() => {
                            return Promise.resolve(this.callAjaxAction('undo', typeof records === 'object' ? records : [records], isMassUndo, $message.find('#undo-recursive').prop('checked')));
                        }),
                    },
                ]);
            };
            jquery(() => {
                this.initialize();
            });
        }
        /**
         * Reloads the page tree
         */
        static refreshPageTree() {
            if (top.TYPO3 && top.TYPO3.Backend && top.TYPO3.Backend.NavigationContainer && top.TYPO3.Backend.NavigationContainer.PageTree) {
                top.TYPO3.Backend.NavigationContainer.PageTree.refreshTree();
            }
        }
        /**
         * Gets required elements
         */
        getElements() {
            this.elements = {
                $searchForm: jquery(RecyclerIdentifiers.searchForm),
                $searchTextField: jquery(RecyclerIdentifiers.searchText),
                $searchSubmitBtn: jquery(RecyclerIdentifiers.searchSubmitBtn),
                $depthSelector: jquery(RecyclerIdentifiers.depthSelector),
                $tableSelector: jquery(RecyclerIdentifiers.tableSelector),
                $recyclerTable: jquery(RecyclerIdentifiers.recyclerTable),
                $tableBody: jquery(RecyclerIdentifiers.recyclerTable).find('tbody'),
                $paginator: jquery(RecyclerIdentifiers.paginator),
                $reloadAction: jquery(RecyclerIdentifiers.reloadAction),
                $massUndo: jquery(RecyclerIdentifiers.massUndo),
                $massDelete: jquery(RecyclerIdentifiers.massDelete),
                $toggleAll: jquery(RecyclerIdentifiers.toggleAll),
            };
        }
        /**
         * Register events
         */
        registerEvents() {
            // submitting the form
            this.elements.$searchForm.on('submit', (e) => {
                e.preventDefault();
                if (this.elements.$searchTextField.val() !== '') {
                    this.loadDeletedElements();
                }
            });
            // changing the search field
            this.elements.$searchTextField.on('keyup', (e) => {
                let $me = jquery(e.currentTarget);
                if ($me.val() !== '') {
                    this.elements.$searchSubmitBtn.removeClass('disabled');
                }
                else {
                    this.elements.$searchSubmitBtn.addClass('disabled');
                    this.loadDeletedElements();
                }
            });
            this.elements.$searchTextField.get(0).clearable({
                onClear: () => {
                    this.elements.$searchSubmitBtn.addClass('disabled');
                    this.loadDeletedElements();
                },
            });
            // changing "depth"
            this.elements.$depthSelector.on('change', () => {
                jquery.when(this.loadAvailableTables()).done(() => {
                    this.loadDeletedElements();
                });
            });
            // changing "table"
            this.elements.$tableSelector.on('change', () => {
                this.paging.currentPage = 1;
                this.loadDeletedElements();
            });
            // clicking "recover" in single row
            this.elements.$recyclerTable.on('click', '[data-action=undo]', this.undoRecord);
            // clicking "delete" in single row
            this.elements.$recyclerTable.on('click', '[data-action=delete]', this.deleteRecord);
            this.elements.$reloadAction.on('click', (e) => {
                e.preventDefault();
                jquery.when(this.loadAvailableTables()).done(() => {
                    this.loadDeletedElements();
                });
            });
            // clicking an action in the paginator
            this.elements.$paginator.on('click', 'a[data-action]', (e) => {
                e.preventDefault();
                const $el = jquery(e.currentTarget);
                let reload = false;
                switch ($el.data('action')) {
                    case 'previous':
                        if (this.paging.currentPage > 1) {
                            this.paging.currentPage--;
                            reload = true;
                        }
                        break;
                    case 'next':
                        if (this.paging.currentPage < this.paging.totalPages) {
                            this.paging.currentPage++;
                            reload = true;
                        }
                        break;
                    case 'page':
                        this.paging.currentPage = parseInt($el.find('span').text(), 10);
                        reload = true;
                        break;
                    default:
                }
                if (reload) {
                    this.loadDeletedElements();
                }
            });
            if (!TYPO3.settings.Recycler.deleteDisable) {
                this.elements.$massDelete.show();
            }
            else {
                this.elements.$massDelete.remove();
            }
            this.elements.$recyclerTable.on('show.bs.collapse hide.bs.collapse', 'tr.collapse', (e) => {
                let $trigger = jquery(e.currentTarget).prev('tr').find('[data-action=expand]'), $iconEl = $trigger.find('.t3-icon'), removeClass, addClass;
                switch (e.type) {
                    case 'show':
                        removeClass = 't3-icon-pagetree-collapse';
                        addClass = 't3-icon-pagetree-expand';
                        break;
                    case 'hide':
                        removeClass = 't3-icon-pagetree-expand';
                        addClass = 't3-icon-pagetree-collapse';
                        break;
                    default:
                }
                $iconEl.removeClass(removeClass).addClass(addClass);
            });
            // checkboxes in the table
            this.elements.$toggleAll.on('click', () => {
                this.allToggled = !this.allToggled;
                jquery('input[type="checkbox"]').prop('checked', this.allToggled).trigger('change');
            });
            this.elements.$recyclerTable.on('change', 'tr input[type=checkbox]', this.handleCheckboxSelects);
            this.elements.$massUndo.on('click', this.undoRecord);
            this.elements.$massDelete.on('click', this.deleteRecord);
        }
        /**
         * Initialize the recycler module
         */
        initialize() {
            nprogress.configure({ parent: '.module-loading-indicator', showSpinner: false });
            this.getElements();
            this.registerEvents();
            if (TYPO3.settings.Recycler.depthSelection > 0) {
                this.elements.$depthSelector.val(TYPO3.settings.Recycler.depthSelection).trigger('change');
            }
            else {
                jquery.when(this.loadAvailableTables()).done(() => {
                    this.loadDeletedElements();
                });
            }
        }
        /**
         * Resets the mass action state
         */
        resetMassActionButtons() {
            this.markedRecordsForMassAction = [];
            this.elements.$massUndo.addClass('disabled').attr('disabled', true);
            this.elements.$massUndo.find('span.text').text(TYPO3.lang['button.undo']);
            this.elements.$massDelete.addClass('disabled').attr('disabled', true);
            this.elements.$massDelete.find('span.text').text(TYPO3.lang['button.delete']);
        }
        /**
         * Loads all tables which contain deleted records.
         *
         */
        loadAvailableTables() {
            return jquery.ajax({
                url: TYPO3.settings.ajaxUrls.recycler,
                dataType: 'json',
                data: {
                    action: 'getTables',
                    startUid: TYPO3.settings.Recycler.startUid,
                    depth: this.elements.$depthSelector.find('option:selected').val(),
                },
                beforeSend: () => {
                    nprogress.start();
                    this.elements.$tableSelector.val('');
                    this.paging.currentPage = 1;
                },
                success: (data) => {
                    const tables = [];
                    this.elements.$tableSelector.children().remove();
                    jquery.each(data, (_, value) => {
                        const tableName = value[0];
                        const deletedRecords = value[1];
                        const tableDescription = value[2] ? value[2] : TYPO3.lang.label_allrecordtypes;
                        const optionText = tableDescription + ' (' + deletedRecords + ')';
                        tables.push(jquery('<option />').val(tableName).text(optionText));
                    });
                    if (tables.length > 0) {
                        this.elements.$tableSelector.append(tables);
                        if (TYPO3.settings.Recycler.tableSelection !== '') {
                            this.elements.$tableSelector.val(TYPO3.settings.Recycler.tableSelection);
                        }
                    }
                },
                complete: () => {
                    nprogress.done();
                },
            });
        }
        /**
         * Loads the deleted elements, based on the filters
         */
        loadDeletedElements() {
            return jquery.ajax({
                url: TYPO3.settings.ajaxUrls.recycler,
                dataType: 'json',
                data: {
                    action: 'getDeletedRecords',
                    depth: this.elements.$depthSelector.find('option:selected').val(),
                    startUid: TYPO3.settings.Recycler.startUid,
                    table: this.elements.$tableSelector.find('option:selected').val(),
                    filterTxt: this.elements.$searchTextField.val(),
                    start: (this.paging.currentPage - 1) * this.paging.itemsPerPage,
                    limit: this.paging.itemsPerPage,
                },
                beforeSend: () => {
                    nprogress.start();
                    this.resetMassActionButtons();
                },
                success: (data) => {
                    this.elements.$tableBody.html(data.rows);
                    this.buildPaginator(data.totalItems);
                },
                complete: () => {
                    nprogress.done();
                },
            });
        }
        /**
         * @param {string} action
         * @param {Object} records
         * @param {boolean} isMassAction
         * @param {boolean} recursive
         */
        callAjaxAction(action, records, isMassAction, recursive = false) {
            let data = {
                records: records,
                action: '',
            };
            let reloadPageTree = false;
            if (action === 'undo') {
                data.action = 'undoRecords';
                data.recursive = recursive ? 1 : 0;
                reloadPageTree = true;
            }
            else if (action === 'delete') {
                data.action = 'deleteRecords';
            }
            else {
                return;
            }
            return jquery.ajax({
                url: TYPO3.settings.ajaxUrls.recycler,
                type: 'POST',
                dataType: 'json',
                data: data,
                beforeSend: () => {
                    nprogress.start();
                },
                success: (responseData) => {
                    if (responseData.success) {
                        Notification.success('', responseData.message);
                    }
                    else {
                        Notification.error('', responseData.message);
                    }
                    // reload recycler data
                    this.paging.currentPage = 1;
                    jquery.when(this.loadAvailableTables()).done(() => {
                        this.loadDeletedElements();
                        if (isMassAction) {
                            this.resetMassActionButtons();
                        }
                        if (reloadPageTree) {
                            Recycler.refreshPageTree();
                        }
                        // Reset toggle state
                        this.allToggled = false;
                    });
                },
                complete: () => {
                    nprogress.done();
                },
            });
        }
        /**
         * Replaces the placeholders with actual values
         */
        createMessage(message, placeholders) {
            if (typeof message === 'undefined') {
                return '';
            }
            return message.replace(/\{([0-9]+)\}/g, function (_, index) {
                return placeholders[index];
            });
        }
        /**
         * Build the paginator
         */
        buildPaginator(totalItems) {
            if (totalItems === 0) {
                this.elements.$paginator.contents().remove();
                return;
            }
            this.paging.totalItems = totalItems;
            this.paging.totalPages = Math.ceil(totalItems / this.paging.itemsPerPage);
            if (this.paging.totalPages === 1) {
                // early abort if only one page is available
                this.elements.$paginator.contents().remove();
                return;
            }
            const $ul = jquery('<ul />', { class: 'pagination pagination-block' }), liElements = [], $controlFirstPage = jquery('<li />').append(jquery('<a />', { 'data-action': 'previous' }).append(jquery('<span />', { class: 't3-icon fa fa-arrow-left' }))), $controlLastPage = jquery('<li />').append(jquery('<a />', { 'data-action': 'next' }).append(jquery('<span />', { class: 't3-icon fa fa-arrow-right' })));
            if (this.paging.currentPage === 1) {
                $controlFirstPage.disablePagingAction();
            }
            if (this.paging.currentPage === this.paging.totalPages) {
                $controlLastPage.disablePagingAction();
            }
            for (let i = 1; i <= this.paging.totalPages; i++) {
                const $li = jquery('<li />', { class: this.paging.currentPage === i ? 'active' : '' });
                $li.append(jquery('<a />', { 'data-action': 'page' }).append(jquery('<span />').text(i)));
                liElements.push($li);
            }
            $ul.append($controlFirstPage, liElements, $controlLastPage);
            this.elements.$paginator.html($ul);
        }
    }
    /**
     * Changes the markup of a pagination action being disabled
     */
    jquery.fn.disablePagingAction = function () {
        jquery(this).addClass('disabled').find('.t3-icon').unwrap().wrap(jquery('<span />'));
    };
    var Recycler$1 = new Recycler();

    return Recycler$1;

});