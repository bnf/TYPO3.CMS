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

import {html, svg, property, internalProperty, LitElement, TemplateResult, SVGTemplateResult} from 'lit-element';
import {unsafeSVG} from 'lit-html/directives/unsafe-svg';
import {TreeNode} from './Tree/TreeNode';
import * as d3selection from 'd3-selection';
import AjaxRequest from 'TYPO3/CMS/Core/Ajax/AjaxRequest';
import Notification = require('./Notification');
import {KeyTypesEnum as KeyTypes} from './Enum/KeyTypes';
import Icons = require('./Icons');
import Tooltip = require('./Tooltip');
import {AjaxResponse} from 'TYPO3/CMS/Core/Ajax/AjaxResponse';
import {MarkupIdentifiers} from './Enum/IconTypes';
import {ifDefined} from 'lit-html/directives/if-defined';

export type TreeWrapperSelection<TBase extends d3selection.BaseType> = d3selection.Selection<TBase, any, any, any>;
export type TreeNodeSelection = d3selection.Selection<d3selection.BaseType, TreeNode, any, any>;

interface SvgTreeData {
  nodes: TreeNode[];
  links: SvgTreeDataLink[];
}

interface SvgTreeDataLink {
  source: TreeNode;
  target: TreeNode;
}

interface SvgTreeDataIcon {
  identifier: string;
  icon: string;
}

export interface SvgTreeSettings {
  [keys: string]: any;
  defaultProperties: {[keys: string]: any};
}

export interface SvgTreeWrapper extends HTMLElement {
  svgtree?: SvgTree
}

export class SvgTree extends LitElement {
  @property({type: Object}) setup?: {[keys: string]: any} = null;
  @internalProperty() settings: SvgTreeSettings = {
    showIcons: false,
    marginTop: 15,
    nodeHeight: 20,
    indentWidth: 16,
    width: 300,
    duration: 400,
    dataUrl: '',
    filterUrl: '',
    defaultProperties: {},
    expandUpToLevel: null as any,
  };

  /**
   * Check if cursor is over the SVG element
   */
  public isOverSvg: boolean = false;

  /**
   * Root <svg> element
   */
  public svg: TreeWrapperSelection<SVGSVGElement> = null;

  /**
   * SVG <g> container wrapping all .nodes, .links, .nodes-bg  elements
   */
  public container: TreeWrapperSelection<SVGGElement> = null;

  /**
   * SVG <g> container wrapping all .node elements
   */
  public nodesContainer: TreeWrapperSelection<SVGGElement> = null;

  /**
   * SVG <g> container wrapping all .nodes-bg elements
   */
  public nodesBgContainer: TreeWrapperSelection<SVGGElement> = null;

  /**
   * Is set when the input device is hovered over a node
   */
  public hoveredNode: TreeNode|null = null;

  public nodes: TreeNode[] = [];

  public textPosition: number = 10;

  protected icons: {[keys: string]: SvgTreeDataIcon} = {};

  protected data: SvgTreeData = new class implements SvgTreeData {
    links: SvgTreeDataLink[] = [];
    nodes: TreeNode[] = [];
  };

  protected viewportHeight: number = 0;
  protected scrollBottom: number = 0;
  protected searchTerm: string|null = null;
  protected unfilteredNodes: string = '';

  /**
   * @todo: use generic labels
   */
  protected networkErrorTitle: string = TYPO3.lang.pagetree_networkErrorTitle;
  protected networkErrorMessage: string = TYPO3.lang.pagetree_networkErrorDesc;

  /**
   * Initializes the tree component - created basic markup, loads and renders data
   * @todo declare private
   */
  public doSetup(settings: any): void {
    Object.assign(this.settings, settings);
    if (this.settings.showIcons) {
      this.textPosition += 20;
    }

    this.svg = d3selection.select(this).select('svg');
    this.container = this.svg.select('.nodes-wrapper') as TreeWrapperSelection<SVGGElement>;
    this.nodesBgContainer = this.container.select('.nodes-bg') as TreeWrapperSelection<SVGGElement>;
    this.nodesContainer = this.container.select('.nodes') as TreeWrapperSelection<SVGGElement>;

    this.updateScrollPosition();
    this.loadData();
    this.dispatchEvent(new Event('svg-tree:initialized'));
  }

  /**
   * Make the DOM element given as parameter focusable and focus it
   *
   * @param {SVGElement} element
   */
  public switchFocus(element: SVGElement|HTMLElement): void {
    if (element === null) {
      return;
    }
    const visibleElements = element.parentNode.querySelectorAll('[tabindex]');
    visibleElements.forEach((visibleElement) => {
      visibleElement.setAttribute('tabindex','-1');
    });
    element.setAttribute('tabindex', '0');
    element.focus();
  }

  /**
   * Make the DOM element of the node given as parameter focusable and focus it
   */
  public switchFocusNode(node: TreeNode): void {
    this.switchFocus(this.getNodeElement(node));
  }

  /**
   * Return the DOM element of a tree node
   */
  public getNodeElement(node: TreeNode): HTMLElement|null {
    return this.querySelector('#identifier-' + this.getNodeStateIdentifier(node));
  }

