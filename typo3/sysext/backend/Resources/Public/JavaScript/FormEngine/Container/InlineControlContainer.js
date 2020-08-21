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
define(["jquery","../../Utility/MessageUtility","./../InlineRelation/AjaxDispatcher","nprogress","Sortable","TYPO3/CMS/Backend/FormEngine","TYPO3/CMS/Backend/FormEngineValidation","../../Icons","../../InfoWindow","../../Modal","../../Notification","TYPO3/CMS/Core/Event/RegularEvent","../../Severity","../../Utility"],(function(e,t,n,i,o,a,r,s,l,c,d,u,h,p){"use strict";var g,m,f,b;!function(e){e.toggleSelector='[data-toggle="formengine-inline"]',e.controlSectionSelector=".t3js-formengine-irre-control",e.createNewRecordButtonSelector=".t3js-create-new-button",e.createNewRecordBySelectorSelector=".t3js-create-new-selector",e.deleteRecordButtonSelector=".t3js-editform-delete-inline-record",e.enableDisableRecordButtonSelector=".t3js-toggle-visibility-button",e.infoWindowButton='[data-action="infowindow"]',e.synchronizeLocalizeRecordButtonSelector=".t3js-synchronizelocalize-button",e.uniqueValueSelectors="select.t3js-inline-unique",e.revertUniqueness=".t3js-revert-unique",e.controlContainerButtons=".t3js-inline-controls"}(g||(g={})),function(e){e.new="inlineIsNewRecord",e.visible="panel-visible",e.collapsed="panel-collapsed",e.notLoaded="t3js-not-loaded"}(m||(m={})),function(e){e.structureSeparator="-"}(f||(f={})),function(e){e.DOWN="down",e.UP="up"}(b||(b={}));class v{constructor(i){this.container=null,this.ajaxDispatcher=null,this.appearance=null,this.requestQueue={},this.progessQueue={},this.noTitleString=TYPO3.lang?TYPO3.lang["FormEngine.noRecordTitle"]:"[No title]",this.handlePostMessage=e=>{if(!t.MessageUtility.verifyOrigin(e.origin))throw"Denied message sent by "+e.origin;if("typo3:foreignRelation:insert"===e.data.actionName){if(void 0===e.data.objectGroup)throw"No object group defined for message";if(e.data.objectGroup!==this.container.dataset.objectGroup)return;if(this.isUniqueElementUsed(parseInt(e.data.uid,10),e.data.table))return void d.error("There is already a relation to the selected element");this.importRecord([e.data.objectGroup,e.data.uid]).then(()=>{if(e.source){const n={actionName:"typo3:foreignRelation:inserted",objectGroup:e.data.objectId,table:e.data.table,uid:e.data.uid};t.MessageUtility.send(n,e.source)}})}else console.warn(`Unhandled action "${e.data.actionName}"`)},e(()=>{this.container=document.getElementById(i),this.ajaxDispatcher=new n.AjaxDispatcher(this.container.dataset.objectGroup),this.registerEvents()})}static getInlineRecordContainer(e){return document.querySelector('[data-object-id="'+e+'"]')}static toggleElement(e){const t=v.getInlineRecordContainer(e);t.classList.contains(m.collapsed)?(t.classList.remove(m.collapsed),t.classList.add(m.visible)):(t.classList.remove(m.visible),t.classList.add(m.collapsed))}static isNewRecord(e){return v.getInlineRecordContainer(e).classList.contains(m.new)}static updateExpandedCollapsedStateLocally(e,t){const n=v.getInlineRecordContainer(e),i="uc[inlineView]["+n.dataset.topmostParentTable+"]["+n.dataset.topmostParentUid+"]"+n.dataset.fieldName,o=document.getElementsByName(i);o.length&&(o[0].value=t?"1":"0")}static getValuesFromHashMap(e){return Object.keys(e).map(t=>e[t])}static selectOptionValueExists(e,t){return null!==e.querySelector('option[value="'+t+'"]')}static removeSelectOptionByValue(e,t){const n=e.querySelector('option[value="'+t+'"]');null!==n&&n.remove()}static reAddSelectOption(e,t,n){if(v.selectOptionValueExists(e,t))return;const i=e.querySelectorAll("option");let o=-1;for(let e of Object.keys(n.possible)){if(e===t)break;for(let t=0;t<i.length;++t){if(i[t].value===e){o=t;break}}}-1===o?o=0:o<i.length&&o++;const a=document.createElement("option");a.text=n.possible[t],a.value=t,e.insertBefore(a,e.options[o])}registerEvents(){if(this.registerInfoButton(),this.registerSort(),this.registerCreateRecordButton(),this.registerEnableDisableButton(),this.registerDeleteButton(),this.registerSynchronizeLocalize(),this.registerRevertUniquenessAction(),this.registerToggle(),this.registerCreateRecordBySelector(),this.registerUniqueSelectFieldChanged(),new u("message",this.handlePostMessage).bindTo(window),this.getAppearance().useSortable){const e=document.getElementById(this.container.getAttribute("id")+"_records");new o(e,{group:e.getAttribute("id"),handle:".sortableHandle",onSort:()=>{this.updateSorting()}})}}registerToggle(){const e=this;new u("click",(function(t){t.preventDefault(),t.stopImmediatePropagation(),e.loadRecordDetails(this.closest(g.toggleSelector).parentElement.dataset.objectId)})).delegateTo(this.container,`${g.toggleSelector} .form-irre-header-cell:not(${g.controlSectionSelector}`)}registerSort(){const e=this;new u("click",(function(t){t.preventDefault(),t.stopImmediatePropagation(),e.changeSortingByButton(this.closest("[data-object-id]").dataset.objectId,this.dataset.direction)})).delegateTo(this.container,g.controlSectionSelector+' [data-action="sort"]')}registerCreateRecordButton(){const e=this;new u("click",(function(t){var n,i;if(t.preventDefault(),t.stopImmediatePropagation(),e.isBelowMax()){let t=e.container.dataset.objectGroup;void 0!==this.dataset.recordUid&&(t+=f.structureSeparator+this.dataset.recordUid),e.importRecord([t,null===(n=e.container.querySelector(g.createNewRecordBySelectorSelector))||void 0===n?void 0:n.value],null!==(i=this.dataset.recordUid)&&void 0!==i?i:null)}})).delegateTo(this.container,g.createNewRecordButtonSelector)}registerCreateRecordBySelector(){const e=this;new u("change",(function(t){t.preventDefault(),t.stopImmediatePropagation();const n=this.options[this.selectedIndex].getAttribute("value");e.importRecord([e.container.dataset.objectGroup,n])})).delegateTo(this.container,g.createNewRecordBySelectorSelector)}createRecord(e,t,n=null,i=null){let o=this.container.dataset.objectGroup;null!==n&&(o+=f.structureSeparator+n),null!==n?(v.getInlineRecordContainer(o).insertAdjacentHTML("afterend",t),this.memorizeAddRecord(e,n,i)):(document.getElementById(this.container.getAttribute("id")+"_records").insertAdjacentHTML("beforeend",t),this.memorizeAddRecord(e,null,i))}async importRecord(e,t){return this.ajaxDispatcher.send(this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint("record_inline_create")),e).then(async e=>{this.isBelowMax()&&(this.createRecord(e.compilerInput.uid,e.data,void 0!==t?t:null,void 0!==e.compilerInput.childChildUid?e.compilerInput.childChildUid:null),a.reinitialize(),a.Validation.initializeInputFields(),a.Validation.validate())})}registerEnableDisableButton(){new u("click",(e,t)=>{e.preventDefault(),e.stopImmediatePropagation();const n=t.closest("[data-object-id]").dataset.objectId,i=v.getInlineRecordContainer(n),o="data"+i.dataset.fieldName+"["+t.dataset.hiddenField+"]",a=document.querySelector('[data-formengine-input-name="'+o+'"'),r=document.querySelector('[name="'+o+'"');null!==a&&null!==r&&(a.checked=!a.checked,r.value=a.checked?"1":"0",TBE_EDITOR.fieldChanged(this.container.dataset.localTable,this.container.dataset.uid,this.container.dataset.localField,o));const l="t3-form-field-container-inline-hidden";let c="";i.classList.contains(l)?(c="actions-edit-hide",i.classList.remove(l)):(c="actions-edit-unhide",i.classList.add(l)),s.getIcon(c,s.sizes.small).then(e=>{t.replaceChild(document.createRange().createContextualFragment(e),t.querySelector(".t3js-icon"))})}).delegateTo(this.container,g.enableDisableRecordButtonSelector)}registerInfoButton(){new u("click",(function(e){e.preventDefault(),e.stopImmediatePropagation(),l.showItem(this.dataset.infoTable,this.dataset.infoUid)})).delegateTo(this.container,g.infoWindowButton)}registerDeleteButton(){const e=this;new u("click",(function(t){t.preventDefault(),t.stopImmediatePropagation();const n=TYPO3.lang["label.confirm.delete_record.title"]||"Delete this record?",i=TYPO3.lang["label.confirm.delete_record.content"]||"Are you sure you want to delete this record?";c.confirm(n,i,h.warning,[{text:TYPO3.lang["buttons.confirm.delete_record.no"]||"Cancel",active:!0,btnClass:"btn-default",name:"no"},{text:TYPO3.lang["buttons.confirm.delete_record.yes"]||"Yes, delete this record",btnClass:"btn-warning",name:"yes"}]).on("button.clicked",t=>{if("yes"===t.target.name){const t=this.closest("[data-object-id]").dataset.objectId;e.deleteRecord(t)}c.dismiss()})})).delegateTo(this.container,g.deleteRecordButtonSelector)}registerSynchronizeLocalize(){const e=this;new u("click",(function(t){t.preventDefault(),t.stopImmediatePropagation(),e.ajaxDispatcher.send(e.ajaxDispatcher.newRequest(e.ajaxDispatcher.getEndpoint("record_inline_synchronizelocalize")),[e.container.dataset.objectGroup,this.dataset.type]).then(async t=>{document.getElementById(e.container.getAttribute("id")+"_records").insertAdjacentHTML("beforeend",t.data);const n=e.container.dataset.objectGroup+f.structureSeparator;for(let i of t.compilerInput.delete)e.deleteRecord(n+i,!0);for(let i of Object.values(t.compilerInput.localize)){if(void 0!==i.remove){const e=v.getInlineRecordContainer(n+i.remove);e.parentElement.removeChild(e)}e.memorizeAddRecord(i.uid,null,i.selectedValue)}})})).delegateTo(this.container,g.synchronizeLocalizeRecordButtonSelector)}registerUniqueSelectFieldChanged(){const e=this;new u("change",(function(t){t.preventDefault(),t.stopImmediatePropagation();const n=this.closest("[data-object-id]");if(null!==n){const t=n.dataset.objectId,i=n.dataset.objectUid;e.handleChangedField(this,t);const o=e.getFormFieldForElements();if(null===o)return;e.updateUnique(this,o,i)}})).delegateTo(this.container,g.uniqueValueSelectors)}registerRevertUniquenessAction(){const e=this;new u("click",(function(t){t.preventDefault(),t.stopImmediatePropagation(),e.revertUnique(this.dataset.uid)})).delegateTo(this.container,g.revertUniqueness)}loadRecordDetails(e){const t=document.getElementById(e+"_fields"),n=v.getInlineRecordContainer(e),i=void 0!==this.requestQueue[e];if(null!==t&&!n.classList.contains(m.notLoaded))this.collapseExpandRecord(e);else{const o=this.getProgress(e,n.dataset.objectIdHash);if(i)this.requestQueue[e].abort(),delete this.requestQueue[e],delete this.progessQueue[e],o.done();else{const i=this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint("record_inline_details"));this.ajaxDispatcher.send(i,[e]).then(async i=>{if(delete this.requestQueue[e],delete this.progessQueue[e],n.classList.remove(m.notLoaded),t.innerHTML=i.data,this.collapseExpandRecord(e),o.done(),a.reinitialize(),a.Validation.initializeInputFields(),a.Validation.validate(),this.hasObjectGroupDefinedUniqueConstraints()){const t=v.getInlineRecordContainer(e);this.removeUsed(t)}}),this.requestQueue[e]=i,o.start()}}}collapseExpandRecord(e){const t=v.getInlineRecordContainer(e),n=!0===this.getAppearance().expandSingle,i=t.classList.contains(m.collapsed);let o=[];const a=[];n&&i&&(o=this.collapseAllRecords(t.dataset.objectUid)),v.toggleElement(e),v.isNewRecord(e)?v.updateExpandedCollapsedStateLocally(e,i):i?a.push(t.dataset.objectUid):i||o.push(t.dataset.objectUid),this.ajaxDispatcher.send(this.ajaxDispatcher.newRequest(this.ajaxDispatcher.getEndpoint("record_inline_expandcollapse")),[e,a.join(","),o.join(",")])}memorizeAddRecord(t,n=null,i=null){const o=this.getFormFieldForElements();if(null===o)return;let a=p.trimExplode(",",o.value);if(n){const e=[];for(let i=0;i<a.length;i++)a[i].length&&e.push(a[i]),n===a[i]&&e.push(t);a=e}else a.push(t);o.value=a.join(","),o.classList.add("has-change"),e(document).trigger("change"),this.redrawSortingButtons(this.container.dataset.objectGroup,a),this.setUnique(t,i),this.isBelowMax()||this.toggleContainerControls(!1),TBE_EDITOR.fieldChanged(this.container.dataset.localTable,this.container.dataset.uid,this.container.dataset.localField,o)}memorizeRemoveRecord(t){const n=this.getFormFieldForElements();if(null===n)return[];let i=p.trimExplode(",",n.value);const o=i.indexOf(t);return o>-1&&(delete i[o],n.value=i.join(","),n.classList.add("has-change"),e(document).trigger("change"),this.redrawSortingButtons(this.container.dataset.objectGroup,i)),i}changeSortingByButton(e,t){const n=v.getInlineRecordContainer(e),i=n.dataset.objectUid,o=document.getElementById(this.container.getAttribute("id")+"_records"),a=Array.from(o.children).map(e=>e.dataset.objectUid);let r=a.indexOf(i),s=!1;if(t===b.UP&&r>0?(a[r]=a[r-1],a[r-1]=i,s=!0):t===b.DOWN&&r<a.length-1&&(a[r]=a[r+1],a[r+1]=i,s=!0),s){const e=this.container.dataset.objectGroup+f.structureSeparator,i=t===b.UP?1:0;n.parentElement.insertBefore(v.getInlineRecordContainer(e+a[r-i]),v.getInlineRecordContainer(e+a[r+1-i])),this.updateSorting()}}updateSorting(){const t=this.getFormFieldForElements();if(null===t)return;const n=document.getElementById(this.container.getAttribute("id")+"_records"),i=Array.from(n.querySelectorAll('[data-placeholder-record="0"]')).map(e=>e.dataset.objectUid);t.value=i.join(","),t.classList.add("has-change"),e(document).trigger("inline:sorting-changed"),e(document).trigger("change"),this.redrawSortingButtons(this.container.dataset.objectGroup,i)}deleteRecord(e,t=!1){const n=v.getInlineRecordContainer(e),i=n.dataset.objectUid;if(n.classList.add("t3js-inline-record-deleted"),!v.isNewRecord(e)&&!t){const e=this.container.querySelector('[name="cmd'+n.dataset.fieldName+'[delete]"]');e.removeAttribute("disabled"),n.parentElement.insertAdjacentElement("afterbegin",e)}new u("transitionend",()=>{n.parentElement.removeChild(n),r.validate()}).bindTo(n),this.revertUnique(i),this.memorizeRemoveRecord(i),n.classList.add("form-irre-object--deleted"),this.isBelowMax()&&this.toggleContainerControls(!0)}toggleContainerControls(e){this.container.querySelectorAll(g.controlContainerButtons+" a").forEach(t=>{t.style.display=e?null:"none"})}getProgress(e,t){const n="#"+t+"_header";let o;return void 0!==this.progessQueue[e]?o=this.progessQueue[e]:(o=i,o.configure({parent:n,showSpinner:!1}),this.progessQueue[e]=o),o}collapseAllRecords(e){const t=this.getFormFieldForElements(),n=[];if(null!==t){const i=p.trimExplode(",",t.value);for(let t of i){if(t===e)continue;const i=this.container.dataset.objectGroup+f.structureSeparator+t,o=v.getInlineRecordContainer(i);o.classList.contains(m.visible)&&(o.classList.remove(m.visible),o.classList.add(m.collapsed),v.isNewRecord(i)?v.updateExpandedCollapsedStateLocally(i,!1):n.push(t))}}return n}getFormFieldForElements(){const e=document.getElementsByName(this.container.dataset.formField);return e.length>0?e[0]:null}redrawSortingButtons(e,t=[]){if(0===t.length){const e=this.getFormFieldForElements();null!==e&&(t=p.trimExplode(",",e.value))}0!==t.length&&t.forEach((n,i)=>{const o=v.getInlineRecordContainer(e+f.structureSeparator+n).dataset.objectIdHash+"_header",a=document.getElementById(o),r=a.querySelector('[data-action="sort"][data-direction="'+b.UP+'"]');if(null!==r){let e="actions-move-up";0===i?(r.classList.add("disabled"),e="empty-empty"):r.classList.remove("disabled"),s.getIcon(e,s.sizes.small).then(e=>{r.replaceChild(document.createRange().createContextualFragment(e),r.querySelector(".t3js-icon"))})}const l=a.querySelector('[data-action="sort"][data-direction="'+b.DOWN+'"]');if(null!==l){let e="actions-move-down";i===t.length-1?(l.classList.add("disabled"),e="empty-empty"):l.classList.remove("disabled"),s.getIcon(e,s.sizes.small).then(e=>{l.replaceChild(document.createRange().createContextualFragment(e),l.querySelector(".t3js-icon"))})}})}isBelowMax(){const e=this.getFormFieldForElements();if(null===e)return!0;if(void 0!==TYPO3.settings.FormEngineInline.config[this.container.dataset.objectGroup]){if(p.trimExplode(",",e.value).length>=TYPO3.settings.FormEngineInline.config[this.container.dataset.objectGroup].max)return!1;if(this.hasObjectGroupDefinedUniqueConstraints()){const e=TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];if(e.used.length>=e.max&&e.max>=0)return!1}}return!0}isUniqueElementUsed(e,t){if(!this.hasObjectGroupDefinedUniqueConstraints())return!1;const n=TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup],i=v.getValuesFromHashMap(n.used);if("select"===n.type&&-1!==i.indexOf(e))return!0;if("groupdb"===n.type)for(let n=i.length-1;n>=0;n--)if(i[n].table===t&&i[n].uid===e)return!0;return!1}removeUsed(e){if(!this.hasObjectGroupDefinedUniqueConstraints())return;const t=TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];if("select"!==t.type)return;let n=e.querySelector('[name="data['+t.table+"]["+e.dataset.objectUid+"]["+t.field+']"]');const i=v.getValuesFromHashMap(t.used);if(null!==n){const e=n.options[n.selectedIndex].value;for(let t of i)t!==e&&v.removeSelectOptionByValue(n,t)}}setUnique(e,t){if(!this.hasObjectGroupDefinedUniqueConstraints())return;const n=document.getElementById(this.container.dataset.objectGroup+"_selector"),i=TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup];if("select"===i.type){if(!i.selector||-1!==i.max){const o=this.getFormFieldForElements(),a=this.container.dataset.objectGroup+f.structureSeparator+e;let r=v.getInlineRecordContainer(a).querySelector('[name="data['+i.table+"]["+e+"]["+i.field+']"]');const s=v.getValuesFromHashMap(i.used);if(null!==n){if(null!==r){for(let e of s)v.removeSelectOptionByValue(r,e);i.selector||(t=r.options[0].value,r.options[0].selected=!0,this.updateUnique(r,o,e),this.handleChangedField(r,this.container.dataset.objectGroup+"["+e+"]"))}for(let e of s)v.removeSelectOptionByValue(r,e);void 0!==i.used.length&&(i.used={}),i.used[e]={table:i.elTable,uid:t}}if(null!==o&&v.selectOptionValueExists(n,t)){const n=p.trimExplode(",",o.value);for(let o of n)r=document.querySelector('[name="data['+i.table+"]["+o+"]["+i.field+']"]'),null!==r&&o!==e&&v.removeSelectOptionByValue(r,t)}}}else"groupdb"===i.type&&(i.used[e]={table:i.elTable,uid:t});"select"===i.selector&&v.selectOptionValueExists(n,t)&&(v.removeSelectOptionByValue(n,t),i.used[e]={table:i.elTable,uid:t})}updateUnique(e,t,n){if(!this.hasObjectGroupDefinedUniqueConstraints())return;const i=TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup],o=i.used[n];if("select"===i.selector){const t=document.getElementById(this.container.dataset.objectGroup+"_selector");v.removeSelectOptionByValue(t,e.value),void 0!==o&&v.reAddSelectOption(t,o,i)}if(i.selector&&-1===i.max)return;if(!i||null===t)return;const a=p.trimExplode(",",t.value);let r;for(let t of a)r=document.querySelector('[name="data['+i.table+"]["+t+"]["+i.field+']"]'),null!==r&&r!==e&&(v.removeSelectOptionByValue(r,e.value),void 0!==o&&v.reAddSelectOption(r,o,i));i.used[n]=e.value}revertUnique(e){if(!this.hasObjectGroupDefinedUniqueConstraints())return;const t=TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup],n=this.container.dataset.objectGroup+f.structureSeparator+e,i=v.getInlineRecordContainer(n);let o=i.querySelector('[name="data['+t.table+"]["+i.dataset.objectUid+"]["+t.field+']"]');if("select"===t.type){let n;if(null!==o)n=o.value;else{if(""===i.dataset.tableUniqueOriginalValue)return;n=i.dataset.tableUniqueOriginalValue}if("select"===t.selector&&!isNaN(parseInt(n,10))){const e=document.getElementById(this.container.dataset.objectGroup+"_selector");v.reAddSelectOption(e,n,t)}if(t.selector&&-1===t.max)return;const a=this.getFormFieldForElements();if(null===a)return;const r=p.trimExplode(",",a.value);let s;for(let e=0;e<r.length;e++)s=document.querySelector('[name="data['+t.table+"]["+r[e]+"]["+t.field+']"]'),null!==s&&v.reAddSelectOption(s,n,t);delete t.used[e]}else"groupdb"===t.type&&delete t.used[e]}hasObjectGroupDefinedUniqueConstraints(){return void 0!==TYPO3.settings.FormEngineInline.unique&&void 0!==TYPO3.settings.FormEngineInline.unique[this.container.dataset.objectGroup]}handleChangedField(e,t){let n;n=e instanceof HTMLSelectElement?e.options[e.selectedIndex].text:e.value,document.getElementById(t+"_label").textContent=n.length?n:this.noTitleString}getAppearance(){if(null===this.appearance&&(this.appearance={},"string"==typeof this.container.dataset.appearance))try{this.appearance=JSON.parse(this.container.dataset.appearance)}catch(e){console.error(e)}return this.appearance}}return v}));