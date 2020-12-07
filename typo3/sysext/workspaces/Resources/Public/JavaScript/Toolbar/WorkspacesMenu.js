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
define(["jquery","TYPO3/CMS/Core/Ajax/AjaxRequest","TYPO3/CMS/Backend/ModuleMenu","TYPO3/CMS/Backend/Viewport","TYPO3/CMS/Core/Event/RegularEvent"],(function(e,t,o,a,r){"use strict";var s,n;!function(e){e.containerSelector="#typo3-cms-workspaces-backend-toolbaritems-workspaceselectortoolbaritem",e.activeMenuItemLinkSelector=".dropdown-menu .selected",e.menuItemSelector=".t3js-workspace-item",e.menuItemLinkSelector=".t3js-workspaces-switchlink",e.toolbarItemSelector=".dropdown-toggle",e.workspaceModuleLinkSelector=".t3js-workspaces-modulelink"}(s||(s={})),function(e){e.workspaceBodyClass="typo3-in-workspace",e.workspacesTitleInToolbarClass="toolbar-item-name"}(n||(n={}));class c{static refreshPageTree(){a.NavigationContainer&&a.NavigationContainer.PageTree&&a.NavigationContainer.PageTree.refreshTree()}static updateWorkspaceState(){const e=document.querySelector(s.containerSelector+" .t3js-workspace-item.selected .t3js-workspaces-switchlink");if(null!==e){const t=parseInt(e.dataset.workspaceid,10),o=e.innerText.trim();top.TYPO3.configuration.inWorkspace=0!==t,top.TYPO3.Backend.workspaceTitle=top.TYPO3.configuration.inWorkspace?o:""}}static updateTopBar(t){if(e("."+n.workspacesTitleInToolbarClass,s.containerSelector).remove(),t&&t.length){let o=e("<span>",{class:n.workspacesTitleInToolbarClass}).text(t);e(s.toolbarItemSelector,s.containerSelector).append(o)}}static updateBackendContext(){let t="";c.updateWorkspaceState(),TYPO3.configuration.inWorkspace?(e("body").addClass(n.workspaceBodyClass),t=top.TYPO3.Backend.workspaceTitle||TYPO3.lang["Workspaces.workspaceTitle"]):e("body").removeClass(n.workspaceBodyClass),c.updateTopBar(t)}constructor(){a.Topbar.Toolbar.registerEvent(()=>{this.initializeEvents(),c.updateBackendContext()}),new r("typo3:datahandler:process",e=>{const t=e.detail.payload;"sys_workspace"===t.table&&"delete"===t.action&&!1===t.hasErrors&&a.Topbar.refresh()}).bindTo(document)}performWorkspaceSwitch(t){e(s.activeMenuItemLinkSelector+" i",s.containerSelector).removeClass("fa fa-check").addClass("fa fa-empty-empty"),e(s.activeMenuItemLinkSelector,s.containerSelector).removeClass("selected");const o=e(s.menuItemLinkSelector+"[data-workspaceid="+t+"]",s.containerSelector).closest(s.menuItemSelector);o.find("i").removeClass("fa fa-empty-empty").addClass("fa fa-check"),o.addClass("selected"),c.updateBackendContext()}initializeEvents(){e(s.containerSelector).on("click",s.workspaceModuleLinkSelector,e=>{e.preventDefault(),o.App.showModule(e.currentTarget.dataset.module)}),e(s.containerSelector).on("click",s.menuItemLinkSelector,e=>{e.preventDefault(),this.switchWorkspace(parseInt(e.currentTarget.dataset.workspaceid,10))})}switchWorkspace(e){new t(TYPO3.settings.ajaxUrls.workspace_switch).post({workspaceId:e,pageId:top.fsMod.recentIds.web}).then(async t=>{const r=await t.resolve();if(r.workspaceId||(r.workspaceId=0),this.performWorkspaceSwitch(parseInt(r.workspaceId,10)),r.pageId){top.fsMod.recentIds.web=r.pageId;let e=TYPO3.Backend.ContentContainer.getUrl();e+=(e.includes("?")?"&":"?")+"&id="+r.pageId,c.refreshPageTree(),a.ContentContainer.setUrl(e)}else top.currentModuleLoaded.startsWith("web_")?(c.refreshPageTree(),"web_WorkspacesWorkspaces"===top.currentModuleLoaded?o.App.showModule(top.currentModuleLoaded,"workspace="+e):o.App.reloadFrames()):TYPO3.configuration.pageModule&&o.App.showModule(TYPO3.configuration.pageModule);o.App.refreshMenu()})}}const i=new c;return TYPO3.WorkspacesMenu=i,i}));