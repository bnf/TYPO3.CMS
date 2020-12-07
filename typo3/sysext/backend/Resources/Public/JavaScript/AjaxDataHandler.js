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
define(["TYPO3/CMS/Backend/BroadcastMessage","TYPO3/CMS/Core/Ajax/AjaxRequest","./Enum/Severity","jquery","TYPO3/CMS/Backend/BroadcastService","./Icons","./Modal","./Notification","./Viewport"],(function(e,t,a,n,s,i,r,o,d){"use strict";var l;!function(e){e.hide=".t3js-record-hide",e.delete=".t3js-record-delete",e.icon=".t3js-icon"}(l||(l={}));class c{static refreshPageTree(){d.NavigationContainer&&d.NavigationContainer.PageTree&&d.NavigationContainer.PageTree.refreshTree()}static call(e){return new t(TYPO3.settings.ajaxUrls.record_process).withQueryArguments(e).get().then(async e=>await e.resolve())}constructor(){n(()=>{this.initialize()})}process(t,a){return c.call(t).then(t=>{if(t.hasErrors&&this.handleErrors(t),a){const n=Object.assign(Object.assign({},a),{hasErrors:t.hasErrors}),i=new e.BroadcastMessage("datahandler","process",n);s.post(i);const r=new CustomEvent("typo3:datahandler:process",{detail:{payload:n}});document.dispatchEvent(r)}return t})}initialize(){n(document).on("click",l.hide,e=>{e.preventDefault();const t=n(e.currentTarget),a=t.find(l.icon),s=t.closest("tr[data-uid]"),i=t.data("params");this._showSpinnerIcon(a),this.process(i).then(e=>{e.hasErrors?this.handleErrors(e):this.toggleRow(s)})}),n(document).on("click",l.delete,e=>{e.preventDefault();const t=n(e.currentTarget);t.tooltip("hide");r.confirm(t.data("title"),t.data("message"),a.SeverityEnum.warning,[{text:t.data("button-close-text")||TYPO3.lang["button.cancel"]||"Cancel",active:!0,btnClass:"btn-default",name:"cancel"},{text:t.data("button-ok-text")||TYPO3.lang["button.delete"]||"Delete",btnClass:"btn-warning",name:"delete"}]).on("button.clicked",e=>{"cancel"===e.target.getAttribute("name")?r.dismiss():"delete"===e.target.getAttribute("name")&&(r.dismiss(),this.deleteRecord(t))})})}toggleRow(e){const t=e.find(l.hide),a=t.closest("table[data-table]").data("table"),s=t.data("params");let r,o,d;"hidden"===t.data("state")?(o="visible",r=s.replace("=0","=1"),d="actions-edit-hide"):(o="hidden",r=s.replace("=1","=0"),d="actions-edit-unhide"),t.data("state",o).data("params",r),t.tooltip("hide").one("hidden.bs.tooltip",()=>{const e=t.data("toggleTitle");t.data("toggleTitle",t.attr("data-original-title")).attr("data-original-title",e)});const h=t.find(l.icon);i.getIcon(d,i.sizes.small).then(e=>{h.replaceWith(e)});const g=e.find(".col-icon "+l.icon);"hidden"===o?i.getIcon("miscellaneous-placeholder",i.sizes.small,"overlay-hidden").then(e=>{g.append(n(e).find(".icon-overlay"))}):g.find(".icon-overlay").remove(),e.fadeTo("fast",.4,()=>{e.fadeTo("fast",1)}),"pages"===a&&c.refreshPageTree()}deleteRecord(e){const t=e.data("params");let a=e.find(l.icon);this._showSpinnerIcon(a);const n=e.closest("table[data-table]"),s=n.data("table");let r=e.closest("tr[data-uid]");const o=r.data("uid"),d={component:"datahandler",action:"delete",table:s,uid:o};this.process(t,d).then(t=>{if(i.getIcon("actions-edit-delete",i.sizes.small).then(t=>{a=e.find(l.icon),a.replaceWith(t)}),t.hasErrors)this.handleErrors(t);else{const t=e.closest(".panel"),a=t.find(".panel-heading"),i=n.find("[data-l10nparent="+o+"]").closest("tr[data-uid]");if(r=r.add(i),r.fadeTo("slow",.4,()=>{r.slideUp("slow",()=>{r.remove(),0===n.find("tbody tr").length&&t.slideUp("slow")})}),"0"===e.data("l10parent")||""===e.data("l10parent")){const e=Number(a.find(".t3js-table-total-items").html());a.find(".t3js-table-total-items").text(e-1)}"pages"===s&&c.refreshPageTree()}})}handleErrors(e){n.each(e.messages,(e,t)=>{o.error(t.title,t.message)})}_showSpinnerIcon(e){i.getIcon("spinner-circle-dark",i.sizes.small).then(t=>{e.replaceWith(t)})}}return new c}));