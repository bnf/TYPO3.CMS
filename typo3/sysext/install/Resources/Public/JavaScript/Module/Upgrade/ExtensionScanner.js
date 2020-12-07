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
define(["jquery","TYPO3/CMS/Core/Ajax/AjaxRequest","../AbstractInteractableModule","TYPO3/CMS/Backend/Modal","TYPO3/CMS/Backend/Notification","../../Ajax/AjaxQueue","../../Router","bootstrap"],(function(e,n,t,s,i,a,o){"use strict";class r extends t.AbstractInteractableModule{constructor(){super(...arguments),this.listOfAffectedRestFileHashes=[],this.selectorExtensionContainer=".t3js-extensionScanner-extension",this.selectorNumberOfFiles=".t3js-extensionScanner-number-of-files",this.selectorScanSingleTrigger=".t3js-extensionScanner-scan-single",this.selectorExtensionScanButton=".t3js-extensionScanner-scan-all"}initialize(n){this.currentModal=n,this.getData(),n.on("show.bs.collapse",this.selectorExtensionContainer,n=>{const t=e(n.currentTarget);if(void 0===t.data("scanned")){const e=t.data("extension");this.scanSingleExtension(e),t.data("scanned",!0)}}).on("hide.bs.modal",()=>{a.flush()}).on("click",this.selectorScanSingleTrigger,n=>{n.preventDefault();const t=e(n.currentTarget).closest(this.selectorExtensionContainer).data("extension");this.scanSingleExtension(t)}).on("click",this.selectorExtensionScanButton,e=>{e.preventDefault(),this.setModalButtonsState(!1);const t=n.find(this.selectorExtensionContainer);this.scanAll(t)})}getData(){const e=this.getModalBody();new n(o.getUrl("extensionScannerGetData")).get().then(async n=>{const t=await n.resolve();!0===t.success?(e.empty().append(t.html),s.setButtons(t.buttons)):i.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},n=>{o.handleAjaxError(n,e)})}getExtensionSelector(e){return this.selectorExtensionContainer+"-"+e}scanAll(n){this.findInModal(this.selectorExtensionContainer).removeClass("panel-danger panel-warning panel-success").find(".panel-progress-bar").css("width",0).attr("aria-valuenow",0).find("span").text("0%"),this.setProgressForAll(),n.each((n,t)=>{const s=e(t),i=s.data("extension");this.scanSingleExtension(i),s.data("scanned",!0)})}setStatusMessageForScan(e,n,t){this.findInModal(this.getExtensionSelector(e)).find(this.selectorNumberOfFiles).text("Checked "+n+" of "+t+" files")}setProgressForScan(e,n,t){const s=n/t*100;this.findInModal(this.getExtensionSelector(e)).find(".panel-progress-bar").css("width",s+"%").attr("aria-valuenow",s).find("span").text(s+"%")}setProgressForAll(){const e=this.findInModal(this.selectorExtensionContainer).length,t=this.findInModal(this.selectorExtensionContainer+".t3js-extensionscan-finished.panel-success").length+this.findInModal(this.selectorExtensionContainer+".t3js-extensionscan-finished.panel-warning").length+this.findInModal(this.selectorExtensionContainer+".t3js-extensionscan-finished.panel-danger").length,s=t/e*100,a=this.getModalBody();this.findInModal(".t3js-extensionScanner-progress-all-extension .progress-bar").css("width",s+"%").attr("aria-valuenow",s).find("span").text(t+" of "+e+" scanned"),t===e&&(this.findInModal(this.selectorExtensionScanButton).removeClass("disabled").prop("disabled",!1),i.success("Scan finished","All extensions have been scanned."),new n(o.getUrl()).post({install:{action:"extensionScannerMarkFullyScannedRestFiles",token:this.getModuleContent().data("extension-scanner-mark-fully-scanned-rest-files-token"),hashes:this.uniqueArray(this.listOfAffectedRestFileHashes)}}).then(async e=>{const n=await e.resolve();!0===n.success&&i.success("Marked not affected files","Marked "+n.markedAsNotAffected+" ReST files as not affected.")},e=>{o.handleAjaxError(e,a)}))}uniqueArray(e){return e.filter((e,n,t)=>t.indexOf(e)===n)}scanSingleExtension(t){const s=this.getModuleContent().data("extension-scanner-files-token"),r=this.getModalBody(),l=this.findInModal(this.getExtensionSelector(t));let c=!1;l.removeClass("panel-danger panel-warning panel-success t3js-extensionscan-finished"),l.data("hasRun","true"),l.find(".t3js-extensionScanner-scan-single").text("Scanning...").attr("disabled","disabled"),l.find(".t3js-extensionScanner-extension-body-loc").empty().text("0"),l.find(".t3js-extensionScanner-extension-body-ignored-files").empty().text("0"),l.find(".t3js-extensionScanner-extension-body-ignored-lines").empty().text("0"),this.setProgressForAll(),new n(o.getUrl()).post({install:{action:"extensionScannerFiles",token:s,extension:t}}).then(async n=>{const s=await n.resolve();if(!0===s.success&&Array.isArray(s.files)){const n=s.files.length;if(n<=0)return void i.warning("No files found","The extension "+t+" contains no scannable files");this.setStatusMessageForScan(t,0,n),l.find(".t3js-extensionScanner-extension-body").text("");let d=0;s.files.forEach(s=>{a.add({method:"POST",data:{install:{action:"extensionScannerScanFile",token:this.getModuleContent().data("extension-scanner-scan-file-token"),extension:t,file:s}},url:o.getUrl(),onfulfilled:async i=>{const a=await i.resolve();if(d++,this.setStatusMessageForScan(t,d,n),this.setProgressForScan(t,d,n),a.success&&e.isArray(a.matches)&&a.matches.forEach(n=>{c=!0;const t=r.find("#t3js-extensionScanner-file-hit-template").clone();t.find(".t3js-extensionScanner-hit-file-panel-head").attr("href","#collapse"+n.uniqueId),t.find(".t3js-extensionScanner-hit-file-panel-body").attr("id","collapse"+n.uniqueId),t.find(".t3js-extensionScanner-hit-filename").text(s),t.find(".t3js-extensionScanner-hit-message").text(n.message),"strong"===n.indicator?t.find(".t3js-extensionScanner-hit-file-panel-head .badges").append('<span class="badge" title="Reliable match, false positive unlikely">strong</span>'):t.find(".t3js-extensionScanner-hit-file-panel-head .badges").append('<span class="badge" title="Probable match, but can be a false positive">weak</span>'),!0===n.silenced&&t.find(".t3js-extensionScanner-hit-file-panel-head .badges").append('<span class="badge" title="Match has been annotated by extension author as false positive match">silenced</span>'),t.find(".t3js-extensionScanner-hit-file-lineContent").empty().text(n.lineContent),t.find(".t3js-extensionScanner-hit-file-line").empty().text(n.line+": "),e.isArray(n.restFiles)&&n.restFiles.forEach(e=>{const n=r.find("#t3js-extensionScanner-file-hit-rest-template").clone();n.find(".t3js-extensionScanner-hit-rest-panel-head").attr("href","#collapse"+e.uniqueId),n.find(".t3js-extensionScanner-hit-rest-panel-head .badge").empty().text(e.version),n.find(".t3js-extensionScanner-hit-rest-panel-body").attr("id","collapse"+e.uniqueId),n.find(".t3js-extensionScanner-hit-rest-headline").text(e.headline),n.find(".t3js-extensionScanner-hit-rest-body").text(e.content),n.addClass("panel-"+e.class),t.find(".t3js-extensionScanner-hit-file-rest-container").append(n),this.listOfAffectedRestFileHashes.push(e.file_hash)});const i=t.find(".panel-breaking",".t3js-extensionScanner-hit-file-rest-container").length>0?"panel-danger":"panel-warning";t.addClass(i),l.find(".t3js-extensionScanner-extension-body").removeClass("hide").append(t),"panel-danger"===i&&l.removeClass("panel-warning").addClass(i),"panel-warning"!==i||l.hasClass("panel-danger")||l.addClass(i)}),a.success){const e=parseInt(l.find(".t3js-extensionScanner-extension-body-loc").text(),10);if(l.find(".t3js-extensionScanner-extension-body-loc").empty().text(e+a.effectiveCodeLines),a.isFileIgnored){const e=parseInt(l.find(".t3js-extensionScanner-extension-body-ignored-files").text(),10);l.find(".t3js-extensionScanner-extension-body-ignored-files").empty().text(e+1)}const n=parseInt(l.find(".t3js-extensionScanner-extension-body-ignored-lines").text(),10);l.find(".t3js-extensionScanner-extension-body-ignored-lines").empty().text(n+a.ignoredLines)}d===n&&(c||l.addClass("panel-success"),l.addClass("t3js-extensionscan-finished"),this.setProgressForAll(),l.find(".t3js-extensionScanner-scan-single").text("Rescan").attr("disabled",null))},onrejected:e=>{d+=1,this.setStatusMessageForScan(t,d,n),this.setProgressForScan(t,d,n),this.setProgressForAll(),console.error(e)}})})}else i.error("Oops, an error occurred","Please look at the browser console output for details"),console.error(s)},e=>{o.handleAjaxError(e,r)})}}return new r}));