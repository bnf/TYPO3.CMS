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
var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,n,o){void 0===o&&(o=n),Object.defineProperty(e,o,{enumerable:!0,get:function(){return t[n]}})}:function(e,t,n,o){void 0===o&&(o=n),e[o]=t[n]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&__createBinding(t,e,n);return __setModuleDefault(t,e),t},__importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};define(["require","exports","./Enum/Viewport/ScaffoldIdentifier","jquery","./Storage/Persistent","./Viewport","./Event/ClientRequest","./Event/TriggerRequest","./Viewport/Loader","./Event/ConsumerScope","TYPO3/CMS/Core/Ajax/AjaxRequest","TYPO3/CMS/Core/Event/RegularEvent"],(function(e,t,n,o,a,i,l,d,r,u,s,m){"use strict";o=__importDefault(o);class c{constructor(){this.loadedModule=null,this.loadedNavigationComponentId="",o.default(()=>this.initialize())}static getCollapsedMainMenuItems(){return a.isset("modulemenu")?JSON.parse(a.get("modulemenu")):{}}static addCollapsedMainMenuItem(e){const t=c.getCollapsedMainMenuItems();t[e]=!0,a.set("modulemenu",JSON.stringify(t))}static removeCollapseMainMenuItem(e){const t=this.getCollapsedMainMenuItems();delete t[e],a.set("modulemenu",JSON.stringify(t))}static includeId(e,t){if(!e.navigationComponentId&&!e.navigationFrameScript)return t;let n="";return n="TYPO3/CMS/Backend/PageTree/PageTreeElement"===e.navigationComponentId?"web":e.name.split("_")[0],top.fsMod.recentIds[n]&&(t="id="+top.fsMod.recentIds[n]+"&"+t),t}static toggleMenu(e){i.NavigationContainer.cleanup();const t=o.default(n.ScaffoldIdentifierEnum.scaffold);void 0===e&&(e=t.hasClass("scaffold-modulemenu-expanded")),t.toggleClass("scaffold-modulemenu-expanded",!e),e||o.default(".scaffold").removeClass("scaffold-search-expanded").removeClass("scaffold-toolbar-expanded"),a.set("BackendComponents.States.typo3-module-menu",{collapsed:e}),i.doLayout()}static getRecordFromName(e){const t=o.default("#"+e);return{name:e,navigationComponentId:t.data("navigationcomponentid"),navigationFrameScript:t.data("navigationframescript"),navigationFrameScriptParam:t.data("navigationframescriptparameters"),link:t.data("link"),element:t.data("element"),elementModule:t.data("element-module")}}static highlightModuleMenuItem(e){o.default(".modulemenu-action.modulemenu-action-active").removeClass("modulemenu-action-active"),o.default("#"+e).addClass("modulemenu-action-active")}refreshMenu(){new s(TYPO3.settings.ajaxUrls.modulemenu).get().then(async e=>{const t=await e.resolve();document.getElementById("modulemenu").outerHTML=t.menu,top.currentModuleLoaded&&c.highlightModuleMenuItem(top.currentModuleLoaded),i.doLayout()})}reloadFrames(){i.NavigationContainer.refresh(),i.ContentContainer.refresh()}showModule(e,t,n=null){t=t||"";const o=c.getRecordFromName(e);return this.loadModuleComponents(o,t,new l("typo3.showModule",n))}initialize(){if(null===document.querySelector(".t3js-modulemenu"))return;const e=this;let t=o.default.Deferred();t.resolve(),top.startInModule&&top.startInModule[0]&&o.default("#"+top.startInModule[0]).length>0&&(t=this.showModule(top.startInModule[0],top.startInModule[1])),t.then(()=>{e.initializeEvents()})}initializeEvents(){new m("click",(e,t)=>{const n=t.closest(".modulemenu-group"),a=n.querySelector(".modulemenu-group-container"),l="true"===t.attributes.getNamedItem("aria-expanded").value;l?c.addCollapsedMainMenuItem(t.id):c.removeCollapseMainMenuItem(t.id),n.classList.toggle(".modulemenu-group-collapsed",l),n.classList.toggle(".modulemenu-group-expanded",!l),t.attributes.getNamedItem("aria-expanded").value=(!l).toString(),o.default(a).stop().slideToggle({complete:function(){i.doLayout()}})}).delegateTo(document,".t3js-modulemenu .t3js-modulemenu-collapsible"),new m("click",(e,t)=>{void 0!==t.dataset.link&&(e.preventDefault(),this.showModule(t.id,"",e))}).delegateTo(document,".t3js-modulemenu-action"),new m("click",e=>{e.preventDefault(),c.toggleMenu()}).bindTo(document.querySelector(".t3js-topbar-button-modulemenu")),new m("click",e=>{e.preventDefault(),c.toggleMenu(!0)}).bindTo(document.querySelector(".t3js-scaffold-content-overlay")),new m("click",e=>{e.preventDefault(),i.NavigationContainer.toggle()}).bindTo(document.querySelector(".t3js-topbar-button-navigationcomponent")),document.addEventListener("typo3-module-loaded",e=>{if(e.detail.module){const t=e.detail.module;if(null===t)return;if(this.loadedModule===t)return;c.highlightModuleMenuItem(t),o.default("#"+t).focus(),this.loadedModule=t,top.currentModuleLoaded=t,i.doLayout()}})}loadModuleComponents(t,a,l){const s=t.name,m=i.ContentContainer.beforeSetUrl(l);return m.then(o.default.proxy(()=>{t.navigationComponentId?this.loadNavigationComponent(t.navigationComponentId):t.navigationFrameScript?(i.NavigationContainer.show("typo3-navigationIframe"),this.openInNavFrame(t.navigationFrameScript,t.navigationFrameScriptParam,new d("typo3.loadModuleComponents",l))):i.NavigationContainer.hide(),c.highlightModuleMenuItem(s),this.loadedModule=s,a=c.includeId(t,a),console.error("loading "+JSON.stringify(t));let o;o=u.invoke(new d("typo3.loadModule",l)),new Promise((e,t)=>{o.then(()=>e()).fail(()=>t())}).then(()=>new Promise((n,o)=>{e([t.elementModule||"TYPO3/CMS/Backend/Module/Iframe"],n,o)}).then(__importStar)).then(()=>{r.start(),(e=>{const o=t.link,i=o+(a?(o.includes("?")?"&":"?")+a:""),l=document.querySelector(n.ScaffoldIdentifierEnum.contentModuleRouter);l.setAttribute("module",s),l.setAttribute("params",a),l.setAttribute("src",i),e()})(()=>r.finish())}),top.currentSubScript=t.link,top.currentModuleLoaded=s,i.doLayout()},this)),m}loadNavigationComponent(t){const n=this;if(i.NavigationContainer.show(t),t===this.loadedNavigationComponentId)return;const a=t.replace(/[/]/g,"_");""!==this.loadedNavigationComponentId&&o.default("#navigationComponent-"+this.loadedNavigationComponentId.replace(/[/]/g,"_")).hide(),o.default('.t3js-scaffold-content-navigation [data-component="'+t+'"]').length<1&&o.default(".t3js-scaffold-content-navigation").append(o.default("<div />",{class:"scaffold-content-navigation-component","data-component":t,id:"navigationComponent-"+a})),e([t],e=>{e.initialize("#navigationComponent-"+a),i.NavigationContainer.show(t),n.loadedNavigationComponentId=t})}openInNavFrame(e,t,n){const o=e+(t?(e.includes("?")?"&":"?")+t:""),a=i.NavigationContainer.getUrl(),l=i.NavigationContainer.setUrl(e,new d("typo3.openInNavFrame",n));return a!==o&&("resolved"===l.state()?i.NavigationContainer.refresh():l.then(i.NavigationContainer.refresh)),l}openInContentFrame(e,t,n){let o;if(top.nextLoadModuleUrl)o=i.ContentContainer.setUrl(top.nextLoadModuleUrl,new d("typo3.openInContentFrame",n)),top.nextLoadModuleUrl="";else{const a=e+(t?(e.includes("?")?"&":"?")+t:"");o=i.ContentContainer.setUrl(a,new d("typo3.openInContentFrame",n))}return o}}top.TYPO3.ModuleMenu||(top.TYPO3.ModuleMenu={App:new c});return top.TYPO3.ModuleMenu}));