  /**
   * Loads tree data (json) from configured url
   */
  public loadData() {
    this.nodesAddPlaceholder();
    (new AjaxRequest(this.settings.dataUrl))
      .get({cache: 'no-cache'})
      .then((response: AjaxResponse) => response.resolve())
      .then((json) => {
        const nodes = Array.isArray(json) ? json : [];
        this.replaceData(nodes);
        this.nodesRemovePlaceholder();
        // @todo: needed?
        this.updateScrollPosition();
        this.requestUpdate();
      })
      .catch((error) => {
        this.errorNotification(error, false);
        this.nodesRemovePlaceholder();
        throw error;
      });
  }

  /**
   * Delete old tree and create new one
   */
  public replaceData(nodes: TreeNode[]) {
    this.setParametersNode(nodes);
    this.prepareDataForVisibleNodes();
    this.nodesBgContainer.selectAll('.node-bg').remove();
    this.requestUpdate();
  }

  /**
   * Set parameters like node parents, parentsStateIdentifier, checked.
   * Usually called when data is loaded initially or replaced completely.
   *
   * @param {Node[]} nodes
   */
  public setParametersNode(nodes: TreeNode[] = null): void {
    nodes = nodes || this.nodes;
    nodes = nodes.map((node, index) => {
      if (typeof node.command === 'undefined') {
        node = Object.assign({}, this.settings.defaultProperties, node);
      }
      node.expanded = (this.settings.expandUpToLevel !== null) ? node.depth < this.settings.expandUpToLevel : Boolean(node.expanded);
      node.parents = [];
      node.parentsStateIdentifier = [];
      if (node.depth > 0) {
        let currentDepth = node.depth;
        for (let i = index; i >= 0; i--) {
          let currentNode = nodes[i];
          if (currentNode.depth < currentDepth) {
            node.parents.push(i);
            node.parentsStateIdentifier.push(nodes[i].stateIdentifier);
            currentDepth = currentNode.depth;
          }
        }
      }

      if (typeof node.checked === 'undefined') {
        node.checked = false;
      }
      return node;
    });

    // get nodes with depth 0, if there is only 1 then open it and disable toggle
    const nodesOnRootLevel = nodes.filter((node) => node.depth === 0);
    if (nodesOnRootLevel.length === 1) {
      nodes[0].expanded = true;
    }
    const evt = new CustomEvent('typo3:svg-tree:nodes-prepared', {detail: {nodes: nodes}, bubbles: false});
    this.dispatchEvent(evt);
    this.nodes = evt.detail.nodes;
  }

  public nodesRemovePlaceholder() {
    const nodeLoader = this.querySelector('.node-loader') as HTMLElement;
    if (nodeLoader) {
      nodeLoader.style.display = 'none';
    }
    const componentWrapper = this.closest('.svg-tree');
    const treeLoader = componentWrapper?.querySelector('.svg-tree-loader') as HTMLElement;
    if (treeLoader) {
      treeLoader.style.display = 'none';
    }
  }

  public nodesAddPlaceholder(node: TreeNode = null) {
    if (node) {
      const nodeLoader = this.querySelector('.node-loader') as HTMLElement;
      if (nodeLoader) {
        nodeLoader.style.top = '' + (node.y + this.settings.marginTop);
        nodeLoader.style.display = 'block';
      }
    } else {
      const componentWrapper = this.closest('.svg-tree');
      const treeLoader = componentWrapper?.querySelector('.svg-tree-loader') as HTMLElement;
      if (treeLoader) {
        treeLoader.style.display = 'block';
      }
    }
  }

  /**
   * Updates node's data to hide/collapse children
   *
   * @param {Node} node
   */
  public hideChildren(node: TreeNode): void {
    node.expanded = false;
    this.setExpandedState(node);
    this.dispatchEvent(new CustomEvent('typo3:svg-tree:expand-toggle', {detail: {node: node}}));
  }

  /**
   * Updates node's data to show/expand children
   *
   * @param {Node} node
   */
  public showChildren(node: TreeNode): void {
    node.expanded = true;
    this.setExpandedState(node);
    this.dispatchEvent(new CustomEvent('typo3:svg-tree:expand-toggle', {detail: {node: node}}));
  }

  /**
   * Updates the expanded state of the DOM element that belongs to the node.
   * This is required because the node is not recreated on update and thus the change in the expanded state
   * of the node data is not represented in DOM on hideChildren and showChildren.
   *
   * @param {Node} node
   */
  public setExpandedState(node: TreeNode): void {
    const nodeElement = this.getNodeElement(node);
    if (nodeElement) {
      if (node.hasChildren) {
        nodeElement.setAttribute('aria-expanded', node.expanded ? 'true' : 'false');
      } else {
        nodeElement.removeAttribute('aria-expanded');
      }
    }
  }

  /**
   * Refresh view with new data
   */
  public refreshTree(): void {
    this.loadData();
  }

  public refreshOrFilterTree(): void {
    if (this.searchTerm !== '') {
      this.filter(this.searchTerm);
    } else {
      this.refreshTree();
    }
  }

