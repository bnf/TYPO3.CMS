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

import * as d3selection from 'd3-selection';
import AjaxRequest from 'TYPO3/CMS/Core/Ajax/AjaxRequest';
import {SvgTree, TreeNodeSelection} from '../SvgTree';
import {TreeNode} from '../Tree/TreeNode';
import {PageTreeDragDrop, PageTreeNodeDragHandler} from './PageTreeDragDrop';
import {AjaxResponse} from 'TYPO3/CMS/Core/Ajax/AjaxResponse';
import {KeyTypesEnum as KeyTypes} from '../Enum/KeyTypes';
import {html, svg, customElement, TemplateResult, SVGTemplateResult} from 'lit-element';

/**
 * A Tree based on SVG for pages, which has a AJAX-based loading of the tree
 * and also handles search + filter via AJAX.
 */
@customElement('typo3-backend-page-tree')
export class PageTree extends SvgTree
{
  public nodeIsEdit: boolean;
  public dragDrop: PageTreeDragDrop;
  protected networkErrorTitle: string = TYPO3.lang.pagetree_networkErrorTitle;
  protected networkErrorMessage: string = TYPO3.lang.pagetree_networkErrorDesc;

  public constructor() {
    super();
    this.settings.defaultProperties = {
      hasChildren: false,
      nameSourceField: 'title',
      itemType: 'pages',
      prefix: '',
      suffix: '',
      locked: false,
      loaded: false,
      overlayIcon: '',
      selectable: true,
      expanded: false,
      checked: false,
      backgroundColor: '',
      stopPageTree: false,
      class: '',
      readableRootline: '',
      isMountPoint: false,
    };
  }

