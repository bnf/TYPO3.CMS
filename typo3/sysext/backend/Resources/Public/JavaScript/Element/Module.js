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
var __decorate=this&&this.__decorate||function(e,o,t,d){var r,i=arguments.length,l=i<3?o:null===d?d=Object.getOwnPropertyDescriptor(o,t):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,o,t,d);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(i<3?r(l):i>3?r(o,t,l):r(o,t))||l);return i>3&&l&&Object.defineProperty(o,t,l),l};define(["require","exports","lit","lit/decorators"],(function(e,o,t,d){"use strict";Object.defineProperty(o,"__esModule",{value:!0}),o.ModuleElement=void 0;let r=class extends t.LitElement{constructor(){super(...arguments),this.size="small"}render(){return t.html`
      <div class="module">
        <div class="module-loading-indicator"></div>

        <div class="module-docheader">
          <div class="module-docheader-bar module-docheader-bar-navigation">
            <slot name="docheader"/>
          </div>
          <div class="module-docheader-bar module-docheader-bar-buttons">
            <div class="module-docheader-bar-buttons-column-left">
              <slot name="docheader-button-left"></slot>
            </div>
            <div class="module-docheader-bar-buttons-column-right">
              <slot name="docheader-button-right"></slot>
            </div>
          </div>
        </div>
        <div class="module-body">
          <slot></slot>
        </div>
      </div>
    `}};r.styles=t.css`
    :host {
      display: block;
      height: 100%;
    }
    .module-docheader {
      position: sticky;
      top: 16px;
      width: 100%;
      min-height: 65px;
      z-index: 300;
      background-color: #eee;
      border-bottom: 1px solid #c3c3c3;
      padding: 4px 24px 0;
      box-sizing: border-box;
      transition: margin-top .3s ease-in-out;
    }
    .module-docheader-bar {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .module-docheader-bar > *:empty {
      display: none;
    }
    .module-docheader-bar-navigation {
      min-height: 26px;
    }
    .module-docheader-bar-navigation > ::slotted(*) {
      margin-bottom: 4px;
    }
    .module-docheader-bar-buttons > * {
      box-sizing: border-box;
      min-height: 26px;
      margin-bottom: 4px;
      line-height: 26px;
    }
    .module-docheader-bar-buttons-column-left,
    .module-docheader-bar-buttons-column-right {
      display: flex;
      flex-direction: row;
    }
    .module-body {
      padding: 24px;
    }
  `,__decorate([d.property({type:String})],r.prototype,"size",void 0),r=__decorate([d.customElement("typo3-backend-module")],r),o.ModuleElement=r}));