  /**
   * Filters out invisible nodes (collapsed) from the full dataset (this.rootNode)
   * and enriches dataset with additional properties
   * Visible dataset is stored in this.data
   */
  public prepareDataForVisibleNodes(): void {
    const blacklist: {[keys: string]: boolean} = {};
    this.nodes.forEach((node: TreeNode, index: number): void => {
      if (!node.expanded) {
        blacklist[index] = true;
      }
    });

    this.data.nodes = this.nodes.filter((node: TreeNode): boolean => {
      return node.hidden !== true && !node.parents.some((index: number) => Boolean(blacklist[index]))
    });

    this.data.links = [];
    let pathAboveMounts = 0;

    this.data.nodes.forEach((node: TreeNode, i: number) => {
      // delete n.children;
      node.x = node.depth * this.settings.indentWidth;
      if (node.readableRootline) {
        pathAboveMounts += this.settings.nodeHeight;
      }

      node.y = (i * this.settings.nodeHeight) + pathAboveMounts;
      if (node.parents[0] !== undefined) {
        this.data.links.push({
          source: this.nodes[node.parents[0]],
          target: node
        });
      }

      if (this.settings.showIcons) {
        this.fetchIcon(node.icon);
        this.fetchIcon(node.overlayIcon);
        if (node.locked) {
          this.fetchIcon('warning-in-use');
        }
      }
    });

    this.svg.attr('height', ((this.data.nodes.length * this.settings.nodeHeight) + (this.settings.nodeHeight / 2) + pathAboveMounts));
  }

  /**
   * Fetch icon from Icon API and store it in this.icons
   */
  public fetchIcon(iconName: string, update: boolean = true): void {
    if (!iconName) {
      return;
    }

    if (!(iconName in this.icons)) {
      this.icons[iconName] = {
        identifier: iconName,
        icon: ''
      };
      Icons.getIcon(iconName, Icons.sizes.small, null, null, MarkupIdentifiers.inline).then((icon: string) => {
        let result = icon.match(/<svg[\s\S]*<\/svg>/i);
        if (result) {
          this.icons[iconName].icon = result[0];
        }
        if (update) {
          this.updateVisibleNodes();
        }
      });
    }
  }


  /**
   * Renders the subset of the tree nodes fitting the viewport
   */
  public renderVisibleNodes(): SVGTemplateResult[] {
    const visibleRows = Math.ceil(this.viewportHeight / this.settings.nodeHeight + 1);
    const position = Math.floor(Math.max(this.scrollTop - (this.settings.nodeHeight * 2), 0) / this.settings.nodeHeight);

    const visibleNodes = this.data.nodes.slice(position, position + visibleRows);
    const focusableElement = this.querySelector('[tabindex="0"]');

    const renderedNodes: TemplateResult[] = [];
    const checkedNodeInViewport = visibleNodes.find((node: TreeNode) => node.checked);

    return visibleNodes.map((node) => svg`
      <g class=${this.getNodeClass(node)}
         id="identifier-${node.stateIdentifier}"
         role="treeitem"
         aria-owns=${ifDefined(node.hasChildren ? 'group-identifier-' + node.stateIdentifier : undefined)}
         aria-level=${this.getNodeDepth(node)}
         aria-setsize=${ifDefined(this.getNodeSetsize(node))}
         aria-posinset=${ifDefined(this.getNodePositionInSet(node))}
         aria-expanded=${ifDefined(node.hasChildren ? node.expanded : undefined)}
         transform=${this.getNodeTransform(node)}
         data-state-id=${this.getNodeStateIdentifier(node)}
         title=${this.getNodeTitle(node)}
         data-depth=${node.depth}
         tabindex="TODO"
         @mouseover=${(evt: MouseEvent) => this.onMouseOverNode(node)}
         @mouseout=${(evt: MouseEvent) => this.onMouseOutOfNode(node)}
         @contextmenu=${(evt: MouseEvent) => {evt.preventDefault(); this.dispatchEvent(new CustomEvent('typo3:svg-tree:node-context', {detail: {node: node}}))}}
         >${this.renderNode(node)}</g>
    `);

    // @todo: add hooks for previous
    //    this.dispatch.call('updateNodes', this, nodes);
    // functionality of subclasses
  }

  protected renderNode(node: TreeNode): SVGTemplateResult {
    return svg`
      <text class="node-rootline" dx="0" dy="-15" visibility=${node.readableRootline ? 'visible' : 'hidden'}
        >${node.readableRootline}</text>

      <g class="toggle" visibility=${this.getToggleVisibility(node)} transform="translate(-8, -8)" @click=${(evt: MouseEvent) => this.chevronClick(node)}">
        <path d="M 0 0 L 16 0 L 16 16 L 0 16 Z" style="opacity: 0;"></path>
        <path d="M 4 3 L 13 8 L 4 13 Z" class=${this.getChevronClass(node)} transform=${this.getChevronTransform(node)} style="fill: ${this.getChevronColor(node)};"></path>
      </g>

      <text dx=${this.getTextElementPosition(node)} dy="5" class="node-name" @click=${this.getTextElementOnClick(node)}
        >${this.getNodeLabel(node)}</text>

      ${this.settings.showIcons === false ? '' : svg`
        <g class="node-icon-container" title=${this.getNodeTitle(node)} data-bs-toggle="tooltip" @click=${(evt: MouseEvent) => this.clickOnIcon(node)}>
          <use class="node-icon" data-uid=${this.getNodeIdentifier(node)} transform="translate(8, -8)" href="${this.getIconId(node)}"/>
          <use class="node-icon-overlay" transform="translate(8, -3)" href="${this.getIconOverlayId(node)}"/>
          ${node.locked ? svg`<use class="node-icon-locked" x="27" y="-7" href="#icon-warning-in-use"/>` : ''}
        </g>
      `}
    `;

    /*
    Tooltip.initialize('[data-bs-toggle="tooltip"]', {
      delay: {
        'show': 50,
        'hide': 50
      },
      trigger: 'hover',
      placement: 'right'
    });
   */
  }