  public sendChangeCommand(data: any): void {
    let params = '';
    let targetUid = 0;

    if (data.target) {
      targetUid = data.target.identifier;
      if (data.position === 'after') {
        targetUid = -targetUid;
      }
    }

    if (data.command === 'new') {
      params = '&data[pages][NEW_1][pid]=' + targetUid +
        '&data[pages][NEW_1][title]=' + encodeURIComponent(data.name) +
        '&data[pages][NEW_1][doktype]=' + data.type;

    } else if (data.command === 'edit') {
      params = '&data[pages][' + data.uid + '][' + data.nameSourceField + ']=' + encodeURIComponent(data.title);
    } else {
      if (data.command === 'delete') {
        if (data.uid === window.fsMod.recentIds.web) {
          this.selectNode(this.nodes[0]);
        }
        params = '&cmd[pages][' + data.uid + '][delete]=1';
      } else {
        params = 'cmd[pages][' + data.uid + '][' + data.command + ']=' + targetUid;
      }
    }

    this.nodesAddPlaceholder();

    (new AjaxRequest(top.TYPO3.settings.ajaxUrls.record_process))
      .post(params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest'},
      })
      .then((response) => {
        return response.resolve();
      })
      .then((response) => {
        if (response && response.hasErrors) {
          this.errorNotification(response.messages, false);
          this.nodesContainer.selectAll('.node').remove();
          this.updateVisibleNodes();
          this.nodesRemovePlaceholder();
        } else {
          this.refreshOrFilterTree();
        }
      })
      .catch((error) => {
        this.errorNotification(error);
      });
  }

  public showChildren(node: TreeNode) {
    this.loadChildrenOfNode(node);
    super.showChildren(node);
  }

  public updateNodeBgClass(nodeBg: TreeNodeSelection) {
    return super.updateNodeBgClass.call(this, nodeBg).call(this.initializeDragForNode());
  }

  public nodesUpdate(nodes: TreeNodeSelection) {
    nodes = super.nodesUpdate.call(this, nodes).call(this.initializeDragForNode());
    /*
    nodes
      .append('text')
      .text('+')
      .attr('class', 'node-stop')
      .attr('dx', 30)
      .attr('dy', 5)
      .attr('visibility', (node: TreeNode) => node.stopPageTree && node.depth !== 0 ? 'visible' : 'hidden')
      .on('click', (evt: MouseEvent, node: TreeNode) => {
        document.dispatchEvent(new CustomEvent('typo3:pagetree:mountPoint', {detail: {pageId: parseInt(node.identifier, 10)}}));
      });
     */

    return nodes;
  }

  protected renderNode(node: TreeNode): SVGTemplateResult {
    const showNodeStop = node.stopPageTree && node.depth !== 0
    const onNodeStopClick = (evt: MouseEvent) => document.dispatchEvent(
      new CustomEvent('typo3:pagetree:mountPoint', {detail: {pageId: parseInt(node.identifier, 10)}})
    );

    return svg`
      ${super.renderNode(node)}
      ${showNodeStop ? svg`<text class="node-stop" dx="30" dy="5" @click=${onNodeStopClick}>+</text>` : ''}
    `
  }

  /**
   * Make the DOM element of the node given as parameter focusable and focus it
   */
  public switchFocusNode(node: TreeNode) {
    // Focus node only if it's not currently in edit mode
    if (!this.nodeIsEdit) {
      this.switchFocus(this.getNodeElement(node));
    }
  }

  /**
   * Initializes a drag&drop when called on the page tree. Should be moved somewhere else at some point
   */
  public initializeDragForNode() {
    return this.dragDrop.connectDragHandler(new PageTreeNodeDragHandler(this, this.dragDrop))
  }

  public removeEditedText() {
    const inputWrapper = d3selection.selectAll('.node-edit');
    if (inputWrapper.size()) {
      try {
        inputWrapper.remove();
        this.nodeIsEdit = false;
      } catch (e) {
        // ...
      }
    }
  }

  /**
   * Loads child nodes via Ajax (used when expanding a collapsed node)
   *
   * @param parentNode
   * @return {boolean}
   */
  protected loadChildrenOfNode(parentNode: TreeNode) {
    if (parentNode.loaded) {
      return;
    }

    this.nodesAddPlaceholder();
    (new AjaxRequest(this.settings.dataUrl + '&pid=' + parentNode.identifier + '&mount=' + parentNode.mountPoint + '&pidDepth=' + parentNode.depth))
      .get({cache: 'no-cache'})
      .then((response: AjaxResponse) => response.resolve())
      .then((json: any) => {
        let nodes = Array.isArray(json) ? json : [];
        // first element is a parent
        nodes.shift();
        const index = this.nodes.indexOf(parentNode) + 1;
        // adding fetched node after parent
        nodes.forEach((node: TreeNode, offset: number) => {
          this.nodes.splice(index + offset, 0, node);
        });

        parentNode.loaded = true;
        this.setParametersNode();
        this.prepareDataForVisibleNodes();
        this.updateVisibleNodes();
        this.nodesRemovePlaceholder();

        this.switchFocusNode(parentNode);
      })
      .catch((error: any) => {
        this.errorNotification(error, false)
        this.nodesRemovePlaceholder();
        throw error;
      });
  }

  protected getTextElementPosition(node: TreeNode): number {
    let position = super.getTextElementPosition(node);
    if (node.stopPageTree && node.depth !== 0) {
      position += 15;
    }
    /*
    if (node.locked) {
      position += 15;
    }
   */
    return position;
  }

  /**
   * Event handler for double click on a node's label
   * Changed text position if there is 'stop page tree' option
   */
  protected appendTextElement(nodes: TreeNodeSelection): TreeNodeSelection {
    let clicks = 0;
    return super.appendTextElement(nodes)
      .attr('dx', (node) => {
        let position = this.textPosition;
        if (node.stopPageTree && node.depth !== 0) {
          position += 15;
        }
        if (node.locked) {
          position += 15;
        }
        return position;
      })
      .on('click', (event, node: TreeNode) => {
        if (node.identifier === '0') {
          this.selectNode(node);
          return;
        }
        if (++clicks === 1) {
          setTimeout(() => {
            if (clicks === 1) {
              this.selectNode(node);
            } else {
              this.editNodeLabel(node);
            }
            clicks = 0;
          }, 300);
        }
      });
  };

  private sendEditNodeLabelCommand(node: TreeNode) {
    const params = '&data[pages][' + node.identifier + '][' + node.nameSourceField + ']=' + encodeURIComponent(node.newName);

    // remove old node from svg tree
    this.nodesAddPlaceholder(node);

    (new AjaxRequest(top.TYPO3.settings.ajaxUrls.record_process))
      .post(params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest'},
      })
      .then((response) => {
        return response.resolve();
      })
      .then((response) => {
        if (response && response.hasErrors) {
          this.errorNotification(response.messages, false);
        } else {
          node.name = node.newName;
        }
        this.refreshOrFilterTree();
      })
      .catch((error) => {
        this.errorNotification(error, true);
      });
  }

  private editNodeLabel(node: TreeNode) {
    if (!node.allowEdit) {
      return;
    }
    this.removeEditedText();
    this.nodeIsEdit = true;

    d3selection.select(this.svg.node().parentNode as HTMLElement)
      .append('input')
      .attr('class', 'node-edit')
      .style('top', () => {
        const top = node.y + this.settings.marginTop;
        return top + 'px';
      })
      .style('left', (node.x + this.textPosition + 5) + 'px')
      .style('width', this.settings.width - (node.x + this.textPosition + 20) + 'px')
      .style('height', this.settings.nodeHeight + 'px')
      .attr('type', 'text')
      .attr('value', node.name)
      .on('keydown', (event: KeyboardEvent) => {
        // @todo Migrate to `evt.code`, see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
        const code = event.keyCode;

        if (code === KeyTypes.ENTER || code === KeyTypes.TAB) {
          const target = event.target as HTMLInputElement;
          const newName = target.value.trim();
          this.nodeIsEdit = false;
          this.removeEditedText();
          if (newName.length && (newName !== node.name)) {
            node.nameSourceField = node.nameSourceField || 'title';
            node.newName = newName;
            this.sendEditNodeLabelCommand(node);
          }
        } else if (code === KeyTypes.ESCAPE) {
          this.nodeIsEdit = false;
          this.removeEditedText();
        }
      })
      .on('blur', (evt: FocusEvent) => {
        if (!this.nodeIsEdit) {
          return;
        }
        const target = evt.target as HTMLInputElement;
        const newName = target.value.trim();
        if (newName.length && (newName !== node.name)) {
          node.nameSourceField = node.nameSourceField || 'title';
          node.newName = newName;
          this.sendEditNodeLabelCommand(node);
        }
        this.removeEditedText();
      })
      .node()
      .select();
  }
}
