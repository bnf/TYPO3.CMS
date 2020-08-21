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
define(["./Enum/Severity","jquery","./AjaxDataHandler","TYPO3/CMS/Core/Ajax/AjaxRequest","./InfoWindow","./Modal","./ModuleMenu","TYPO3/CMS/Backend/Notification","./Viewport"],(function(e,t,n,a,r,i,o,s,l){"use strict";class c{static getReturnUrl(){return encodeURIComponent(top.list_frame.document.location.pathname+top.list_frame.document.location.search)}static editRecord(e,n){let a="",r=t(this).data("pages-language-uid");r&&(a="&overrideVals[pages][sys_language_uid]="+r),l.ContentContainer.setUrl(top.TYPO3.settings.FormEngine.moduleUrl+"&edit["+e+"]["+n+"]=edit"+a+"&returnUrl="+c.getReturnUrl())}static viewRecord(){const e=t(this).data("preview-url");if(e){window.open(e,"newTYPO3frontendWindow").focus()}}static openInfoPopUp(e,t){r.showItem(e,t)}static mountAsTreeRoot(e,t){"pages"===e&&l.NavigationContainer.PageTree.setTemporaryMountPoint(t)}static newPageWizard(e,t){l.ContentContainer.setUrl(top.TYPO3.settings.NewRecord.moduleUrl+"&id="+t+"&pagesOnly=1&returnUrl="+c.getReturnUrl())}static newContentWizard(){const n=t(this);let a=n.data("new-wizard-url");a&&(a+="&returnUrl="+c.getReturnUrl(),i.advanced({title:n.data("title"),type:i.types.ajax,size:i.sizes.medium,content:a,severity:e.SeverityEnum.notice}))}static newRecord(e,t){l.ContentContainer.setUrl(top.TYPO3.settings.FormEngine.moduleUrl+"&edit["+e+"][-"+t+"]=new&returnUrl="+c.getReturnUrl())}static openHistoryPopUp(e,t){l.ContentContainer.setUrl(top.TYPO3.settings.RecordHistory.moduleUrl+"&element="+e+":"+t+"&returnUrl="+c.getReturnUrl())}static openListModule(e,n){const a="pages"===e?n:t(this).data("page-uid");o.App.showModule("web_list","id="+a)}static pagesSort(){const e=t(this).data("pages-sort-url");e&&l.ContentContainer.setUrl(e)}static pagesNewMultiple(){const e=t(this).data("pages-new-multiple-url");e&&l.ContentContainer.setUrl(e)}static disableRecord(e,n){const a=t(this).data("disable-field")||"hidden";l.ContentContainer.setUrl(top.TYPO3.settings.RecordCommit.moduleUrl+"&data["+e+"]["+n+"]["+a+"]=1&redirect="+c.getReturnUrl()).done(()=>{l.NavigationContainer.PageTree.refreshTree()})}static enableRecord(e,n){const a=t(this).data("disable-field")||"hidden";l.ContentContainer.setUrl(top.TYPO3.settings.RecordCommit.moduleUrl+"&data["+e+"]["+n+"]["+a+"]=0&redirect="+c.getReturnUrl()).done(()=>{l.NavigationContainer.PageTree.refreshTree()})}static showInMenus(e,t){l.ContentContainer.setUrl(top.TYPO3.settings.RecordCommit.moduleUrl+"&data["+e+"]["+t+"][nav_hide]=0&redirect="+c.getReturnUrl()).done(()=>{l.NavigationContainer.PageTree.refreshTree()})}static hideInMenus(e,t){l.ContentContainer.setUrl(top.TYPO3.settings.RecordCommit.moduleUrl+"&data["+e+"]["+t+"][nav_hide]=1&redirect="+c.getReturnUrl()).done(()=>{l.NavigationContainer.PageTree.refreshTree()})}static deleteRecord(a,r){const o=t(this);i.confirm(o.data("title"),o.data("message"),e.SeverityEnum.warning,[{text:t(this).data("button-close-text")||TYPO3.lang["button.cancel"]||"Cancel",active:!0,btnClass:"btn-default",name:"cancel"},{text:t(this).data("button-ok-text")||TYPO3.lang["button.delete"]||"Delete",btnClass:"btn-warning",name:"delete"}]).on("button.clicked",e=>{if("delete"===e.target.getAttribute("name")){const e={component:"contextmenu",action:"delete",table:a,uid:r};n.process("cmd["+a+"]["+r+"][delete]=1",e).then(()=>{if("pages"===a&&l.NavigationContainer.PageTree){if(r===top.fsMod.recentIds.web){let e=l.NavigationContainer.PageTree.getFirstNode();l.NavigationContainer.PageTree.selectNode(e)}l.NavigationContainer.PageTree.refreshTree()}})}i.dismiss()})}static copy(e,t){const n=TYPO3.settings.ajaxUrls.contextmenu_clipboard+"&CB[el]["+e+"%7C"+t+"]=1&CB[setCopyMode]=1";new a(n).get().finally(()=>{c.triggerRefresh(l.ContentContainer.get().location.href)})}static clipboardRelease(e,t){const n=TYPO3.settings.ajaxUrls.contextmenu_clipboard+"&CB[el]["+e+"%7C"+t+"]=0";new a(n).get().finally(()=>{c.triggerRefresh(l.ContentContainer.get().location.href)})}static cut(e,t){const n=TYPO3.settings.ajaxUrls.contextmenu_clipboard+"&CB[el]["+e+"%7C"+t+"]=1&CB[setCopyMode]=0";new a(n).get().finally(()=>{c.triggerRefresh(l.ContentContainer.get().location.href)})}static triggerRefresh(e){e.includes("record%2Fedit")||l.ContentContainer.refresh()}static clearCache(e,t){new a(TYPO3.settings.ajaxUrls.web_list_clearpagecache).withQueryArguments({id:t}).get({cache:"no-cache"}).then(async e=>{const t=await e.resolve();!0===t.success?s.success(t.title,t.message,1):s.error(t.title,t.message,1)},()=>{s.error("Clearing page caches went wrong on the server side.")})}static pasteAfter(e,n){c.pasteInto.bind(t(this))(e,-n)}static pasteInto(n,a){const r=t(this),o=()=>{const e="&CB[paste]="+n+"%7C"+a+"&CB[pad]=normal&redirect="+c.getReturnUrl();l.ContentContainer.setUrl(top.TYPO3.settings.RecordCommit.moduleUrl+e).done(()=>{"pages"===n&&l.NavigationContainer.PageTree&&l.NavigationContainer.PageTree.refreshTree()})};r.data("title")?i.confirm(r.data("title"),r.data("message"),e.SeverityEnum.warning,[{text:t(this).data("button-close-text")||TYPO3.lang["button.cancel"]||"Cancel",active:!0,btnClass:"btn-default",name:"cancel"},{text:t(this).data("button-ok-text")||TYPO3.lang["button.ok"]||"OK",btnClass:"btn-warning",name:"ok"}]).on("button.clicked",e=>{"ok"===e.target.getAttribute("name")&&o(),i.dismiss()}):o()}}return c}));