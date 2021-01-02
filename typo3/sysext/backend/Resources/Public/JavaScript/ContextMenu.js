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
var __importDefault=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};define(["require","exports","jquery","TYPO3/CMS/Core/Ajax/AjaxRequest","TYPO3/CMS/Core/Event/RegularEvent","./ContextMenuActions","TYPO3/CMS/Core/Event/ThrottleEvent","lit-html","lit-html/directives/unsafe-html","lit-html/directives/class-map","TYPO3/CMS/Core/lit-helper"],(function(t,e,s,i,n,o,l,a,u,r,c){"use strict";s=__importDefault(s);class d{constructor(){this.mousePos={X:null,Y:null},this.delayContextMenuHide=!1,this.record={uid:null,table:null},this.eventSources=[],this.storeMousePositionEvent=t=>{this.mousePos={X:t.pageX,Y:t.pageY},this.mouseOutFromMenu("#contentMenu0"),this.mouseOutFromMenu("#contentMenu1")},this.initializeEvents()}static drawActionItem(t){const e=t.additionalAttributes||{};return a.html`
      <li
        role="menuitem"
        class="list-group-item"
        tabindex="-1"
        data-callback-action="${t.callbackAction}"
        @click="${t=>console.log(t)}"
        ...="${c.spread(e)}"
      >
        <span class="list-group-item-icon">${u.unsafeHTML(t.icon)}</span> ${t.label}
      </li>
    `}static within(t,e,s){const i=t.offset();return s>=i.top&&s<i.top+t.height()&&e>=i.left&&e<i.left+t.width()}static initializeContextMenuContainer(){if(null===document.getElementById("contentMenu0")){const t='<div id="contentMenu0" class="context-menu"></div><div id="contentMenu1" class="context-menu" style="display: block;"></div>';s.default("body").append(t)}}initializeEvents(){new n("click",(t,e)=>{e.onclick||(t.preventDefault(),this.show(e.dataset.table,parseInt(e.dataset.uid,10)||0,e.dataset.context,e.dataset.iteminfo,e.dataset.parameters,t.target))}).delegateTo(document,".t3js-contextmenutrigger"),new l("mousemove",this.storeMousePositionEvent.bind(this),50).bindTo(document)}show(t,e,s,i,n,o=null){this.record={table:t,uid:e};const l=o.matches("a, button, [tabindex]")?o:o.closest("a, button, [tabindex]");this.eventSources.push(l);let a="";void 0!==t&&(a+="table="+encodeURIComponent(t)),void 0!==e&&(a+=(a.length>0?"&":"")+"uid="+e),void 0!==s&&(a+=(a.length>0?"&":"")+"context="+s),void 0!==i&&(a+=(a.length>0?"&":"")+"enDisItems="+i),void 0!==n&&(a+=(a.length>0?"&":"")+"addParams="+n),this.fetch(a)}fetch(t){const e=TYPO3.settings.ajaxUrls.contextmenu;new i(e).withQueryArguments(t).get().then(async t=>{const e=await t.resolve();void 0!==t&&Object.keys(t).length>0&&this.populateData(e,0)})}populateData(e,i){d.initializeContextMenuContainer();const n=s.default("#contentMenu"+i);if(n.length&&(0===i||s.default("#contentMenu"+(i-1)).is(":visible"))){const l=this.drawMenu(e,i);a.render(a.html`<ul class="list-group">${l}</ul>`,n[0]),s.default("li.list-group-item",n).on("click",e=>{e.preventDefault();const n=s.default(e.currentTarget);if(n.hasClass("list-group-item-submenu"))return void this.openSubmenu(i,n);const l=n.data("callback-action"),a=n.data("callback-module");n.data("callback-module")?t([a],t=>{t[l].bind(n)(this.record.table,this.record.uid)}):o&&"function"==typeof o[l]?o[l].bind(n)(this.record.table,this.record.uid):console.log("action: "+l+" not found"),this.hideAll()}),s.default("li.list-group-item",n).on("keydown",t=>{const e=s.default(t.currentTarget);switch(t.key){case"Down":case"ArrowDown":this.setFocusToNextItem(e.get(0));break;case"Up":case"ArrowUp":this.setFocusToPreviousItem(e.get(0));break;case"Right":case"ArrowRight":if(!e.hasClass("list-group-item-submenu"))return;this.openSubmenu(i,e);break;case"Home":this.setFocusToFirstItem(e.get(0));break;case"End":this.setFocusToLastItem(e.get(0));break;case"Enter":case"Space":e.click();break;case"Esc":case"Escape":case"Left":case"ArrowLeft":this.hide("#"+e.parents(".context-menu").first().attr("id"));break;case"Tab":this.hideAll();break;default:return}t.preventDefault()}),n.css(this.getPosition(n)).show(),s.default("li.list-group-item[tabindex=-1]",n).first().focus()}}setFocusToPreviousItem(t){let e=this.getItemBackward(t.previousElementSibling);e||(e=this.getLastItem(t)),e.focus()}setFocusToNextItem(t){let e=this.getItemForward(t.nextElementSibling);e||(e=this.getFirstItem(t)),e.focus()}setFocusToFirstItem(t){let e=this.getFirstItem(t);e&&e.focus()}setFocusToLastItem(t){let e=this.getLastItem(t);e&&e.focus()}getItemBackward(t){for(;t&&(!t.classList.contains("list-group-item")||"-1"!==t.getAttribute("tabindex"));)t=t.previousElementSibling;return t}getItemForward(t){for(;t&&(!t.classList.contains("list-group-item")||"-1"!==t.getAttribute("tabindex"));)t=t.nextElementSibling;return t}getFirstItem(t){return this.getItemForward(t.parentElement.firstElementChild)}getLastItem(t){return this.getItemBackward(t.parentElement.lastElementChild)}openSubmenu(t,e){this.eventSources.push(e[0]);const i=s.default("#contentMenu"+(t+1)).html("");e.next().find(".list-group").clone(!0).appendTo(i),i.css(this.getPosition(i)).show(),s.default(".list-group-item[tabindex=-1]",i).first().focus()}getPosition(t){let e=0,i=0,n=this.eventSources[this.eventSources.length-1];if(n){const t=n.getBoundingClientRect();e=t.right,i=t.top}else e=this.mousePos.X,i=this.mousePos.Y;const o=s.default(window).width()-20,l=s.default(window).height(),a=t.width(),u=t.height(),r=e-s.default(document).scrollLeft(),c=i-s.default(document).scrollTop();return l-u<c&&(c>u?i-=u-10:i+=l-u-c),o-a<r&&(r>a?e-=a-10:o-a-r<s.default(document).scrollLeft()?e=s.default(document).scrollLeft():e+=o-a-r),{left:e+"px",top:i+"px"}}drawMenu(t,e){return a.html`
      ${Object.values(t).map(t=>{if("item"===t.type)return d.drawActionItem(t);if("divider"===t.type)return a.html`
          <li role="separator" class="list-group-item list-group-item-divider"></li>
        `;if("submenu"===t.type||t.childItems){const s=this.drawMenu(t.childItems,1);let i={"context-menu":!0};return i["contentMenu"+(e+1)]=!0,a.html`
          <li role="menuitem" aria-haspopup="true" class="list-group-item list-group-item-submenu" tabindex="-1">
            <span class="list-group-item-icon">${u.unsafeHTML(t.icon)}</span> ${t.label}&nbsp;&nbsp;<span class="fa fa-caret-right"></span>
          </li>
          <div class="${r.classMap(i)}" style="display:none;">
            <ul role="menu" class="list-group">${s}</ul>
          </div>
        `}return a.html``})}
    `}mouseOutFromMenu(t){const e=s.default(t);e.length>0&&e.is(":visible")&&!d.within(e,this.mousePos.X,this.mousePos.Y)?this.hide(t):e.length>0&&e.is(":visible")&&(this.delayContextMenuHide=!0)}hide(t){this.delayContextMenuHide=!1,window.setTimeout(()=>{if(!this.delayContextMenuHide){s.default(t).hide();const e=this.eventSources.pop();e&&s.default(e).focus()}},500)}hideAll(){this.hide("#contentMenu0"),this.hide("#contentMenu1")}}return new d}));