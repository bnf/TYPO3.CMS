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
define(["jquery","../AbstractInteractableModule","TYPO3/CMS/Backend/Notification","TYPO3/CMS/Core/Ajax/AjaxRequest","TYPO3/CMS/Core/SecurityUtility","../../Renderable/FlashMessage","../../Renderable/InfoBox","../../Renderable/ProgressBar","../../Renderable/Severity","../../Router","bootstrap"],(function(e,t,s,r,a,i,o,n,d,l){"use strict";class c extends t.AbstractInteractableModule{constructor(){super(),this.selectorOutputWizardsContainer=".t3js-upgradeWizards-wizards-output",this.selectorOutputDoneContainer=".t3js-upgradeWizards-done-output",this.selectorWizardsBlockingAddsTemplate=".t3js-upgradeWizards-blocking-adds-template",this.selectorWizardsBlockingAddsRows=".t3js-upgradeWizards-blocking-adds-rows",this.selectorWizardsBlockingAddsExecute=".t3js-upgradeWizards-blocking-adds-execute",this.selectorWizardsBlockingCharsetTemplate=".t3js-upgradeWizards-blocking-charset-template",this.selectorWizardsBlockingCharsetFix=".t3js-upgradeWizards-blocking-charset-fix",this.selectorWizardsDoneBodyTemplate=".t3js-upgradeWizards-done-body-template",this.selectorWizardsDoneRows=".t3js-upgradeWizards-done-rows",this.selectorWizardsDoneRowTemplate=".t3js-upgradeWizards-done-row-template table tr",this.selectorWizardsDoneRowMarkUndone=".t3js-upgradeWizards-done-markUndone",this.selectorWizardsDoneRowTitle=".t3js-upgradeWizards-done-title",this.selectorWizardsListTemplate=".t3js-upgradeWizards-list-template",this.selectorWizardsListRows=".t3js-upgradeWizards-list-rows",this.selectorWizardsListRowTemplate=".t3js-upgradeWizards-list-row-template",this.selectorWizardsListRowTitle=".t3js-upgradeWizards-list-row-title",this.selectorWizardsListRowExplanation=".t3js-upgradeWizards-list-row-explanation",this.selectorWizardsListRowExecute=".t3js-upgradeWizards-list-row-execute",this.selectorWizardsInputTemplate=".t3js-upgradeWizards-input",this.selectorWizardsInputTitle=".t3js-upgradeWizards-input-title",this.selectorWizardsInputHtml=".t3js-upgradeWizards-input-html",this.selectorWizardsInputPerform=".t3js-upgradeWizards-input-perform",this.securityUtility=new a}static removeLoadingMessage(e){e.find(".alert-loading").remove()}static renderProgressBar(e){return n.render(d.loading,e,"")}initialize(e){this.currentModal=e,this.getData().done(()=>{this.doneUpgrades()}),e.on("click",this.selectorWizardsDoneRowMarkUndone,e=>{this.markUndone(e.target.dataset.identifier)}),e.on("click",this.selectorWizardsBlockingCharsetFix,()=>{this.blockingUpgradesDatabaseCharsetFix()}),e.on("click",this.selectorWizardsBlockingAddsExecute,()=>{this.blockingUpgradesDatabaseAddsExecute()}),e.on("click",this.selectorWizardsListRowExecute,e=>{this.wizardInput(e.target.dataset.identifier,e.target.dataset.title)}),e.on("click",this.selectorWizardsInputPerform,e=>{this.wizardExecute(e.target.dataset.identifier,e.target.dataset.title)})}getData(){const e=this.getModalBody();return new r(l.getUrl("upgradeWizardsGetData")).get({cache:"no-cache"}).then(async t=>{const r=await t.resolve();!0===r.success?(e.empty().append(r.html),this.blockingUpgradesDatabaseCharsetTest()):s.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{l.handleAjaxError(e)})}blockingUpgradesDatabaseCharsetTest(){const e=this.getModalBody(),t=this.findInModal(this.selectorOutputWizardsContainer);t.empty().html(c.renderProgressBar("Checking database charset...")),new r(l.getUrl("upgradeWizardsBlockingDatabaseCharsetTest")).get({cache:"no-cache"}).then(async s=>{const r=await s.resolve();c.removeLoadingMessage(t),!0===r.success&&(!0===r.needsUpdate?e.find(this.selectorOutputWizardsContainer).append(e.find(this.selectorWizardsBlockingCharsetTemplate)).clone():this.blockingUpgradesDatabaseAdds())},e=>{l.handleAjaxError(e,t)})}blockingUpgradesDatabaseCharsetFix(){const t=e(this.selectorOutputWizardsContainer);t.empty().html(c.renderProgressBar("Setting database charset to UTF-8...")),new r(l.getUrl("upgradeWizardsBlockingDatabaseCharsetFix")).get({cache:"no-cache"}).then(async e=>{const s=await e.resolve();if(c.removeLoadingMessage(t),!0===s.success)Array.isArray(s.status)&&s.status.length>0&&s.status.forEach(e=>{const s=o.render(e.severity,e.title,e.message);t.append(s)});else{const e=i.render(d.error,"Something went wrong","");c.removeLoadingMessage(t),t.append(e)}},e=>{l.handleAjaxError(e,t)})}blockingUpgradesDatabaseAdds(){const e=this.getModalBody(),t=this.findInModal(this.selectorOutputWizardsContainer);t.empty().html(c.renderProgressBar("Check for missing mandatory database tables and fields...")),new r(l.getUrl("upgradeWizardsBlockingDatabaseAdds")).get({cache:"no-cache"}).then(async r=>{const a=await r.resolve();if(c.removeLoadingMessage(t),!0===a.success)if(!0===a.needsUpdate){const t=e.find(this.selectorWizardsBlockingAddsTemplate).clone();"object"==typeof a.adds.tables&&a.adds.tables.forEach(e=>{const s="Table: "+this.securityUtility.encodeHtml(e.table);t.find(this.selectorWizardsBlockingAddsRows).append(s,"<br>")}),"object"==typeof a.adds.columns&&a.adds.columns.forEach(e=>{const s="Table: "+this.securityUtility.encodeHtml(e.table)+", Field: "+this.securityUtility.encodeHtml(e.field);t.find(this.selectorWizardsBlockingAddsRows).append(s,"<br>")}),"object"==typeof a.adds.indexes&&a.adds.indexes.forEach(e=>{const s="Table: "+this.securityUtility.encodeHtml(e.table)+", Index: "+this.securityUtility.encodeHtml(e.index);t.find(this.selectorWizardsBlockingAddsRows).append(s,"<br>")}),e.find(this.selectorOutputWizardsContainer).append(t)}else this.wizardsList();else s.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{l.handleAjaxError(e)})}blockingUpgradesDatabaseAddsExecute(){const e=this.findInModal(this.selectorOutputWizardsContainer);e.empty().html(c.renderProgressBar("Adding database tables and fields...")),new r(l.getUrl("upgradeWizardsBlockingDatabaseExecute")).get({cache:"no-cache"}).then(async t=>{const s=await t.resolve();if(c.removeLoadingMessage(e),!0===s.success)Array.isArray(s.status)&&s.status.length>0&&(s.status.forEach(t=>{const s=o.render(t.severity,t.title,t.message);e.append(s)}),this.wizardsList());else{const t=i.render(d.error,"Something went wrong","");c.removeLoadingMessage(e),e.append(t)}},t=>{l.handleAjaxError(t,e)})}wizardsList(){const e=this.getModalBody(),t=this.findInModal(this.selectorOutputWizardsContainer);t.append(c.renderProgressBar("Loading upgrade wizards...")),new r(l.getUrl("upgradeWizardsList")).get({cache:"no-cache"}).then(async r=>{const a=await r.resolve();c.removeLoadingMessage(t);const i=e.find(this.selectorWizardsListTemplate).clone();if(i.removeClass("t3js-upgradeWizards-list-template"),!0===a.success){let t=0,s=0;Array.isArray(a.wizards)&&a.wizards.length>0&&(s=a.wizards.length,a.wizards.forEach(s=>{if(!0===s.shouldRenderWizard){const r=e.find(this.selectorWizardsListRowTemplate).clone();t+=1,r.removeClass("t3js-upgradeWizards-list-row-template"),r.find(this.selectorWizardsListRowTitle).empty().text(s.title),r.find(this.selectorWizardsListRowExplanation).empty().text(s.explanation),r.find(this.selectorWizardsListRowExecute).attr("data-identifier",s.identifier).attr("data-title",s.title),i.find(this.selectorWizardsListRows).append(r)}}),i.find(this.selectorWizardsListRows+" hr:last").remove());let r=100;const o=i.find(".progress-bar");t>0?r=Math.round((s-t)/a.wizards.length*100):o.removeClass("progress-bar-info").addClass("progress-bar-success"),o.removeClass("progress-bar-striped").css("width",r+"%").attr("aria-valuenow",r).find("span").text(r+"%"),e.find(this.selectorOutputWizardsContainer).append(i),this.findInModal(this.selectorWizardsDoneRowMarkUndone).prop("disabled",!1)}else s.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{l.handleAjaxError(e)})}wizardInput(e,t){const s=this.getModuleContent().data("upgrade-wizards-input-token"),a=this.getModalBody(),o=this.findInModal(this.selectorOutputWizardsContainer);o.empty().html(c.renderProgressBar('Loading "'+t+'"...')),a.animate({scrollTop:a.scrollTop()-Math.abs(a.find(".t3js-upgrade-status-section").position().top)},250),new r(l.getUrl("upgradeWizardsInput")).post({install:{action:"upgradeWizardsInput",token:s,identifier:e}}).then(async e=>{const t=await e.resolve();o.empty();const s=a.find(this.selectorWizardsInputTemplate).clone();s.removeClass("t3js-upgradeWizards-input"),!0===t.success&&(Array.isArray(t.status)&&t.status.forEach(e=>{const t=i.render(e.severity,e.title,e.message);o.append(t)}),t.userInput.wizardHtml.length>0&&s.find(this.selectorWizardsInputHtml).html(t.userInput.wizardHtml),s.find(this.selectorWizardsInputTitle).text(t.userInput.title),s.find(this.selectorWizardsInputPerform).attr("data-identifier",t.userInput.identifier).attr("data-title",t.userInput.title)),a.find(this.selectorOutputWizardsContainer).append(s)},e=>{l.handleAjaxError(e,o)})}wizardExecute(t,a){const i=this.getModuleContent().data("upgrade-wizards-execute-token"),n=this.getModalBody(),d={"install[action]":"upgradeWizardsExecute","install[token]":i,"install[identifier]":t};e(this.findInModal(this.selectorOutputWizardsContainer+" form").serializeArray()).each((e,t)=>{d[t.name]=t.value});const h=this.findInModal(this.selectorOutputWizardsContainer);h.empty().html(c.renderProgressBar('Executing "'+a+'"...')),this.findInModal(this.selectorWizardsDoneRowMarkUndone).prop("disabled",!0),new r(l.getUrl()).post(d).then(async e=>{const t=await e.resolve();h.empty(),!0===t.success?(Array.isArray(t.status)&&t.status.forEach(e=>{const t=o.render(e.severity,e.title,e.message);h.append(t)}),this.wizardsList(),n.find(this.selectorOutputDoneContainer).empty(),this.doneUpgrades()):s.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{l.handleAjaxError(e,h)})}doneUpgrades(){const e=this.getModalBody(),t=e.find(this.selectorOutputDoneContainer);t.empty().html(c.renderProgressBar("Loading executed upgrade wizards...")),new r(l.getUrl("upgradeWizardsDoneUpgrades")).get({cache:"no-cache"}).then(async r=>{const a=await r.resolve();if(c.removeLoadingMessage(t),!0===a.success){Array.isArray(a.status)&&a.status.length>0&&a.status.forEach(e=>{const s=o.render(e.severity,e.title,e.message);t.append(s)});const s=e.find(this.selectorWizardsDoneBodyTemplate).clone(),r=s.find(this.selectorWizardsDoneRows);let i=!1;Array.isArray(a.wizardsDone)&&a.wizardsDone.length>0&&a.wizardsDone.forEach(t=>{i=!0;const s=e.find(this.selectorWizardsDoneRowTemplate).clone();s.find(this.selectorWizardsDoneRowMarkUndone).attr("data-identifier",t.identifier),s.find(this.selectorWizardsDoneRowTitle).text(t.title),r.append(s)}),Array.isArray(a.rowUpdatersDone)&&a.rowUpdatersDone.length>0&&a.rowUpdatersDone.forEach(t=>{i=!0;const s=e.find(this.selectorWizardsDoneRowTemplate).clone();s.find(this.selectorWizardsDoneRowMarkUndone).attr("data-identifier",t.identifier),s.find(this.selectorWizardsDoneRowTitle).text(t.title),r.append(s)}),i&&(e.find(this.selectorOutputDoneContainer).append(s),this.findInModal(this.selectorWizardsDoneRowMarkUndone).prop("disabled",!0))}else s.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{l.handleAjaxError(e,t)})}markUndone(e){const t=this.getModuleContent().data("upgrade-wizards-mark-undone-token"),a=this.getModalBody(),i=this.findInModal(this.selectorOutputDoneContainer);i.empty().html(c.renderProgressBar("Marking upgrade wizard as undone...")),new r(l.getUrl()).post({install:{action:"upgradeWizardsMarkUndone",token:t,identifier:e}}).then(async e=>{const t=await e.resolve();i.empty(),a.find(this.selectorOutputDoneContainer).empty(),!0===t.success&&Array.isArray(t.status)?t.status.forEach(e=>{s.success(e.title,e.message),this.doneUpgrades(),this.blockingUpgradesDatabaseCharsetTest()}):s.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{l.handleAjaxError(e,i)})}}return new c}));