  public renderVisibleNodesBgs(): SVGTemplateResult[] {
    const visibleRows = Math.ceil(this.viewportHeight / this.settings.nodeHeight + 1);
    const position = Math.floor(Math.max(this.scrollTop - (this.settings.nodeHeight * 2), 0) / this.settings.nodeHeight);

    const visibleNodes = this.data.nodes.slice(position, position + visibleRows);
    const focusableElement = this.querySelector('[tabindex="0"]');

    const renderedNodes: TemplateResult[] = [];
    const checkedNodeInViewport = visibleNodes.find((node: TreeNode) => node.checked);

    return visibleNodes.map((node: TreeNode, i: number) => svg`
      <rect width="100%"
            height=${this.settings.nodeHeight}
            rx="${node.isOver ? 3 : 0}"
            ry="${node.isOver ? 3 : 0}"
            data-state-id=${this.getNodeStateIdentifier(node)}
            class=${this.getNodeBgClass(node, i, visibleNodes)}
            style=${node.backgroundColor ? 'fill: ' + node.backgroundColor + ';' : ''}
            transform=${this.getNodeBgTransform(node)}
            @mouseover=${(evt: MouseEvent) => this.onMouseOverNode(node)}
            @mouseout=${(evt: MouseEvent) => this.onMouseOutOfNode(node)}
            @click=${(evt: MouseEvent) => {evt.preventDefault(); this.selectNode(node); this.switchFocusNode(node);}}
            @contextmenu=${(evt: MouseEvent) => {evt.preventDefault(); this.dispatchEvent(new CustomEvent('typo3:svg-tree:node-context', {detail: {node: node}}))}}></rect>
    `);
  }

  protected getTextElementPosition(node: TreeNode): number {
    const textPosition = this.settings.showIcons ? 30 : 10;

    return textPosition + (node.locked ? 15 : 0);
  }

  protected getTextElementOnClick(node: TreeNode): (evt: MouseEvent) => void {
    return (evt: MouseEvent): void => {
      this.selectNode(node)
    };
  }

  /**
   * Renders the subset of the tree nodes fitting the viewport (adding, modifying and removing SVG nodes)
   */
  public updateVisibleNodes(): void {
    this.requestUpdate();
    return;
    /*
    const visibleRows = Math.ceil(this.viewportHeight / this.settings.nodeHeight + 1);
    const position = Math.floor(Math.max(this.scrollTop - (this.settings.nodeHeight * 2), 0) / this.settings.nodeHeight);

    const visibleNodes = this.data.nodes.slice(position, position + visibleRows);
    const focusableElement = this.querySelector('[tabindex="0"]');
    const checkedNodeInViewport = visibleNodes.find((node: TreeNode) => node.checked);
    let nodes = this.nodesContainer.selectAll('.node')
      .data(visibleNodes, (node: TreeNode) => node.stateIdentifier);
    const nodesBg = this.nodesBgContainer.selectAll('.node-bg')
      .data(visibleNodes, (node: TreeNode) => node.stateIdentifier);

    // delete nodes without corresponding data
    nodes.exit().remove();
    // delete
    nodesBg.exit().remove();

    // update nodes background
    const nodeBgClass = this.updateNodeBgClass(nodesBg);

    nodeBgClass
      .attr('class', (node: TreeNode, i: number) => {
        return this.getNodeBgClass(node, i, nodeBgClass);
      })
      .attr('style', (node: TreeNode) => {
        return node.backgroundColor ? 'fill: ' + node.backgroundColor + ';' : '';
      });

    //this.updateLinks();
    nodes = this.enterSvgElements(nodes);

    // update nodes
    nodes
      .attr('tabindex', (node: TreeNode, index: number) => {
        if (typeof checkedNodeInViewport !== 'undefined') {
          if (checkedNodeInViewport === node) {
            return '0';
          }
        } else {
          if (focusableElement === null) {
            if (index === 0) {
              return '0';
            }
          } else {
            if (d3selection.select(focusableElement).datum() === node) {
              return '0';
            }
          }
        }
        return '-1';
      })
      .attr('transform', this.getNodeTransform)
      .select('.node-name')
      .text(this.getNodeLabel);

    nodes
      .select('.chevron')
      .attr('transform', this.getChevronTransform)
      .style('fill', this.getChevronColor)
      .attr('class', this.getChevronClass);

    nodes
      .select('.toggle')
      .attr('visibility', this.getToggleVisibility);

    if (this.settings.showIcons) {
      nodes
        .select('use.node-icon')
        .attr('xlink:href', this.getIconId);
      nodes
        .select('use.node-icon-overlay')
        .attr('xlink:href', this.getIconOverlayId);
      nodes
        .select('use.node-icon-locked')
        .attr('xlink:href', (node: TreeNode) => {
          return '#icon-' + (node.locked ? 'warning-in-use' : '');
        });
    }
    */
  }

