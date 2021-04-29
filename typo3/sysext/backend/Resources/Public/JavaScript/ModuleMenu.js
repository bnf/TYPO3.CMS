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
var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};define(["require","exports","./Enum/Viewport/ScaffoldIdentifier","./Module","jquery","./Storage/Persistent","./Viewport","./Event/ClientRequest","./Event/TriggerRequest","TYPO3/CMS/Core/Ajax/AjaxRequest","TYPO3/CMS/Core/Event/RegularEvent"],(function(e,t,n,o,a,l,i,r,s,d,u){"use strict";a=__importDefault(a);class m{constructor(){this.loadedModule=null,this.spaceKeyPressedOnCollapsible=!1,a.default(()=>this.initialize())}static getCollapsedMainMenuItems(){return l.isset("modulemenu")?JSON.parse(l.get("modulemenu")):{}}static addCollapsedMainMenuItem(e){const t=m.getCollapsedMainMenuItems();t[e]=!0,l.set("modulemenu",JSON.stringify(t))}static removeCollapseMainMenuItem(e){const t=this.getCollapsedMainMenuItems();delete t[e],l.set("modulemenu",JSON.stringify(t))}static includeId(e,t){if(!e.navigationComponentId&&!e.navigationFrameScript)return t;let n="";return n="TYPO3/CMS/Backend/PageTree/PageTreeElement"===e.navigationComponentId?"web":e.name.split("_")[0],top.fsMod.recentIds[n]&&(t="id="+top.fsMod.recentIds[n]+"&"+t),t}static toggleMenu(e){const t=a.default(n.ScaffoldIdentifierEnum.scaffold);void 0===e&&(e=t.hasClass("scaffold-modulemenu-expanded")),t.toggleClass("scaffold-modulemenu-expanded",!e),e||a.default(".scaffold").removeClass("scaffold-search-expanded").removeClass("scaffold-toolbar-expanded"),l.set("BackendComponents.States.typo3-module-menu",{collapsed:e})}static toggleModuleGroup(e){const t=e.closest(".modulemenu-group"),n=t.querySelector(".modulemenu-group-container"),o="true"===e.attributes.getNamedItem("aria-expanded").value;o?m.addCollapsedMainMenuItem(e.id):m.removeCollapseMainMenuItem(e.id),t.classList.toggle("modulemenu-group-collapsed",o),t.classList.toggle("modulemenu-group-expanded",!o),e.attributes.getNamedItem("aria-expanded").value=(!o).toString(),a.default(n).stop().slideToggle()}static highlightModuleMenuItem(e){a.default(".modulemenu-action.modulemenu-action-active").removeClass("modulemenu-action-active").removeAttr("aria-current"),a.default("#"+e).addClass("modulemenu-action-active").attr("aria-current","location")}static getPreviousItem(e){let t=e.parentElement.previousElementSibling;return null===t?m.getLastItem(e):t.firstElementChild}static getNextItem(e){let t=e.parentElement.nextElementSibling;return null===t?m.getFirstItem(e):t.firstElementChild}static getFirstItem(e){return e.parentElement.parentElement.firstElementChild.firstElementChild}static getLastItem(e){return e.parentElement.parentElement.lastElementChild.firstElementChild}static getParentItem(e){return e.parentElement.parentElement.parentElement.firstElementChild}static getFirstChildItem(e){return e.nextElementSibling.firstElementChild.firstElementChild}static getLastChildItem(e){return e.nextElementSibling.lastElementChild.firstElementChild}refreshMenu(){new d(TYPO3.settings.ajaxUrls.modulemenu).get().then(async e=>{const t=await e.resolve();document.getElementById("modulemenu").outerHTML=t.menu,this.initializeModuleMenuEvents(),top.currentModuleLoaded&&m.highlightModuleMenuItem(top.currentModuleLoaded)})}reloadFrames(){i.NavigationContainer.refresh(),i.ContentContainer.refresh()}showModule(e,t,n=null){t=t||"";const a=o.getRecordFromName(e);return this.loadModuleComponents(a,t,new r("typo3.showModule",n))}initialize(){if(null===document.querySelector(".t3js-modulemenu"))return;let e=a.default.Deferred();e.resolve(),e.then(()=>{this.initializeModuleMenuEvents(),i.Topbar.Toolbar.registerEvent(()=>this.initializeTopBarEvents())})}keyboardNavigation(e,t,n=!1){const o=t.parentElement.attributes.getNamedItem("data-level").value;let a=null;switch(n&&(this.spaceKeyPressedOnCollapsible=!1),e.code){case"ArrowUp":a=m.getPreviousItem(t);break;case"ArrowDown":a=m.getNextItem(t);break;case"ArrowLeft":"1"===o&&t.classList.contains("t3js-modulemenu-collapsible")?("false"===t.attributes.getNamedItem("aria-expanded").value&&m.toggleModuleGroup(t),a=m.getLastChildItem(t)):"2"===o&&(a=m.getPreviousItem(m.getParentItem(t)));break;case"ArrowRight":"1"===o&&t.classList.contains("t3js-modulemenu-collapsible")?("false"===t.attributes.getNamedItem("aria-expanded").value&&m.toggleModuleGroup(t),a=m.getFirstChildItem(t)):"2"===o&&(a=m.getNextItem(m.getParentItem(t)));break;case"Home":a=e.ctrlKey&&"2"===o?m.getFirstItem(m.getParentItem(t)):m.getFirstItem(t);break;case"End":a=e.ctrlKey&&"2"===o?m.getLastItem(m.getParentItem(t)):m.getLastItem(t);break;case"Space":case"Enter":"1"===o&&t.classList.contains("t3js-modulemenu-collapsible")&&("Enter"===e.code&&e.preventDefault(),m.toggleModuleGroup(t),"true"===t.attributes.getNamedItem("aria-expanded").value&&(a=m.getFirstChildItem(t),"Space"===e.code&&(this.spaceKeyPressedOnCollapsible=!0)));break;case"Esc":case"Escape":"2"===o&&(a=m.getParentItem(t),m.toggleModuleGroup(a));break;default:a=null}null!==a&&(e.defaultPrevented||e.preventDefault(),a.focus())}initializeModuleMenuEvents(){const e=document.querySelector(".t3js-modulemenu"),t=function(e){"Space"===e.code&&this.spaceKeyPressedOnCollapsible&&(e.preventDefault(),this.spaceKeyPressedOnCollapsible=!1)}.bind(this);new u("keydown",this.keyboardNavigation).delegateTo(e,".t3js-modulemenu-action"),e.querySelectorAll('[data-level="2"] .t3js-modulemenu-action[data-link]').forEach(e=>{e.addEventListener("keyup",t)}),new u("keyup",(e,t)=>{"Space"===e.code&&e.preventDefault()}).delegateTo(e,".t3js-modulemenu-collapsible"),new u("click",(e,t)=>{e.preventDefault(),this.showModule(t.id,"",e)}).delegateTo(e,".t3js-modulemenu-action[data-link]"),new u("click",(e,t)=>{e.preventDefault(),m.toggleModuleGroup(t)}).delegateTo(e,".t3js-modulemenu-collapsible")}initializeTopBarEvents(){const e=document.querySelector(".t3js-scaffold-toolbar");new u("keydown",(e,t)=>{this.keyboardNavigation(e,t)}).delegateTo(e,".t3js-modulemenu-action"),new u("click",(e,t)=>{e.preventDefault(),this.showModule(t.id,"",e)}).delegateTo(e,".t3js-modulemenu-action[data-link]"),new u("click",e=>{e.preventDefault(),m.toggleMenu()}).bindTo(document.querySelector(".t3js-topbar-button-modulemenu")),new u("click",e=>{e.preventDefault(),m.toggleMenu(!0)}).bindTo(document.querySelector(".t3js-scaffold-content-overlay"));const t=e=>{const t=e.detail.module;if(!t||this.loadedModule===t)return;m.highlightModuleMenuItem(t),a.default("#"+t).focus(),this.loadedModule=t;const n=o.getRecordFromName(t);top.currentSubScript=n.link,top.currentModuleLoaded=t;const l=new URL(e.detail.url||"",window.location.origin),d=new URLSearchParams(l.search);if(d.has("id")&&(n.navigationComponentId||n.navigationFrameScript))if("TYPO3/CMS/Backend/PageTree/PageTreeElement"===n.navigationComponentId)top.window.fsMod.recentIds.web=parseInt(d.get("id"),10);else{const e=n.name.split("_")[0];top.window.fsMod.recentIds[e]=d.get("id")}if(n.link)if(n.navigationComponentId)i.NavigationContainer.showComponent(n.navigationComponentId);else if(n.navigationFrameScript){i.NavigationContainer.show("typo3-navigationIframe");new r("typo3.showModule",event);this.openInNavFrame(n.navigationFrameScript,n.navigationFrameScriptParam,new s("typo3.loadModuleComponents",new r("typo3.showModule",null)))}else i.NavigationContainer.hide(!1)};document.addEventListener("typo3-module-load",t),document.addEventListener("typo3-module-loaded",t)}loadModuleComponents(e,t,n){const o=e.name,l=i.ContentContainer.beforeSetUrl(n);return l.then(a.default.proxy(()=>{e.navigationComponentId?i.NavigationContainer.showComponent(e.navigationComponentId):e.navigationFrameScript?(i.NavigationContainer.show("typo3-navigationIframe"),this.openInNavFrame(e.navigationFrameScript,e.navigationFrameScriptParam,new s("typo3.loadModuleComponents",n))):i.NavigationContainer.hide(!0),m.highlightModuleMenuItem(o),this.loadedModule=o,t=m.includeId(e,t),this.openInContentContainer(o,e.link,t,new s("typo3.loadModuleComponents",n)),top.currentSubScript=e.link,top.currentModuleLoaded=o},this)),l}openInNavFrame(e,t,n){const o=e+(t?(e.includes("?")?"&":"?")+t:""),a=i.NavigationContainer.getUrl(),l=i.NavigationContainer.setUrl(e,new s("typo3.openInNavFrame",n));return a!==o&&("resolved"===l.state()?i.NavigationContainer.refresh():l.then(i.NavigationContainer.refresh)),l}openInContentContainer(e,t,n,o){let a;if(top.nextLoadModuleUrl)a=i.ContentContainer.setUrl(top.nextLoadModuleUrl,new s("typo3.openInContentFrame",o),null),top.nextLoadModuleUrl="";else{const l=t+(n?(t.includes("?")?"&":"?")+n:"");a=i.ContentContainer.setUrl(l,new s("typo3.openInContentFrame",o),e)}return a}}top.TYPO3.ModuleMenu||(top.TYPO3.ModuleMenu={App:new m});return top.TYPO3.ModuleMenu}));