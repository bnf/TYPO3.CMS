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

import {html, css, customElement, property, LitElement, TemplateResult, CSSResult} from 'lit-element';
import {directive, NodePart, Part} from 'lit-html';
import {lll} from 'TYPO3/CMS/Core/lit-helper';
import {IframeShim} from 'TYPO3/CMS/Backend/Module/IframeShim';

import {BroadcastMessage} from 'TYPO3/CMS/Backend/BroadcastMessage';
import BroadcastService = require('TYPO3/CMS/Backend/BroadcastService');

interface Module {
  name: string;
  navigationComponentId: string;
  navigationFrameScript: string;
  navigationFrameScriptParam: string;
  link: string;
  element: string;
  elementModule: string;
}

const immutable = directive((element: HTMLElement) => (part: Part): void => {
  if (!(part instanceof NodePart)) {
    throw new Error('includeElement can only be used in text bindings');
  }
  part.setValue(element);
});

/**
 * Module: TYPO3/CMS/Backend/ModuleRouter
 */
@customElement('typo3-backend-module-router')
export class ModuleRouter extends IframeShim(LitElement) {
  @property({type: String}) module: string = '';
  @property({type: String}) src: string = '';
  //@property({type: String}) params: string = '';
  //@property({type: Object}) moduleData: any = null;

  private decorate: boolean = false;
  private popstateHandler: (e: PopStateEvent) => void;

  private element: HTMLElement = null;

  public static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        height: 100%;
      }
    `;
  }

  constructor() {
    super();

    this.popstateHandler = (e: PopStateEvent) => {
      this._handlePopstate(e);
    }

    this.addEventListener('typo3-module-load', (e: CustomEvent) => {
      console.log('catched load in module-router', e);

      if (this.decorate) {
        //e.stopImmediatePropagation();
        e.detail.decorate = true;
        this.decorate = false;
      }
    });
    this.addEventListener('typo3-module-loaded', (e) => {
      console.log('sending load event from module-router', e);
      //this.dispatchEvent(new CustomEvent('load'));
      this.dispatchEvent(new Event('load'));
    });
  }

  public createRenderRoot(): HTMLElement | ShadowRoot {
    // Avoid shadowRoot for now, to allow modules to use topmost
    // Note: It is suggested that modules use shadowRoot(!)
    return this;
  }

  public attributeChangedCallback(name: string, oldval: string, newval: string) {
    console.log('attribute change: ', name, newval, oldval);
    super.attributeChangedCallback(name, oldval, newval);

    if (name === 'module' || name === 'src') {
      // Trigger refresh, also when attribute is updated with same value
      this.requestUpdate();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('popstate', this.popstateHandler);
  }

  public disconnectedCallback(): void {
    window.addEventListener('popstate', this.popstateHandler);
    super.disconnectedCallback();
  }

  public render(): TemplateResult {
    const moduleData = this.getRecordFromName(this.module);
    const moduleElement = moduleData.element || 'typo3-iframe-module';
    const moduleElementModule = moduleData.elementModule || 'TYPO3/CMS/Backend/Module/Iframe';

    if (this.element === null || this.element.tagName.toLowerCase() !== moduleElement) {
      this.element = document.createElement(moduleElement);
      import(moduleElementModule);
    }
    this.element.setAttribute('src', this.src);

    return html`${immutable(this.element)}`;
  }

  private _handlePopstate(event: PopStateEvent) {
    console.log('location: ' + document.location + ', state: ' + JSON.stringify(event.state));
    if (event.state.module) {
      // @todo avoid pushing new state that originates from this change
      this.setAttribute('module', event.state.module);
      this.decorate = true;
    } else {
      this.removeAttribute('module');
    }
    if (event.state.url) {
      this.setAttribute('src', event.state.url);
      this.decorate = true;
    } else {
      this.removeAttribute('src');
    }
  }

  /**
   * Gets the module properties from module menu markup (data attributes)
   *
   * @param {string} name
   * @returns {Module}
   */
  private getRecordFromName(name: string): Module {
    const subModuleElement = document.getElementById(name);
    if (!subModuleElement) {
      return {
        name: '',
        navigationComponentId: '',
        navigationFrameScript: '',
        navigationFrameScriptParam: '',
        link: '',
        element: '',
        elementModule: ''
      };
    }
    return {
      name: name,
      navigationComponentId: subModuleElement.dataset.navigationcomponentid,
      navigationFrameScript: subModuleElement.dataset.navigationframescript,
      navigationFrameScriptParam: subModuleElement.dataset.navigationframescriptparameters,
      link: subModuleElement.dataset.link,
      element: subModuleElement.dataset.element,
      elementModule: subModuleElement.dataset.elementModule,
    };
  }
}