  public updateNodeBgClass(nodesBg: TreeNodeSelection): TreeNodeSelection {
    return nodesBg.enter()
      .append('rect')
      .merge(nodesBg as d3selection.Selection<SVGRectElement, TreeNode, any, any>)
      .attr('width', '100%')
      .attr('height', this.settings.nodeHeight)
      .attr('data-state-id', this.getNodeStateIdentifier)
      .attr('transform', this.getNodeBgTransform)
      .on('mouseover', (evt: MouseEvent, node: TreeNode) => this.onMouseOverNode(node))
      .on('mouseout', (evt: MouseEvent, node: TreeNode) => this.onMouseOutOfNode(node))
      .on('click', (evt: MouseEvent, node: TreeNode) => {
        this.selectNode(node);
        this.switchFocusNode(node);
      })
      .on('contextmenu', (evt: MouseEvent, node: TreeNode) => {
        this.dispatchEvent(new CustomEvent('typo3:svg-tree:node-context', {detail: {node: node}}));
      });
  }

  /**
   * Returns icon's href attribute value
   */
  public getIconId(node: TreeNode): string {
    return '#icon-' + node.icon;
  }

  /**
   * Returns icon's href attribute value
   */
  public getIconOverlayId(node: TreeNode): string {
    return '#icon-' + node.overlayIcon;
  }

  /**
   * Node selection logic (triggered by different events)
   * This represents a dummy method and is usually overridden
   */
  public selectNode(node: TreeNode): void {
    if (!this.isNodeSelectable(node)) {
      return;
    }
    // Disable already selected nodes
    this.disableSelectedNodes();
    node.checked = true;
    this.dispatchEvent(new CustomEvent('typo3:svg-tree:node-selected', {detail: {node: node}}));
    this.updateVisibleNodes();
  }

  public filter(searchTerm?: string|null): void {
    if (typeof searchTerm === 'string') {
      this.searchTerm = searchTerm;
    }
    this.nodesAddPlaceholder();
    if (this.searchTerm && this.settings.filterUrl) {
      (new AjaxRequest(this.settings.filterUrl + '&q=' + this.searchTerm))
        .get({cache: 'no-cache'})
        .then((response: AjaxResponse) => response.resolve())
        .then((json) => {
          let nodes = Array.isArray(json) ? json : [];
          if (nodes.length > 0) {
            if (this.unfilteredNodes === '') {
              this.unfilteredNodes = JSON.stringify(this.nodes);
            }
            this.replaceData(nodes);
          }
          this.nodesRemovePlaceholder();
        })
        .catch((error: any) => {
          this.errorNotification(error, false)
          this.nodesRemovePlaceholder();
          throw error;
        });
    } else {
      // restore original state without filters
      this.resetFilter();
    }
  }

  public resetFilter(): void
  {
    this.searchTerm = '';
    if (this.unfilteredNodes.length > 0) {
      let currentlySelected = this.getSelectedNodes()[0];
      if (typeof currentlySelected === 'undefined') {
        this.refreshTree();
        return;
      }
      this.nodes = JSON.parse(this.unfilteredNodes);
      this.unfilteredNodes = '';
      // re-select the node from the identifier because the nodes have been updated
      const currentlySelectedNode = this.getNodeByIdentifier(currentlySelected.stateIdentifier);
      if (currentlySelectedNode) {
        this.selectNode(currentlySelectedNode);
      } else {
        this.refreshTree();
      }
    } else {
      this.refreshTree();
    }
    this.prepareDataForVisibleNodes();
    this.updateVisibleNodes();
  }

