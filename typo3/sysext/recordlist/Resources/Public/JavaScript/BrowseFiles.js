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
define(["jquery","TYPO3/CMS/Backend/Utility/MessageUtility","./ElementBrowser","nprogress","TYPO3/CMS/Backend/LegacyTree","TYPO3/CMS/Core/Event/RegularEvent"],(function(e,t,n,l,i,o){"use strict";var s=TYPO3.Icons;class r{constructor(){i.noop(),r.File=new c,r.Selector=new a,e(()=>{r.elements=e("body").data("elements"),e("[data-close]").on("click",t=>{t.preventDefault(),r.File.insertElement("file_"+e(t.currentTarget).data("fileIndex"),1===parseInt(e(t.currentTarget).data("close"),10))}),new o("change",()=>{r.Selector.toggleImportButton()}).delegateTo(document,".typo3-bulk-item"),e("#t3js-importSelection").on("click",r.Selector.handle),e("#t3js-toggleSelection").on("click",r.Selector.toggle)})}}class c{insertElement(e,t){let l=!1;if(void 0!==r.elements[e]){const i=r.elements[e];l=n.insertElement(i.table,i.uid,i.type,i.fileName,i.filePath,i.fileExt,i.fileIcon,"",t)}return l}}class a{constructor(){this.toggle=e=>{e.preventDefault();const t=this.getItems();t.length&&t.each((e,t)=>{t.checked=t.checked?null:"checked"}),this.toggleImportButton()},this.handle=e=>{e.preventDefault();const t=this.getItems(),n=[];t.length&&(t.each((e,t)=>{t.checked&&t.name&&n.unshift(t.name)}),s.getIcon("spinner-circle",s.sizes.small,null,null,s.markupIdentifiers.inline).then(t=>{e.currentTarget.classList.add("disabled"),e.currentTarget.innerHTML=t}),this.handleSelection(n))}}getItems(){return e("#typo3-filelist").find(".typo3-bulk-item")}toggleImportButton(){const e=document.querySelectorAll("#typo3-filelist .typo3-bulk-item:checked").length>0;document.getElementById("t3js-importSelection").classList.toggle("disabled",!e)}handleSelection(e){l.configure({parent:"#typo3-filelist",showSpinner:!1}),l.start();const i=1/e.length;this.handleNext(e),new o("message",o=>{if(!t.MessageUtility.verifyOrigin(o.origin))throw"Denied message sent by "+o.origin;"typo3:foreignRelation:inserted"===o.data.actionName&&(e.length>0?(l.inc(i),this.handleNext(e)):(l.done(),n.focusOpenerAndClose()))}).bindTo(window)}handleNext(e){if(e.length>0){const t=e.pop();r.File.insertElement(t)}}}return new r}));