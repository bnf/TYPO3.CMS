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
var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,o,r){void 0===r&&(r=o),Object.defineProperty(e,r,{enumerable:!0,get:function(){return t[o]}})}:function(e,t,o,r){void 0===r&&(r=o),e[r]=t[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__decorate=this&&this.__decorate||function(e,t,o,r){var i,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,o):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,o,r);else for(var l=e.length-1;l>=0;l--)(i=e[l])&&(a=(n<3?i(a):n>3?i(t,o,a):i(t,o))||a);return n>3&&a&&Object.defineProperty(t,o,a),a},__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var o in e)"default"!==o&&Object.prototype.hasOwnProperty.call(e,o)&&__createBinding(t,e,o);return __setModuleDefault(t,e),t};define(["require","exports","lit","lit/decorators"],(function(e,t,o,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ModuleRouter=void 0;let i=class extends o.LitElement{constructor(){super(),this.module="",this.endpoint="",this.addEventListener("typo3-module-load",e=>{const t=e.target.tagName.toLowerCase();if(console.log("[router] catched event:module-load from <"+t+">",e,e.detail.url),"typo3-iframe-module"!==t){const o={tagName:t,detail:e.detail},r=this.stateTrackerUrl+"?state="+encodeURIComponent(JSON.stringify(o));console.log('[router] Pushing state "'+r+'" to iframe-state-tracker due to event:load');const i=this.getModuleElement("typo3-iframe-module","TYPO3/CMS/Backend/Module/Iframe");i&&i.setAttribute("endpoint",r)}if("typo3-iframe-module"===t){let t=e.detail.url||"";const o=this.shadowRoot.querySelector("slot");if(t.endsWith(this.stateTrackerUrl)){const e=this.querySelector("typo3-iframe-module");e&&e.getAttribute("endpoint")&&(t=e.getAttribute("endpoint"),console.log("[router] overwriting state tracker url with",t))}if(t.includes(this.stateTrackerUrl+"?state=")){const r=t.split("?state="),i=JSON.parse(decodeURIComponent(r[1]||"{}"));if(o&&o.getAttribute("name")!==i.tagName){o.setAttribute("name",i.tagName);const e=this.querySelector(i.tagName);e&&this.markActive(e,i.detail.url),console.log("[router] history-navigation detected: updating slot to custom tag name",{tagName:i.tagName,endpoint:i.detail.url})}const n=this.querySelector(i.tagName);n&&n.getAttribute("endpoint")!==i.detail.url&&(this.markActive(n,i.detail.url),console.log("[router] history-navigation detected: updating endpoint for custom tag name",{tagName:i.tagName,endpoint:i.detail.url})),e.detail.module=i.detail.module,e.detail.url=i.detail.url}else if(o&&"typo3-iframe-module"!==o.getAttribute("name"))if(console.log("[router] history-navigation detected: updating slot name to typo3-iframe-module"),t.includes(this.stateTrackerUrl))console.log("[router] history-navigation detected: but we do not set slot name");else{const e=this.querySelector("typo3-iframe-module");e&&this.markActive(e,null),o.setAttribute("name","typo3-iframe-module")}}this.setUrlFromState(e.detail)}),this.addEventListener("typo3-module-loaded",e=>{console.log("[router] catched typo3-module-loaded",e.detail),this.setUrlFromState(e.detail)})}attributeChangedCallback(e,t,o){console.log("[router] attribute change: ",e,o,t),super.attributeChangedCallback(e,t,o),"module"!==e&&"endpoint"!==e||this.requestUpdate()}render(){const e=this.getRecordFromName(this.module).element||"typo3-iframe-module";return o.html`<slot name="${e}"></slot>`}updated(){const e=this.getRecordFromName(this.module),t=e.element||"typo3-iframe-module",o=e.elementModule||"TYPO3/CMS/Backend/Module/Iframe",r=this.getModuleElement(t,o);this.markActive(r,this.endpoint)}getModuleElement(t,o){let r=this.querySelector(t);return null!==r||(new Promise((t,r)=>{e([o],t,r)}).then(__importStar).catch(e=>console.error({msg:`Error importing ${o} for <${t}>`,err:e})),r=document.createElement(t),r.setAttribute("slot",t),this.appendChild(r)),r}markActive(e,t){t&&e.setAttribute("endpoint",t),e.setAttribute("active","");for(let t=e.previousElementSibling;null!==t;t=t.previousElementSibling)t.removeAttribute("active");for(let t=e.nextElementSibling;null!==t;t=t.nextElementSibling)t.removeAttribute("active")}setUrlFromState(e){var t;const o=(e.url||null).split("token=");if(console.log("[router] urlParts",o),o.length<2)return;if(o[0].includes("/install/backend-user-confirmation"))return;const r=(o[0]+(null!==(t=o[1].split("&",2)[1])&&void 0!==t?t:"")).replace(/\?$/,"");window.history.replaceState(e,"",r);const i=e.title||null;i&&(document.title=i)}getRecordFromName(e){const t=document.getElementById(e);return t?{name:e,navigationComponentId:t.dataset.navigationcomponentid,navigationFrameScript:t.dataset.navigationframescript,navigationFrameScriptParam:t.dataset.navigationframescriptparameters,link:t.dataset.link,element:t.dataset.element,elementModule:t.dataset.elementModule}:{name:"",navigationComponentId:"",navigationFrameScript:"",navigationFrameScriptParam:"",link:"",element:"",elementModule:""}}};i.styles=o.css`
    :host {
      width: 100%;
      min-height: 100%;
      flex: 1 0 auto;
      display: flex;
      flex-direction: row;
    }
    ::slotted(*) {
      min-height: 100%;
      width: 100%;
    }
  `,__decorate([r.property({type:String,reflect:!0})],i.prototype,"module",void 0),__decorate([r.property({type:String,reflect:!0})],i.prototype,"endpoint",void 0),__decorate([r.property({type:String,attribute:"state-tracker"})],i.prototype,"stateTrackerUrl",void 0),i=__decorate([r.customElement("typo3-backend-module-router")],i),t.ModuleRouter=i}));