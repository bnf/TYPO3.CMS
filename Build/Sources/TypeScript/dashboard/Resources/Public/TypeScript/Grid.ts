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

import * as $ from 'jquery';
let Muuri: any = require('muuri');
import {AjaxResponse} from 'TYPO3/CMS/Core/Ajax/AjaxResponse';
import AjaxRequest = require('TYPO3/CMS/Core/Ajax/AjaxRequest');

class Grid {
  private selector: string = '.dashboard-grid';

  constructor() {
    $((): void => {
      this.initialize();
    });
  }

  public initialize(): void {
    const options = {
      dragEnabled: true,
      dragSortHeuristics: {
        sortInterval: 50,
        minDragDistance: 10,
        minBounceBackAngle: 1
      },
      layoutDuration: 400,
      layoutEasing: 'ease',
      dragPlaceholder: {
        enabled: true,
        duration: 400,
        createElement: (item: any): void => {
          return item.getElement().cloneNode(true);
        }
      },
      dragSortPredicate: {
        action:'move',
        threshold: 30
      },
      dragStartPredicate: {
        handle: '.widget-move'
      },
      dragReleaseDuration: 400,
      dragReleaseEasing: 'ease',
      layout: {
        fillGaps: false,
        rounding: false,
      }
    };

    if ($(this.selector).length) {
      const dashboard = new Muuri(this.selector, options);
      dashboard.on('dragStart', (): void => {
        $('.dashboard-item').removeClass('dashboard-item--enableSelect');
      })
      dashboard.on('dragReleaseEnd', (): void => {
        $('.dashboard-item').addClass('dashboard-item--enableSelect');
        this.saveItems(dashboard);
      })

      $('.dashboard-item').on('widgetContentRendered', (): void => {
        dashboard.refreshItems().layout();
      });
    }
  }

  public saveItems(dashboard: any): void {
    let widgets = dashboard.getItems().map(function (item: any) {
      return [
        item.getElement().getAttribute('data-widget-key'),
        item.getElement().getAttribute('data-widget-config'),
        item.getElement().getAttribute('data-widget-hash')
      ];
    });

    (new AjaxRequest(TYPO3.settings.ajaxUrls['ext-dashboard-save-widget-positions'])).post({
      widgets: widgets
    }).then(async (response: AjaxResponse): Promise<any> => {
      await response.resolve();
    });
  }
}

export = new Grid();
