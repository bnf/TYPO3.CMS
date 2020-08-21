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
define(["jquery","TYPO3/CMS/Backend/Enum/Severity","./Workspaces","TYPO3/CMS/Backend/Modal","TYPO3/CMS/Backend/Storage/Persistent","TYPO3/CMS/Backend/Tooltip","TYPO3/CMS/Backend/Utility","TYPO3/CMS/Backend/Viewport","TYPO3/CMS/Backend/Wizard","TYPO3/CMS/Core/SecurityUtility","nprogress","TYPO3/CMS/Backend/Input/Clearable"],(function($,a,Workspaces,Modal,Persistent,Tooltip,Utility,Viewport,Wizard,SecurityUtility){"use strict";var Identifiers;!function(e){e.searchForm="#workspace-settings-form",e.searchTextField='#workspace-settings-form input[name="search-text"]',e.searchSubmitBtn='#workspace-settings-form button[type="submit"]',e.depthSelector='#workspace-settings-form [name="depth"]',e.languageSelector='#workspace-settings-form select[name="languages"]',e.chooseStageAction='#workspace-actions-form [name="stage-action"]',e.chooseSelectionAction='#workspace-actions-form [name="selection-action"]',e.chooseMassAction='#workspace-actions-form [name="mass-action"]',e.container="#workspace-panel",e.actionIcons="#workspace-action-icons",e.toggleAll=".t3js-toggle-all",e.previewLinksButton=".t3js-preview-link",e.pagination="#workspace-pagination"}(Identifiers||(Identifiers={}));class Backend extends Workspaces{constructor(){super(),this.elements={},this.settings={dir:"ASC",id:TYPO3.settings.Workspaces.id,language:TYPO3.settings.Workspaces.language,limit:30,query:"",sort:"label_Live",start:0,filterTxt:""},this.paging={currentPage:1,totalPages:1,totalItems:0},this.allToggled=!1,this.latestPath="",this.markedRecordsForMassAction=[],this.indentationPadding=26,this.handleCheckboxChange=e=>{const t=$(e.currentTarget),a=t.parents("tr"),s=a.data("table")+":"+a.data("uid")+":"+a.data("t3ver_oid");if(t.prop("checked"))this.markedRecordsForMassAction.push(s),a.addClass("warning");else{const e=this.markedRecordsForMassAction.indexOf(s);e>-1&&this.markedRecordsForMassAction.splice(e,1),a.removeClass("warning")}this.elements.$chooseStageAction.prop("disabled",0===this.markedRecordsForMassAction.length),this.elements.$chooseSelectionAction.prop("disabled",0===this.markedRecordsForMassAction.length),this.elements.$chooseMassAction.prop("disabled",this.markedRecordsForMassAction.length>0)},this.viewChanges=e=>{e.preventDefault();const t=$(e.currentTarget).closest("tr");this.sendRemoteRequest(this.generateRemotePayload("getRowDetails",{stage:t.data("stage"),t3ver_oid:t.data("t3ver_oid"),table:t.data("table"),uid:t.data("uid")})).then(async e=>{const s=(await e.resolve())[0].result.data[0],n=$("<div />"),i=$("<ul />",{class:"nav nav-tabs",role:"tablist"}),o=$("<div />",{class:"tab-content"}),r=[];n.append($("<p />").html(TYPO3.lang.path.replace("{0}",s.path_Live)),$("<p />").html(TYPO3.lang.current_step.replace("{0}",s.label_Stage).replace("{1}",s.stage_position).replace("{2}",s.stage_count))),s.diff.length>0&&(i.append($("<li />",{role:"presentation"}).append($("<a />",{href:"#workspace-changes","aria-controls":"workspace-changes",role:"tab","data-toggle":"tab"}).text(TYPO3.lang["window.recordChanges.tabs.changeSummary"]))),o.append($("<div />",{role:"tabpanel",class:"tab-pane",id:"workspace-changes"}).append($("<div />",{class:"form-section"}).append(Backend.generateDiffView(s.diff))))),s.comments.length>0&&(i.append($("<li />",{role:"presentation"}).append($("<a />",{href:"#workspace-comments","aria-controls":"workspace-comments",role:"tab","data-toggle":"tab"}).html(TYPO3.lang["window.recordChanges.tabs.comments"]+"&nbsp;").append($("<span />",{class:"badge"}).text(s.comments.length)))),o.append($("<div />",{role:"tabpanel",class:"tab-pane",id:"workspace-comments"}).append($("<div />",{class:"form-section"}).append(Backend.generateCommentView(s.comments))))),s.history.total>0&&(i.append($("<li />",{role:"presentation"}).append($("<a />",{href:"#workspace-history","aria-controls":"workspace-history",role:"tab","data-toggle":"tab"}).text(TYPO3.lang["window.recordChanges.tabs.history"]))),o.append($("<div />",{role:"tabpanel",class:"tab-pane",id:"workspace-history"}).append($("<div />",{class:"form-section"}).append(Backend.generateHistoryView(s.history.data))))),i.find("li").first().addClass("active"),o.find(".tab-pane").first().addClass("active"),n.append($("<div />").append(i,o)),t.data("stage")!==t.data("prevStage")&&r.push({text:s.label_PrevStage.title,active:!0,btnClass:"btn-default",name:"prevstage",trigger:()=>{Modal.currentModal.trigger("modal-dismiss"),this.sendToStage(t,"prev")}}),r.push({text:s.label_NextStage.title,active:!0,btnClass:"btn-default",name:"nextstage",trigger:()=>{Modal.currentModal.trigger("modal-dismiss"),this.sendToStage(t,"next")}}),r.push({text:TYPO3.lang.close,active:!0,btnClass:"btn-info",name:"cancel",trigger:()=>{Modal.currentModal.trigger("modal-dismiss")}}),Modal.advanced({type:Modal.types.default,title:TYPO3.lang["window.recordInformation"].replace("{0}",t.find(".t3js-title-live").text().trim()),content:n,severity:a.SeverityEnum.info,buttons:r,size:Modal.sizes.medium})})},this.openPreview=e=>{const $tr=$(e.currentTarget).closest("tr");this.sendRemoteRequest(this.generateRemoteActionsPayload("viewSingleRecord",[$tr.data("table"),$tr.data("uid")])).then(async response=>{eval((await response.resolve())[0].result)})},this.confirmDeleteRecordFromWorkspace=e=>{const t=$(e.target).closest("tr"),s=Modal.confirm(TYPO3.lang["window.discard.title"],TYPO3.lang["window.discard.message"],a.SeverityEnum.warning,[{text:TYPO3.lang.cancel,active:!0,btnClass:"btn-default",name:"cancel",trigger:()=>{s.modal("hide")}},{text:TYPO3.lang.ok,btnClass:"btn-warning",name:"ok"}]);s.on("button.clicked",e=>{"ok"===e.target.name&&this.sendRemoteRequest([this.generateRemoteActionsPayload("deleteSingleRecord",[t.data("table"),t.data("uid")])]).then(()=>{s.modal("hide"),this.getWorkspaceInfos(),Backend.refreshPageTree()})})},this.runSelectionAction=()=>{const e=this.elements.$chooseSelectionAction.val(),t="discard"!==e;if(0===e.length)return;const a=[];for(let e=0;e<this.markedRecordsForMassAction.length;++e){const t=this.markedRecordsForMassAction[e].split(":");a.push({table:t[0],liveId:t[2],versionId:t[1]})}t?this.checkIntegrity({selection:a,type:"selection"}).then(async t=>{Wizard.setForceSelection(!1),"warning"===(await t.resolve())[0].result.result&&this.addIntegrityCheckWarningToWizard(),this.renderSelectionActionWizard(e,a)}):(Wizard.setForceSelection(!1),this.renderSelectionActionWizard(e,a))},this.addIntegrityCheckWarningToWizard=()=>{Wizard.addSlide("integrity-warning","Warning",TYPO3.lang["integrity.hasIssuesDescription"]+"<br>"+TYPO3.lang["integrity.hasIssuesQuestion"],a.SeverityEnum.warning)},this.runMassAction=()=>{const e=this.elements.$chooseMassAction.val(),t="discard"!==e;0!==e.length&&(t?this.checkIntegrity({language:this.settings.language,type:e}).then(async t=>{Wizard.setForceSelection(!1),"warning"===(await t.resolve())[0].result.result&&this.addIntegrityCheckWarningToWizard(),this.renderMassActionWizard(e)}):(Wizard.setForceSelection(!1),this.renderMassActionWizard(e)))},this.sendToSpecificStageAction=e=>{const t=[],a=$(e.currentTarget).val();for(let e=0;e<this.markedRecordsForMassAction.length;++e){const a=this.markedRecordsForMassAction[e].split(":");t.push({table:a[0],uid:a[1],t3ver_oid:a[2]})}this.sendRemoteRequest(this.generateRemoteActionsPayload("sendToSpecificStageWindow",[a,t])).then(async e=>{const s=this.renderSendToStageWindow(await e.resolve());s.on("button.clicked",e=>{if("ok"===e.target.name){const n=Utility.convertFormToObject(e.currentTarget.querySelector("form"));n.affects={elements:t,nextStage:a},this.sendRemoteRequest([this.generateRemoteActionsPayload("sendToSpecificStageExecute",[n]),this.generateRemotePayload("getWorkspaceInfos",this.settings)]).then(async e=>{const t=await e.resolve();s.modal("hide"),this.renderWorkspaceInfos(t[1].result),Backend.refreshPageTree()})}}).on("modal-destroyed",()=>{this.elements.$chooseStageAction.val("")})})},this.generatePreviewLinks=()=>{this.sendRemoteRequest(this.generateRemoteActionsPayload("generateWorkspacePreviewLinksForAllLanguages",[this.settings.id])).then(async e=>{const t=(await e.resolve())[0].result,s=$("<dl />");$.each(t,(e,t)=>{s.append($("<dt />").text(e),$("<dd />").append($("<a />",{href:t,target:"_blank"}).text(t)))}),Modal.show(TYPO3.lang.previewLink,s,a.SeverityEnum.info,[{text:TYPO3.lang.ok,active:!0,btnClass:"btn-info",name:"ok",trigger:()=>{Modal.currentModal.trigger("modal-dismiss")}}],["modal-inner-scroll"])})},$(()=>{let e;this.getElements(),this.registerEvents(),Persistent.isset("this.Module.depth")?(e=Persistent.get("this.Module.depth"),this.elements.$depthSelector.val(e),this.settings.depth=e):this.settings.depth=TYPO3.settings.Workspaces.depth,this.loadWorkspaceComponents()})}static refreshPageTree(){Viewport.NavigationContainer&&Viewport.NavigationContainer.PageTree&&Viewport.NavigationContainer.PageTree.refreshTree()}static generateDiffView(e){const t=$("<div />",{class:"diff"});for(let a of e)t.append($("<div />",{class:"diff-item"}).append($("<div />",{class:"diff-item-title"}).text(a.label),$("<div />",{class:"diff-item-result diff-item-result-inline"}).html(a.content)));return t}static generateCommentView(e){const t=$("<div />");for(let a of e){const e=$("<div />",{class:"panel panel-default"});a.user_comment.length>0&&e.append($("<div />",{class:"panel-body"}).html(a.user_comment)),e.append($("<div />",{class:"panel-footer"}).append($("<span />",{class:"label label-success"}).text(a.stage_title),$("<span />",{class:"label label-info"}).text(a.tstamp))),t.append($("<div />",{class:"media"}).append($("<div />",{class:"media-left text-center"}).text(a.user_username).prepend($("<div />").html(a.user_avatar)),$("<div />",{class:"media-body"}).append(e)))}return t}static generateHistoryView(e){const t=$("<div />");for(let a of e){const e=$("<div />",{class:"panel panel-default"});let s;if("object"==typeof a.differences){if(0===a.differences.length)continue;s=$("<div />",{class:"diff"});for(let e=0;e<a.differences.length;++e)s.append($("<div />",{class:"diff-item"}).append($("<div />",{class:"diff-item-title"}).text(a.differences[e].label),$("<div />",{class:"diff-item-result diff-item-result-inline"}).html(a.differences[e].html)));e.append($("<div />").append(s))}else e.append($("<div />",{class:"panel-body"}).text(a.differences));e.append($("<div />",{class:"panel-footer"}).append($("<span />",{class:"label label-info"}).text(a.datetime))),t.append($("<div />",{class:"media"}).append($("<div />",{class:"media-left text-center"}).text(a.user).prepend($("<div />").html(a.user_avatar)),$("<div />",{class:"media-body"}).append(e)))}return t}getElements(){this.elements.$searchForm=$(Identifiers.searchForm),this.elements.$searchTextField=$(Identifiers.searchTextField),this.elements.$searchSubmitBtn=$(Identifiers.searchSubmitBtn),this.elements.$depthSelector=$(Identifiers.depthSelector),this.elements.$languageSelector=$(Identifiers.languageSelector),this.elements.$container=$(Identifiers.container),this.elements.$tableBody=this.elements.$container.find("tbody"),this.elements.$actionIcons=$(Identifiers.actionIcons),this.elements.$toggleAll=$(Identifiers.toggleAll),this.elements.$chooseStageAction=$(Identifiers.chooseStageAction),this.elements.$chooseSelectionAction=$(Identifiers.chooseSelectionAction),this.elements.$chooseMassAction=$(Identifiers.chooseMassAction),this.elements.$previewLinksButton=$(Identifiers.previewLinksButton),this.elements.$pagination=$(Identifiers.pagination)}registerEvents(){$(document).on("click",'[data-action="swap"]',e=>{const t=e.target.closest("tr");this.checkIntegrity({selection:[{liveId:t.dataset.uid,versionId:t.dataset.t3ver_oid,table:t.dataset.table}],type:"selection"}).then(async e=>{"warning"===(await e.resolve())[0].result.result&&this.addIntegrityCheckWarningToWizard(),Wizard.setForceSelection(!1),Wizard.addSlide("swap-confirm","Swap",TYPO3.lang["window.swap.message"],a.SeverityEnum.info),Wizard.addFinalProcessingSlide(()=>{this.sendRemoteRequest(this.generateRemoteActionsPayload("swapSingleRecord",[t.dataset.table,t.dataset.t3ver_oid,t.dataset.uid])).then(()=>{Wizard.dismiss(),this.getWorkspaceInfos(),Backend.refreshPageTree()})}).done(()=>{Wizard.show()})})}).on("click",'[data-action="prevstage"]',e=>{this.sendToStage($(e.currentTarget).closest("tr"),"prev")}).on("click",'[data-action="nextstage"]',e=>{this.sendToStage($(e.currentTarget).closest("tr"),"next")}).on("click",'[data-action="changes"]',this.viewChanges).on("click",'[data-action="preview"]',this.openPreview).on("click",'[data-action="open"]',e=>{const t=e.currentTarget.closest("tr");let a=TYPO3.settings.FormEngine.moduleUrl+"&returnUrl="+encodeURIComponent(document.location.href)+"&id="+TYPO3.settings.Workspaces.id+"&edit["+t.dataset.table+"]["+t.dataset.uid+"]=edit";window.location.href=a}).on("click",'[data-action="version"]',e=>{const t=e.currentTarget.closest("tr"),a="pages"===t.dataset.table?t.dataset.t3ver_oid:t.dataset.pid;window.location.href=top.TYPO3.configuration.pageModuleUrl+"&id="+a+"&returnUrl="+encodeURIComponent(window.location.href)}).on("click",'[data-action="remove"]',this.confirmDeleteRecordFromWorkspace).on("click",'[data-action="expand"]',e=>{const t=$(e.currentTarget);let a;a="true"===this.elements.$tableBody.find(t.data("target")).first().attr("aria-expanded")?"apps-pagetree-expand":"apps-pagetree-collapse",t.empty().append(this.getPreRenderedIcon(a))}),$(window.top.document).on("click",".t3js-workspace-recipients-selectall",e=>{e.preventDefault(),$(".t3js-workspace-recipient",window.top.document).not(":disabled").prop("checked",!0)}).on("click",".t3js-workspace-recipients-deselectall",e=>{e.preventDefault(),$(".t3js-workspace-recipient",window.top.document).not(":disabled").prop("checked",!1)}),this.elements.$searchForm.on("submit",e=>{e.preventDefault(),this.settings.filterTxt=this.elements.$searchTextField.val(),this.getWorkspaceInfos()}),this.elements.$searchTextField.on("keyup",e=>{""!==e.target.value?this.elements.$searchSubmitBtn.removeClass("disabled"):(this.elements.$searchSubmitBtn.addClass("disabled"),this.getWorkspaceInfos())}),this.elements.$searchTextField.get(0).clearable({onClear:()=>{this.elements.$searchSubmitBtn.addClass("disabled"),this.settings.filterTxt="",this.getWorkspaceInfos()}}),this.elements.$toggleAll.on("click",()=>{this.allToggled=!this.allToggled,this.elements.$tableBody.find('input[type="checkbox"]').prop("checked",this.allToggled).trigger("change")}),this.elements.$tableBody.on("change","tr input[type=checkbox]",this.handleCheckboxChange),this.elements.$depthSelector.on("change",e=>{const t=e.target.value;Persistent.set("this.Module.depth",t),this.settings.depth=t,this.getWorkspaceInfos()}),this.elements.$previewLinksButton.on("click",this.generatePreviewLinks),this.elements.$languageSelector.on("change",e=>{const t=$(e.target);this.settings.language=t.val(),this.sendRemoteRequest([this.generateRemoteActionsPayload("saveLanguageSelection",[t.val()]),this.generateRemotePayload("getWorkspaceInfos",this.settings)]).then(e=>{this.elements.$languageSelector.prev().html(t.find(":selected").data("icon")),this.renderWorkspaceInfos(e[1].result)})}),this.elements.$chooseStageAction.on("change",this.sendToSpecificStageAction),this.elements.$chooseSelectionAction.on("change",this.runSelectionAction),this.elements.$chooseMassAction.on("change",this.runMassAction),this.elements.$pagination.on("click","a[data-action]",e=>{e.preventDefault();const t=$(e.currentTarget);let a=!1;switch(t.data("action")){case"previous":this.paging.currentPage>1&&(this.paging.currentPage--,a=!0);break;case"next":this.paging.currentPage<this.paging.totalPages&&(this.paging.currentPage++,a=!0);break;case"page":this.paging.currentPage=parseInt(t.data("page"),10),a=!0;break;default:throw'Unknown action "'+t.data("action")+'"'}a&&(this.settings.start=parseInt(this.settings.limit.toString(),10)*(this.paging.currentPage-1),this.getWorkspaceInfos())})}sendToStage(e,t){let a,s,n;if("next"===t)a=e.data("nextStage"),s="sendToNextStageWindow",n="sendToNextStageExecute";else{if("prev"!==t)throw"Invalid direction given.";a=e.data("prevStage"),s="sendToPrevStageWindow",n="sendToPrevStageExecute"}this.sendRemoteRequest(this.generateRemoteActionsPayload(s,[e.data("uid"),e.data("table"),e.data("t3ver_oid")])).then(async t=>{const s=this.renderSendToStageWindow(await t.resolve());s.on("button.clicked",t=>{if("ok"===t.target.name){const i=Utility.convertFormToObject(t.currentTarget.querySelector("form"));i.affects={table:e.data("table"),nextStage:a,t3ver_oid:e.data("t3ver_oid"),uid:e.data("uid"),elements:[]},this.sendRemoteRequest([this.generateRemoteActionsPayload(n,[i]),this.generateRemotePayload("getWorkspaceInfos",this.settings)]).then(async e=>{const t=await e.resolve();s.modal("hide"),this.renderWorkspaceInfos(t[1].result),Backend.refreshPageTree()})}})})}loadWorkspaceComponents(){this.sendRemoteRequest([this.generateRemotePayload("getWorkspaceInfos",this.settings),this.generateRemotePayload("getStageActions",{}),this.generateRemoteMassActionsPayload("getMassStageActions",{}),this.generateRemotePayload("getSystemLanguages",{pageUid:this.elements.$container.data("pageUid")})]).then(async e=>{const t=await e.resolve();this.elements.$depthSelector.prop("disabled",!1),this.renderWorkspaceInfos(t[0].result);const a=t[1].result.data;let s;for(s=0;s<a.length;++s)this.elements.$chooseStageAction.append($("<option />").val(a[s].uid).text(a[s].title));const n=t[2].result.data;for(s=0;s<n.length;++s)this.elements.$chooseSelectionAction.append($("<option />").val(n[s].action).text(n[s].title)),this.elements.$chooseMassAction.append($("<option />").val(n[s].action).text(n[s].title));const i=t[3].result.data;for(s=0;s<i.length;++s){const e=$("<option />").val(i[s].uid).text(i[s].title).data("icon",i[s].icon);String(i[s].uid)===String(TYPO3.settings.Workspaces.language)&&(e.prop("selected",!0),this.elements.$languageSelector.prev().html(i[s].icon)),this.elements.$languageSelector.append(e)}this.elements.$languageSelector.prop("disabled",!1)})}getWorkspaceInfos(){this.sendRemoteRequest(this.generateRemotePayload("getWorkspaceInfos",this.settings)).then(async e=>{this.renderWorkspaceInfos((await e.resolve())[0].result)})}renderWorkspaceInfos(e){this.elements.$tableBody.children().remove(),this.allToggled=!1,this.elements.$chooseStageAction.prop("disabled",!0),this.elements.$chooseSelectionAction.prop("disabled",!0),this.elements.$chooseMassAction.prop("disabled",0===e.data.length),this.buildPagination(e.total);for(let t=0;t<e.data.length;++t){const a=e.data[t],s=$("<div />",{class:"btn-group"});let n;s.append(this.getAction(a.Workspaces_CollectionChildren>0&&""!==a.Workspaces_CollectionCurrent,"expand","apps-pagetree-collapse").attr("title",TYPO3.lang["tooltip.expand"]).attr("data-target",'[data-collection="'+a.Workspaces_CollectionCurrent+'"]').attr("data-toggle","collapse"),$("<button />",{class:"btn btn-default","data-action":"changes","data-toggle":"tooltip",title:TYPO3.lang["tooltip.showChanges"]}).append(this.getPreRenderedIcon("actions-document-info")),this.getAction(a.allowedAction_swap&&""===a.Workspaces_CollectionParent,"swap","actions-version-swap-version").attr("title",TYPO3.lang["tooltip.swap"]),this.getAction(a.allowedAction_view,"preview","actions-version-workspace-preview").attr("title",TYPO3.lang["tooltip.viewElementAction"]),this.getAction(a.allowedAction_edit,"open","actions-open").attr("title",TYPO3.lang["tooltip.editElementAction"]),this.getAction(!0,"version","actions-version-page-open").attr("title",TYPO3.lang["tooltip.openPage"]),this.getAction(a.allowedAction_delete,"remove","actions-version-document-remove").attr("title",TYPO3.lang["tooltip.discardVersion"])),""!==a.integrity.messages&&(n=$(TYPO3.settings.Workspaces.icons[a.integrity.status]),n.attr("data-toggle","tooltip").attr("data-placement","top").attr("data-html","true").attr("title",a.integrity.messages)),this.latestPath!==a.path_Workspace&&(this.latestPath=a.path_Workspace,this.elements.$tableBody.append($("<tr />").append($("<th />"),$("<th />",{colspan:6}).html('<span title="'+a.path_Workspace+'">'+a.path_Workspace_crop+"</span>"))));const i=$("<label />",{class:"btn btn-default btn-checkbox"}).append($("<input />",{type:"checkbox"}),$("<span />",{class:"t3-icon fa"})),o={"data-uid":a.uid,"data-pid":a.livepid,"data-t3ver_oid":a.t3ver_oid,"data-t3ver_wsid":a.t3ver_wsid,"data-table":a.table,"data-next-stage":a.value_nextStage,"data-prev-stage":a.value_prevStage,"data-stage":a.stage};""!==a.Workspaces_CollectionParent&&(o["data-collection"]=a.Workspaces_CollectionParent,o.class="collapse"),this.elements.$tableBody.append($("<tr />",o).append($("<td />").empty().append(i),$("<td />",{class:"t3js-title-workspace",style:a.Workspaces_CollectionLevel>0?"padding-left: "+this.indentationPadding*a.Workspaces_CollectionLevel+"px":""}).html(a.icon_Workspace+'&nbsp;<a href="#" data-action="changes"><span class="workspace-state-'+a.state_Workspace+'" title="'+a.label_Workspace+'">'+a.label_Workspace_crop+"</span></a>"),$("<td />",{class:"t3js-title-live"}).html(a.icon_Live+'&nbsp;<span class"workspace-live-title title="'+a.label_Live+'">'+a.label_Live_crop+"</span>"),$("<td />").text(a.label_Stage),$("<td />").empty().append(n),$("<td />").html(a.language.icon),$("<td />",{class:"text-right nowrap"}).append(s))),Tooltip.initialize('[data-toggle="tooltip"]',{delay:{show:500,hide:100},trigger:"hover",container:"body"})}}buildPagination(e){if(0===e)return void this.elements.$pagination.contents().remove();if(this.paging.totalItems=e,this.paging.totalPages=Math.ceil(e/parseInt(this.settings.limit.toString(),10)),1===this.paging.totalPages)return void this.elements.$pagination.contents().remove();const t=$("<ul />",{class:"pagination pagination-block"}),a=[],s=$("<li />").append($("<a />",{"data-action":"previous"}).append($("<span />",{class:"t3-icon fa fa-arrow-left"}))),n=$("<li />").append($("<a />",{"data-action":"next"}).append($("<span />",{class:"t3-icon fa fa-arrow-right"})));1===this.paging.currentPage&&s.disablePagingAction(),this.paging.currentPage===this.paging.totalPages&&n.disablePagingAction();for(let e=1;e<=this.paging.totalPages;e++){const t=$("<li />",{class:this.paging.currentPage===e?"active":""});t.append($("<a />",{"data-action":"page","data-page":e}).append($("<span />").text(e))),a.push(t)}t.append(s,a,n),this.elements.$pagination.empty().append(t)}renderSelectionActionWizard(e,t){Wizard.addSlide("mass-action-confirmation",TYPO3.lang["window.selectionAction.title"],"<p>"+(new SecurityUtility).encodeHtml(TYPO3.lang["tooltip."+e+"Selected"])+"</p>",a.SeverityEnum.warning),Wizard.addFinalProcessingSlide(()=>{this.sendRemoteRequest(this.generateRemoteActionsPayload("executeSelectionAction",{action:e,selection:t})).then(()=>{this.markedRecordsForMassAction=[],this.getWorkspaceInfos(),Wizard.dismiss(),Backend.refreshPageTree()})}).done(()=>{Wizard.show(),Wizard.getComponent().on("wizard-dismissed",()=>{this.elements.$chooseSelectionAction.val("")})})}renderMassActionWizard(e){let t,s=!1;switch(e){case"publish":t="publishWorkspace";break;case"swap":t="publishWorkspace",s=!0;break;case"discard":t="flushWorkspace";break;default:throw"Invalid mass action "+e+" called."}const n=new SecurityUtility;Wizard.setForceSelection(!1),Wizard.addSlide("mass-action-confirmation",TYPO3.lang["window.massAction.title"],"<p>"+n.encodeHtml(TYPO3.lang["tooltip."+e+"All"])+"<br><br>"+n.encodeHtml(TYPO3.lang["tooltip.affectWholeWorkspace"])+"</p>",a.SeverityEnum.warning);const i=async e=>{const a=(await e.resolve())[0].result;a.processed<a.total?this.sendRemoteRequest(this.generateRemoteMassActionsPayload(t,a)).then(i):(this.getWorkspaceInfos(),Wizard.dismiss())};Wizard.addFinalProcessingSlide(()=>{this.sendRemoteRequest(this.generateRemoteMassActionsPayload(t,{init:!0,total:0,processed:0,language:this.settings.language,swap:s})).then(i)}).done(()=>{Wizard.show(),Wizard.getComponent().on("wizard-dismissed",()=>{this.elements.$chooseMassAction.val("")})})}getAction(e,t,a){return e?$("<button />",{class:"btn btn-default","data-action":t,"data-toggle":"tooltip"}).append(this.getPreRenderedIcon(a)):$("<span />",{class:"btn btn-default disabled"}).append(this.getPreRenderedIcon("empty-empty"))}getPreRenderedIcon(e){return this.elements.$actionIcons.find('[data-identifier="'+e+'"]').clone()}}return new Backend}));