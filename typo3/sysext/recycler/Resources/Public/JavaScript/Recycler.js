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
define(["jquery","nprogress","TYPO3/CMS/Backend/ActionButton/DeferredAction","TYPO3/CMS/Backend/Modal","TYPO3/CMS/Backend/Notification","TYPO3/CMS/Backend/Severity","TYPO3/CMS/Backend/Input/Clearable"],(function(e,t,a,s,n,l){"use strict";var i;!function(e){e.searchForm="#recycler-form",e.searchText="#recycler-form [name=search-text]",e.searchSubmitBtn="#recycler-form button[type=submit]",e.depthSelector="#recycler-form [name=depth]",e.tableSelector="#recycler-form [name=pages]",e.recyclerTable="#itemsInRecycler",e.paginator="#recycler-index nav",e.reloadAction="a[data-action=reload]",e.massUndo="button[data-action=massundo]",e.massDelete="button[data-action=massdelete]",e.toggleAll=".t3js-toggle-all"}(i||(i={}));class r{constructor(){this.elements={},this.paging={currentPage:1,totalPages:1,totalItems:0,itemsPerPage:TYPO3.settings.Recycler.pagingSize},this.markedRecordsForMassAction=[],this.allToggled=!1,this.handleCheckboxSelects=t=>{const a=e(t.currentTarget),s=a.parents("tr"),n=s.data("table")+":"+s.data("uid");if(a.prop("checked"))this.markedRecordsForMassAction.push(n),s.addClass("warning");else{const e=this.markedRecordsForMassAction.indexOf(n);e>-1&&this.markedRecordsForMassAction.splice(e,1),s.removeClass("warning")}if(this.markedRecordsForMassAction.length>0){this.elements.$massUndo.hasClass("disabled")&&this.elements.$massUndo.removeClass("disabled").removeAttr("disabled"),this.elements.$massDelete.hasClass("disabled")&&this.elements.$massDelete.removeClass("disabled").removeAttr("disabled");const e=this.createMessage(TYPO3.lang["button.undoselected"],[this.markedRecordsForMassAction.length]),t=this.createMessage(TYPO3.lang["button.deleteselected"],[this.markedRecordsForMassAction.length]);this.elements.$massUndo.find("span.text").text(e),this.elements.$massDelete.find("span.text").text(t)}else this.resetMassActionButtons()},this.deleteRecord=t=>{if(TYPO3.settings.Recycler.deleteDisable)return;const n=e(t.currentTarget).parents("tr"),i="TBODY"!==n.parent().prop("tagName");let r,o;if(i)r=this.markedRecordsForMassAction,o=TYPO3.lang["modal.massdelete.text"];else{const e=n.data("uid"),t=n.data("table"),a=n.data("recordtitle");r=[t+":"+e],o="pages"===t?TYPO3.lang["modal.deletepage.text"]:TYPO3.lang["modal.deletecontent.text"],o=this.createMessage(o,[a,"["+r[0]+"]"])}s.confirm(TYPO3.lang["modal.delete.header"],o,l.error,[{text:TYPO3.lang["button.cancel"],btnClass:"btn-default",trigger:function(){s.dismiss()}},{text:TYPO3.lang["button.delete"],btnClass:"btn-danger",action:new a(()=>Promise.resolve(this.callAjaxAction("delete",r,i)))}])},this.undoRecord=t=>{const n=e(t.currentTarget).parents("tr"),i="TBODY"!==n.parent().prop("tagName");let r,o,c;if(i)r=this.markedRecordsForMassAction,o=TYPO3.lang["modal.massundo.text"],c=!0;else{const e=n.data("uid"),t=n.data("table"),a=n.data("recordtitle");r=[t+":"+e],c="pages"===t,o=c?TYPO3.lang["modal.undopage.text"]:TYPO3.lang["modal.undocontent.text"],o=this.createMessage(o,[a,"["+r[0]+"]"]),c&&n.data("parentDeleted")&&(o+=TYPO3.lang["modal.undo.parentpages"])}let d=null;d=c?e("<div />").append(e("<p />").text(o),e("<div />",{class:"checkbox"}).append(e("<label />").append(TYPO3.lang["modal.undo.recursive"]).prepend(e("<input />",{id:"undo-recursive",type:"checkbox"})))):e("<p />").text(o),s.confirm(TYPO3.lang["modal.undo.header"],d,l.ok,[{text:TYPO3.lang["button.cancel"],btnClass:"btn-default",trigger:function(){s.dismiss()}},{text:TYPO3.lang["button.undo"],btnClass:"btn-success",action:new a(()=>Promise.resolve(this.callAjaxAction("undo","object"==typeof r?r:[r],i,d.find("#undo-recursive").prop("checked"))))}])},e(()=>{this.initialize()})}static refreshPageTree(){top.TYPO3&&top.TYPO3.Backend&&top.TYPO3.Backend.NavigationContainer&&top.TYPO3.Backend.NavigationContainer.PageTree&&top.TYPO3.Backend.NavigationContainer.PageTree.refreshTree()}getElements(){this.elements={$searchForm:e(i.searchForm),$searchTextField:e(i.searchText),$searchSubmitBtn:e(i.searchSubmitBtn),$depthSelector:e(i.depthSelector),$tableSelector:e(i.tableSelector),$recyclerTable:e(i.recyclerTable),$tableBody:e(i.recyclerTable).find("tbody"),$paginator:e(i.paginator),$reloadAction:e(i.reloadAction),$massUndo:e(i.massUndo),$massDelete:e(i.massDelete),$toggleAll:e(i.toggleAll)}}registerEvents(){this.elements.$searchForm.on("submit",e=>{e.preventDefault(),""!==this.elements.$searchTextField.val()&&this.loadDeletedElements()}),this.elements.$searchTextField.on("keyup",t=>{""!==e(t.currentTarget).val()?this.elements.$searchSubmitBtn.removeClass("disabled"):(this.elements.$searchSubmitBtn.addClass("disabled"),this.loadDeletedElements())}),this.elements.$searchTextField.get(0).clearable({onClear:()=>{this.elements.$searchSubmitBtn.addClass("disabled"),this.loadDeletedElements()}}),this.elements.$depthSelector.on("change",()=>{e.when(this.loadAvailableTables()).done(()=>{this.loadDeletedElements()})}),this.elements.$tableSelector.on("change",()=>{this.paging.currentPage=1,this.loadDeletedElements()}),this.elements.$recyclerTable.on("click","[data-action=undo]",this.undoRecord),this.elements.$recyclerTable.on("click","[data-action=delete]",this.deleteRecord),this.elements.$reloadAction.on("click",t=>{t.preventDefault(),e.when(this.loadAvailableTables()).done(()=>{this.loadDeletedElements()})}),this.elements.$paginator.on("click","a[data-action]",t=>{t.preventDefault();const a=e(t.currentTarget);let s=!1;switch(a.data("action")){case"previous":this.paging.currentPage>1&&(this.paging.currentPage--,s=!0);break;case"next":this.paging.currentPage<this.paging.totalPages&&(this.paging.currentPage++,s=!0);break;case"page":this.paging.currentPage=parseInt(a.find("span").text(),10),s=!0}s&&this.loadDeletedElements()}),TYPO3.settings.Recycler.deleteDisable?this.elements.$massDelete.remove():this.elements.$massDelete.show(),this.elements.$recyclerTable.on("show.bs.collapse hide.bs.collapse","tr.collapse",t=>{let a,s,n=e(t.currentTarget).prev("tr").find("[data-action=expand]").find(".t3-icon");switch(t.type){case"show":a="t3-icon-pagetree-collapse",s="t3-icon-pagetree-expand";break;case"hide":a="t3-icon-pagetree-expand",s="t3-icon-pagetree-collapse"}n.removeClass(a).addClass(s)}),this.elements.$toggleAll.on("click",()=>{this.allToggled=!this.allToggled,e('input[type="checkbox"]').prop("checked",this.allToggled).trigger("change")}),this.elements.$recyclerTable.on("change","tr input[type=checkbox]",this.handleCheckboxSelects),this.elements.$massUndo.on("click",this.undoRecord),this.elements.$massDelete.on("click",this.deleteRecord)}initialize(){t.configure({parent:".module-loading-indicator",showSpinner:!1}),this.getElements(),this.registerEvents(),TYPO3.settings.Recycler.depthSelection>0?this.elements.$depthSelector.val(TYPO3.settings.Recycler.depthSelection).trigger("change"):e.when(this.loadAvailableTables()).done(()=>{this.loadDeletedElements()})}resetMassActionButtons(){this.markedRecordsForMassAction=[],this.elements.$massUndo.addClass("disabled").attr("disabled",!0),this.elements.$massUndo.find("span.text").text(TYPO3.lang["button.undo"]),this.elements.$massDelete.addClass("disabled").attr("disabled",!0),this.elements.$massDelete.find("span.text").text(TYPO3.lang["button.delete"])}loadAvailableTables(){return e.ajax({url:TYPO3.settings.ajaxUrls.recycler,dataType:"json",data:{action:"getTables",startUid:TYPO3.settings.Recycler.startUid,depth:this.elements.$depthSelector.find("option:selected").val()},beforeSend:()=>{t.start(),this.elements.$tableSelector.val(""),this.paging.currentPage=1},success:t=>{const a=[];this.elements.$tableSelector.children().remove(),e.each(t,(t,s)=>{const n=s[0],l=s[1],i=(s[2]?s[2]:TYPO3.lang.label_allrecordtypes)+" ("+l+")";a.push(e("<option />").val(n).text(i))}),a.length>0&&(this.elements.$tableSelector.append(a),""!==TYPO3.settings.Recycler.tableSelection&&this.elements.$tableSelector.val(TYPO3.settings.Recycler.tableSelection))},complete:()=>{t.done()}})}loadDeletedElements(){return e.ajax({url:TYPO3.settings.ajaxUrls.recycler,dataType:"json",data:{action:"getDeletedRecords",depth:this.elements.$depthSelector.find("option:selected").val(),startUid:TYPO3.settings.Recycler.startUid,table:this.elements.$tableSelector.find("option:selected").val(),filterTxt:this.elements.$searchTextField.val(),start:(this.paging.currentPage-1)*this.paging.itemsPerPage,limit:this.paging.itemsPerPage},beforeSend:()=>{t.start(),this.resetMassActionButtons()},success:e=>{this.elements.$tableBody.html(e.rows),this.buildPaginator(e.totalItems)},complete:()=>{t.done()}})}callAjaxAction(a,s,l,i=!1){let o={records:s,action:""},c=!1;if("undo"===a)o.action="undoRecords",o.recursive=i?1:0,c=!0;else{if("delete"!==a)return;o.action="deleteRecords"}return e.ajax({url:TYPO3.settings.ajaxUrls.recycler,type:"POST",dataType:"json",data:o,beforeSend:()=>{t.start()},success:t=>{t.success?n.success("",t.message):n.error("",t.message),this.paging.currentPage=1,e.when(this.loadAvailableTables()).done(()=>{this.loadDeletedElements(),l&&this.resetMassActionButtons(),c&&r.refreshPageTree(),this.allToggled=!1})},complete:()=>{t.done()}})}createMessage(e,t){return void 0===e?"":e.replace(/\{([0-9]+)\}/g,(function(e,a){return t[a]}))}buildPaginator(t){if(0===t)return void this.elements.$paginator.contents().remove();if(this.paging.totalItems=t,this.paging.totalPages=Math.ceil(t/this.paging.itemsPerPage),1===this.paging.totalPages)return void this.elements.$paginator.contents().remove();const a=e("<ul />",{class:"pagination"}),s=[],n=e("<li />",{class:"page-item"}).append(e("<a />",{class:"page-link","data-action":"previous"}).append(e("<span />",{class:"t3-icon fa fa-arrow-left"}))),l=e("<li />",{class:"page-item"}).append(e("<a />",{class:"page-link","data-action":"next"}).append(e("<span />",{class:"t3-icon fa fa-arrow-right"})));1===this.paging.currentPage&&n.disablePagingAction(),this.paging.currentPage===this.paging.totalPages&&l.disablePagingAction();for(let t=1;t<=this.paging.totalPages;t++){const a=e("<li />",{class:"page-item"+(this.paging.currentPage===t?" active":"")});a.append(e("<a />",{class:"page-link","data-action":"page"}).append(e("<span />").text(t))),s.push(a)}a.append(n,s,l),this.elements.$paginator.html(a)}}return e.fn.disablePagingAction=function(){e(this).addClass("disabled").find(".t3-icon").unwrap().wrap(e("<span />",{class:"page-link"}))},new r}));