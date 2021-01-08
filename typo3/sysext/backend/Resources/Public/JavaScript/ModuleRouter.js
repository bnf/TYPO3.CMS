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
var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,o,a){void 0===a&&(a=o),Object.defineProperty(e,a,{enumerable:!0,get:function(){return t[o]}})}:function(e,t,o,a){void 0===a&&(a=o),e[a]=t[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__decorate=this&&this.__decorate||function(e,t,o,a){var r,n=arguments.length,i=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,o):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,o,a);else for(var l=e.length-1;l>=0;l--)(r=e[l])&&(i=(n<3?r(i):n>3?r(t,o,i):r(t,o))||i);return n>3&&i&&Object.defineProperty(t,o,i),i},__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var o in e)"default"!==o&&Object.prototype.hasOwnProperty.call(e,o)&&__createBinding(t,e,o);return __setModuleDefault(t,e),t};define(["require","exports","lit-element","lit-html/directives/template-content"],(function(e,t,o,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ModuleRouter=void 0;let r=class extends o.LitElement{constructor(){super(),this.module="",this.src="",this.params="",this.moduleData=null,this.decorate=!1,this.popstateHandler=e=>{this._handlePopstate(e)},this.addEventListener("typo3-module-load",e=>{console.log("catched load in module-router",e),this.decorate&&(e.detail.decorate=!0,this.decorate=!1)}),this.addEventListener("typo3-module-loaded",e=>{console.log("sending load event from module-router",e),this.dispatchEvent(new Event("load"))}),this.classList.add("t3js-scaffold-content-module-iframe"),this.setAttribute("id","typo3-contentIframe"),this.setAttribute("name","list_frame"),window.list_frame=this.contentWindow=Object.create(Object.prototype,{location:{value:Object.create(Object.prototype,{reload:{configurable:!1,value:()=>{this.requestUpdate()}},href:{configurable:!1,enumarable:!0,get:()=>this.src,set:e=>{this.setAttribute("src",e),this.removeAttribute("module")}}})}})}static get styles(){return o.css`
      :host {
        display: block;
        height: 100%;
      }
    `}createRenderRoot(){return this}attributeChangedCallback(e,t,o){console.log("attribute change: ",e,o,t),super.attributeChangedCallback(e,t,o),"src"!==e&&"module"!==e||this.requestUpdate()}connectedCallback(){super.connectedCallback(),window.addEventListener("popstate",this.popstateHandler)}disconnectedCallback(){window.addEventListener("popstate",this.popstateHandler),super.disconnectedCallback()}render(){const t=this.moduleData||this.getRecordFromName(this.module);let r=t.element||"typo3-iframe-module",n=t.elementModule||"TYPO3/CMS/Backend/Module/Iframe";console.log("iframe moduledata",t,this.module);let i=this.src||t.link||"";top.nextLoadModuleUrl&&(r="typo3-iframe-module",n="TYPO3/CMS/Backend/Module/Iframe",top.nextLoadModuleUrl=""),console.log("rendering module",{moduleElement:r,src:i});const l=document.createElement("template"),d=document.createElement(r);return d.setAttribute("src",i),d.setAttribute("params",this.params),l.content.appendChild(d),new Promise((t,o)=>{e([n],t,o)}).then(__importStar),o.html`${a.templateContent(l)}`}_handlePopstate(e){console.log("location: "+document.location+", state: "+JSON.stringify(e.state)),e.state.module?(this.setAttribute("module",e.state.module),this.decorate=!0):this.removeAttribute("module"),e.state.url?(this.setAttribute("src",e.state.url),this.decorate=!0):this.removeAttribute("src")}getRecordFromName(e){const t=document.getElementById(e);return t?{name:e,navigationComponentId:t.dataset.navigationcomponentid,navigationFrameScript:t.dataset.navigationframescript,navigationFrameScriptParam:t.dataset.navigationframescriptparameters,link:t.dataset.link,element:t.dataset.element,elementModule:t.dataset.elementModule}:{name:"",navigationComponentId:"",navigationFrameScript:"",navigationFrameScriptParam:"",link:"",element:"",elementModule:""}}};__decorate([o.property({type:String})],r.prototype,"module",void 0),__decorate([o.property({type:String})],r.prototype,"src",void 0),__decorate([o.property({type:String})],r.prototype,"params",void 0),__decorate([o.property({type:Object})],r.prototype,"moduleData",void 0),r=__decorate([o.customElement("typo3-backend-module-router")],r),t.ModuleRouter=r}));