  /**
   * Displays a notification message and refresh nodes
   */
  public errorNotification(error: any = null, refresh: boolean = false): void {
    if (Array.isArray(error)) {
      error.forEach((message: any) => { Notification.error(
        message.title,
        message.message
      )});
    } else {
      let title = this.networkErrorTitle;
      if (error && error.target && (error.target.status || error.target.statusText)) {
        title += ' - ' + (error.target.status || '') + ' ' + (error.target.statusText || '');
      }
      Notification.error(title, this.networkErrorMessage);
    }
    if (refresh) {
      this.loadData();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('resize', () => this.updateView());
    this.addEventListener('scroll', () => this.updateView());
    this.addEventListener('svg-tree:visible', () => this.updateView());
    window.addEventListener('resize', () => {
      if (this.getClientRects().length > 0) {
        this.updateView();
      }
    });
  }

  /**
   * Returns an array of selected nodes
   */
  public getSelectedNodes(): TreeNode[] {
    return this.nodes.filter((node: TreeNode) => node.checked);
  }

  // disable shadow dom for now
  protected createRenderRoot(): HTMLElement | ShadowRoot {
    return this;
  }

  protected render(): TemplateResult {
    const icons = Object.values(this.icons).filter((icon: SvgTreeDataIcon): boolean => icon.icon !== '');

    return html`
      <div class="node-loader">
        <typo3-backend-icon identifier="spinner-circle-light" size="small"></typo3-backend-icon>
      </div>
      <svg version="1.1"
           width="100%"
           @mouseover=${() => this.isOverSvg = true}
           @mouseout=${() => this.isOverSvg = false}
           @keydown=${(evt: KeyboardEvent) => this.handleKeyboardInteraction(evt)}>
        <g class="nodes-wrapper"
           transform="translate(${this.settings.indentWidth / 2},${this.settings.nodeHeight / 2})">
          <g class="nodes-bg">
            ${this.renderVisibleNodesBgs()}
          </g>
          <g class="links">
            ${this.renderVisibleLinks()}
          </g>
          <g class="nodes" role="tree">
            ${this.renderVisibleNodes()}
          </g>
        </g>
        <defs>
          ${icons.map(icon => svg`
            <g class="icon-def" id="icon-${icon.identifier}">
              ${unsafeSVG(icon.icon.replace('<svg', '<g').replace('/svg>', '/g>'))}
            </g>`)}
        </defs>
      </svg>
    `;
  }

  protected firstUpdated(): void {
    this.svg = d3selection.select(this.querySelector('svg'));
    this.container = d3selection.select(this.querySelector('.nodes-wrapper')) as any;
    this.nodesBgContainer = d3selection.select(this.querySelector('.nodes-bg')) as any;
    this.nodesContainer = d3selection.select(this.querySelector('.nodes')) as any;

    this.doSetup(this.setup || {});
  }

  protected updateView(): void {
    this.updateScrollPosition();
    this.updateVisibleNodes();
  }

  protected disableSelectedNodes(): void {
    // Disable already selected nodes
    this.getSelectedNodes().forEach((node: TreeNode) => {
      if (node.checked === true) {
        node.checked = false;
      }
    });
  }

  /**
   * Check whether node can be selected.
   * In some cases (e.g. selecting a parent) it should not be possible to select
   * element (as it's own parent).
   */
  protected isNodeSelectable(node: TreeNode): boolean {
    return true;
  }

  protected appendTextElement(nodes: TreeNodeSelection): TreeNodeSelection {
    return nodes
    /*
      .append('text')
      .attr('dx', (node: TreeNode) => {
        return this.textPosition + (node.locked ? 15 : 0);
      })
      .attr('dy', 5)
      .attr('class', 'node-name')
      .on('click', (evt: MouseEvent, node: TreeNode) => this.selectNode(node));
     */
  }

  protected nodesUpdate(nodes: TreeNodeSelection): TreeNodeSelection {
    return nodes;
  }

  protected getNodeIdentifier(node: TreeNode): string {
    return node.identifier;
  }

  protected getNodeDepth(node: TreeNode): number {
    return node.depth;
  }

  protected getNodeSetsize(node: TreeNode): number {
    return node.siblingsCount;
  }

  protected getNodePositionInSet(node: TreeNode): number {
    return node.siblingsPosition;
  }

  protected getNodeStateIdentifier(node: TreeNode): string {
    return node.stateIdentifier;
  }

  protected getNodeLabel(node: TreeNode): string {
    return (node.prefix || '') + node.name + (node.suffix || '');
  }

  protected getNodeClass(node: TreeNode): string {
    return 'node identifier-' + node.stateIdentifier;
  }

  /**
   * Finds node by its stateIdentifier (e.g. "0_360")
   */
  protected getNodeByIdentifier(identifier: string): TreeNode|null {
    return this.nodes.find((node: TreeNode) => {
      return node.stateIdentifier === identifier;
    });
  }

  /**
   * Computes the tree node-bg class
   */
  protected getNodeBgClass(node: TreeNode, i: number, nodes: TreeNode[]): string {
    let bgClass = 'node-bg';
    let prevNode = null;
    let nextNode = null;

    if (nodes !== null) {
      prevNode = nodes[i - 1];
      nextNode = nodes[i + 1];
    }

    if (node.checked) {
      bgClass += ' node-selected';
    }

    if ((prevNode && (node.depth > prevNode.depth)) || !prevNode) {
      node.firstChild = true;
      bgClass += ' node-first-child';
    }

    if ((nextNode && (node.depth > nextNode.depth)) || !nextNode) {
      node.lastChild = true;
      bgClass += ' node-last-child';
    }

    if (node.class) {
      bgClass += ' ' + node.class;
    }

    if (node.isOver) {
      bgClass += ' node-over';
    }

    return bgClass;
  }

  protected getNodeTitle(node: TreeNode): string {
    return node.tip ? node.tip : 'uid=' + node.identifier;
  }

  protected getChevronTransform(node: TreeNode): string {
    return node.expanded ? 'translate(16,0) rotate(90)' : ' rotate(0)';
  }

  protected  getChevronColor(node: TreeNode): string {
    return node.expanded ? '#000' : '#8e8e8e';
  }

  protected getToggleVisibility(node: TreeNode): string {
    return node.hasChildren ? 'visible' : 'hidden';
  }

  protected getChevronClass(node: TreeNode): string {
    return 'chevron ' + (node.expanded ? 'expanded' : 'collapsed');
  }

  /**
   * Returns a SVG path's 'd' attribute value
   *
   * @param {SvgTreeDataLink} link
   * @returns {String}
   */
  protected getLinkPath(link: SvgTreeDataLink): string {
    const target = {
      x: link.target.x,
      y: link.target.y
    };
    const path = [];
    path.push('M' + link.source.x + ' ' + link.source.y);
    path.push('V' + target.y);
    if (link.target.hasChildren) {
      path.push('H' + (target.x - 2));
    } else {
      path.push('H' + ((target.x + this.settings.indentWidth / 4) - 2));
    }
    return path.join(' ');
  }

  /**
   * Returns a 'transform' attribute value for the tree element (absolute positioning)
   *
   * @param {Node} node
   */
  protected getNodeTransform(node: TreeNode): string {
    return 'translate(' + (node.x || 0) + ',' + (node.y || 0) + ')';
  }

  /**
   * Returns a 'transform' attribute value for the node background element (absolute positioning)
   *
   * @param {Node} node
   */
  protected getNodeBgTransform(node: TreeNode): string {
    return 'translate(-8, ' + ((node.y || 0) - 10) + ')';
  }

  /**
   * Event handler for clicking on a node's icon
   */
  protected clickOnIcon(node: TreeNode): void {
    this.dispatchEvent(new CustomEvent('typo3:svg-tree:node-context', {detail: {node: node}}));
  }

  /**
   * Event handler for click on a chevron
   */
  protected chevronClick(node: TreeNode): void {
    if (node.expanded) {
      this.hideChildren(node);
    } else {
      this.showChildren(node);
    }
    this.prepareDataForVisibleNodes();
    this.updateVisibleNodes();
  }

  /**
   * Adds missing SVG nodes
   *
   * @param {Selection} nodes
   * @returns {Selection}
   */
  protected enterSvgElements(nodes: TreeNodeSelection): TreeNodeSelection {
    /*
    if (this.settings.showIcons) {
      const iconsArray = Object.values(this.icons)
        .filter((icon: SvgTreeDataIcon): boolean => icon.icon !== '');
      const icons = this.iconsContainer
        .selectAll('.icon-def')
        .data(iconsArray, (icon: SvgTreeDataIcon) => icon.identifier);
      icons.exit().remove();

      icons
        .enter()
        .append('g')
        .attr('class', 'icon-def')
        .attr('id', (node: TreeNode) => 'icon-' + node.identifier)
        .append((node: TreeNode): SVGElement => {
          // workaround for IE11 where you can't simply call .html(content) on svg
          const parser = new DOMParser();
          const markupText = node.icon.replace('<svg', '<g').replace('/svg>', '/g>');
          const markup = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + markupText + '</svg>';
          const dom = parser.parseFromString(markup, 'image/svg+xml');
          return dom.documentElement.firstChild as SVGElement;
        });
    }
   */

    // create the node elements
    const nodeEnter = this.nodesUpdate(nodes);

    // append the chevron element
    let chevron = nodeEnter
      .append('g')
      .attr('class', 'toggle')
      .attr('visibility', this.getToggleVisibility)
      .attr('transform', 'translate(-8, -8)')
      .on('click', (evt: MouseEvent, node: TreeNode) => this.chevronClick(node));

    // improve usability by making the click area a 16px square
    chevron
      .append('path')
      .style('opacity', 0)
      .attr('d', 'M 0 0 L 16 0 L 16 16 L 0 16 Z');
    chevron
      .append('path')
      .attr('class', 'chevron')
      .attr('d', 'M 4 3 L 13 8 L 4 13 Z');

    // append the icon element
    if (this.settings.showIcons) {
      const nodeContainer = nodeEnter
        .append('g')
        .attr('class', 'node-icon-container')
        .attr('title', this.getNodeTitle)
        .attr('data-bs-toggle', 'tooltip')
        .on('click', (evt: MouseEvent, node: TreeNode) => {
          this.clickOnIcon(node)
        });

      nodeContainer
        .append('use')
        .attr('class', 'node-icon')
        .attr('data-uid', this.getNodeIdentifier)
        .attr('transform', 'translate(8, -8)');

      nodeContainer
        .append('use')
        .attr('transform', 'translate(8, -3)')
        .attr('class', 'node-icon-overlay');

      nodeContainer
        .append('use')
        .attr('x', 27)
        .attr('y', -7)
        .attr('class', 'node-icon-locked');
    }

    Tooltip.initialize('[data-bs-toggle="tooltip"]', {
      delay: {
        'show': 50,
        'hide': 50
      },
      trigger: 'hover',
      placement: 'right'
    });

    this.appendTextElement(nodeEnter);
    return nodes.merge(nodeEnter);
  }
  /**
   * Updates variables used for visible nodes calculation
   */
  private updateScrollPosition(): void {
    this.viewportHeight = this.getBoundingClientRect().height;
    this.scrollBottom = this.scrollTop + this.viewportHeight + (this.viewportHeight / 2);
    // disable tooltips when scrolling
    Tooltip.hide(this.querySelectorAll('[data-bs-toggle=tooltip]'));
  }

  /**
   * node background events
   */
  private onMouseOverNode(node: TreeNode): void {
    node.isOver = true;
    this.hoveredNode = node;

    this.requestUpdate();

    /*
    let elementNodeBg = this.svg.select('.nodes-bg .node-bg[data-state-id="' + node.stateIdentifier + '"]');
    if (elementNodeBg.size()) {
      elementNodeBg
        .classed('node-over', true)
        .attr('rx', '3')
        .attr('ry', '3');
    }
    */
  }
  /**
   * node background events
   */
  private onMouseOutOfNode(node: TreeNode): void {
    node.isOver = false;
    this.hoveredNode = null;

    this.requestUpdate();

    /*
    let elementNodeBg = this.svg.select('.nodes-bg .node-bg[data-state-id="' + node.stateIdentifier + '"]');
    if (elementNodeBg.size()) {
      elementNodeBg
        .classed('node-over node-alert', false)
        .attr('rx', '0')
        .attr('ry', '0');
    }
    */
  }

  /**
   * Add keydown handling to allow keyboard navigation inside the tree
   */
  private handleKeyboardInteraction(evt: KeyboardEvent) {
    const evtTarget = evt.target as SVGElement;
    let currentNode = d3selection.select(evtTarget).datum() as TreeNode;
    const charCodes = [
      KeyTypes.ENTER,
      KeyTypes.SPACE,
      KeyTypes.END,
      KeyTypes.HOME,
      KeyTypes.LEFT,
      KeyTypes.UP,
      KeyTypes.RIGHT,
      KeyTypes.DOWN
    ];
    if (charCodes.indexOf(evt.keyCode) === -1) {
      return;
    }
    evt.preventDefault();
    const parentDomNode = evtTarget.parentNode as SVGElement;
    // @todo Migrate to `evt.code`, see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
    switch (evt.keyCode) {
      case KeyTypes.END:
        // scroll to end, select last node
        this.scrollTop = this.lastElementChild.getBoundingClientRect().height + this.settings.nodeHeight - this.viewportHeight;
        parentDomNode.scrollIntoView({behavior: 'smooth', block: 'end'});
        this.updateVisibleNodes();
        this.switchFocus(parentDomNode.lastElementChild as SVGElement);
        break;
      case KeyTypes.HOME:
        // scroll to top, select first node
        this.scrollTo({'top': this.nodes[0].y, 'behavior': 'smooth'});
        this.prepareDataForVisibleNodes();
        this.updateVisibleNodes();
        this.switchFocus(parentDomNode.firstElementChild as SVGElement);
        break;
      case KeyTypes.LEFT:
        if (currentNode.expanded) {
          // collapse node if collapsible
          if (currentNode.hasChildren) {
            this.hideChildren(currentNode);
            this.prepareDataForVisibleNodes();
            this.updateVisibleNodes();
          }
        } else if (currentNode.parents.length > 0) {
          // go to parent node
          let parentNode = this.nodes[currentNode.parents[0]];
          this.scrollNodeIntoVisibleArea(parentNode, 'up');
          this.switchFocusNode(parentNode);
        }
        break;
      case KeyTypes.UP:
        // select previous visible node on any level
        this.scrollNodeIntoVisibleArea(currentNode, 'up');
        this.switchFocus(evtTarget.previousSibling as SVGElement);
        break;
      case KeyTypes.RIGHT:
        if (currentNode.expanded) {
          // the current node is expanded, goto first child (next element on the list)
          this.scrollNodeIntoVisibleArea(currentNode, 'down');
          this.switchFocus(evtTarget.nextSibling as SVGElement);
        } else {
          if (currentNode.hasChildren) {
            // expand currentNode
            this.showChildren(currentNode);
            this.prepareDataForVisibleNodes();
            this.updateVisibleNodes();
            this.switchFocus(evtTarget as SVGElement);
          }
          //do nothing if node has no children
        }
        break;
      case KeyTypes.DOWN:
        // select next visible node on any level
        // check if node is at end of viewport and scroll down if so
        this.scrollNodeIntoVisibleArea(currentNode, 'down');
        this.switchFocus(evtTarget.nextSibling as SVGElement);
        break;
      case KeyTypes.ENTER:
      case KeyTypes.SPACE:
        this.selectNode(currentNode);
        break;
      default:
    }
  }

  /**
   * If node is at the top of the viewport and direction is up, scroll up by the height of one item
   * If node is at the bottom of the viewport and direction is down, scroll down by the height of one item
   */
  private scrollNodeIntoVisibleArea(node: TreeNode, direction: string = 'up'): void {
    let scrollTop = this.scrollTop;
    if (direction === 'up' && scrollTop > node.y - this.settings.nodeHeight) {
      scrollTop = node.y - this.settings.nodeHeight;
    } else if (direction === 'down' && scrollTop + this.viewportHeight <= node.y + (3 * this.settings.nodeHeight)) {
      scrollTop = scrollTop + this.settings.nodeHeight;
    } else {
      return;
    }
    this.scrollTo({'top': scrollTop, 'behavior': 'smooth'});
    this.updateVisibleNodes();
  }

  /**
   * Renders links(lines) between parent and child nodes and is also used for grouping the children
   * The line element of the first child is used as role=group node to group the children programmatically
   */
  private renderVisibleLinks(): SVGTemplateResult[] {
    const visibleLinks = this.data.links
      .filter((link: SvgTreeDataLink) => {
        return link.source.y <= this.scrollBottom && link.target.y >= this.scrollTop - this.settings.nodeHeight;
      })
      .map((link: SvgTreeDataLink) => {
        link.source.owns = link.source.owns || [];
        link.source.owns.push('identifier-' + link.target.stateIdentifier);
        return link;
      });

    return visibleLinks.map((link) => svg`
      <path class="link"
            id=${ifDefined(this.getGroupIdentifier(link))}
            role=${ifDefined(link.target.siblingsPosition === 1 && link.source.owns.length > 0 ? 'group' : undefined)}
            aria-owns=${ifDefined(link.target.siblingsPosition === 1 && link.source.owns.length > 0 ? link.source.owns.join(' ') : undefined)}
            d=${this.getLinkPath(link)}></path>
    `);
  }

  /**
   * If the link target is the first child, set the group identifier.
   * The group with this id is used for grouping the siblings, thus the identifier uses the stateIdentifier of
   * the link source item.
   */
  private getGroupIdentifier(link: any): string|undefined {
    return link.target.siblingsPosition === 1 ? 'group-identifier-' + link.source.stateIdentifier : undefined;
  }
}
