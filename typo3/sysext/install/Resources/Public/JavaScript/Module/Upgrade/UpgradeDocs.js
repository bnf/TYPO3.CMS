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
define(["require","jquery","../AbstractInteractableModule","TYPO3/CMS/Backend/Notification","TYPO3/CMS/Core/Ajax/AjaxRequest","../../Router","TYPO3/CMS/Core/Event/DebounceEvent","bootstrap","../../Renderable/Clearable"],(function(e,t,s,a,n,o,l){"use strict";class i extends s.AbstractInteractableModule{constructor(){super(...arguments),this.selectorFulltextSearch=".t3js-upgradeDocs-fulltext-search",this.selectorChosenField=".t3js-upgradeDocs-chosen-select",this.selectorChangeLogsForVersionContainer=".t3js-version-changes",this.selectorChangeLogsForVersion=".t3js-changelog-list",this.selectorUpgradeDoc=".t3js-upgrade-doc"}static trimExplodeAndUnique(e,s){const a=[],n=s.split(e);for(let e=0;e<n.length;e++){const s=n[e].trim();s.length>0&&-1===t.inArray(s,a)&&a.push(s)}return a}initialize(t){this.currentModal=t,window.location!==window.parent.location?top.require(["TYPO3/CMS/Install/chosen.jquery.min"],()=>{this.getContent()}):new Promise((function(t,s){e(["TYPO3/CMS/Install/chosen.jquery.min"],(function(e){t("object"!=typeof e||"default"in e?{default:e}:Object.defineProperty(e,"default",{value:e,enumerable:!1}))}),s)})).then(()=>{this.getContent()}),t.on("click",".t3js-upgradeDocs-markRead",e=>{this.markRead(e.target)}),t.on("click",".t3js-upgradeDocs-unmarkRead",e=>{this.unmarkRead(e.target)}),jQuery.expr[":"].contains=jQuery.expr.createPseudo(e=>t=>jQuery(t).text().toUpperCase().includes(e.toUpperCase()))}getContent(){const e=this.getModalBody();e.on("show.bs.collapse",this.selectorUpgradeDoc,e=>{this.renderTags(t(e.currentTarget))}),new n(o.getUrl("upgradeDocsGetContent")).get({cache:"no-cache"}).then(async t=>{const s=await t.resolve();!0===s.success&&"undefined"!==s.html&&s.html.length>0&&(e.empty().append(s.html),this.initializeFullTextSearch(),this.initializeChosenSelector(),this.loadChangelogs())},t=>{o.handleAjaxError(t,e)})}loadChangelogs(){const e=[],s=this.getModalBody();this.findInModal(this.selectorChangeLogsForVersionContainer).each((l,i)=>{const r=new n(o.getUrl("upgradeDocsGetChangelogForVersion")).withQueryArguments({install:{version:i.dataset.version}}).get({cache:"no-cache"}).then(async e=>{const s=await e.resolve();if(!0===s.success){const e=t(i),a=e.find(this.selectorChangeLogsForVersion);a.html(s.html),this.moveNotRelevantDocuments(a),e.find(".t3js-panel-loading").remove()}else a.error("Something went wrong","The request was not processed successfully. Please check the browser's console and TYPO3's log.")},e=>{o.handleAjaxError(e,s)});e.push(r)}),Promise.all(e).then(()=>{this.fulltextSearchField.prop("disabled",!1),this.appendItemsToChosenSelector()})}initializeFullTextSearch(){this.fulltextSearchField=this.findInModal(this.selectorFulltextSearch);const e=this.fulltextSearchField.get(0);e.clearable({onClear:()=>{this.combinedFilterSearch()}}),e.focus(),this.initializeChosenSelector(),new l("keyup",()=>{this.combinedFilterSearch()}).bindTo(e)}initializeChosenSelector(){this.chosenField=this.getModalBody().find(this.selectorChosenField);const e={".chosen-select":{width:"100%",placeholder_text_multiple:"tags"},".chosen-select-deselect":{allow_single_deselect:!0},".chosen-select-no-single":{disable_search_threshold:10},".chosen-select-no-results":{no_results_text:"Oops, nothing found!"},".chosen-select-width":{width:"100%"}};for(const t in e)e.hasOwnProperty(t)&&this.findInModal(t).chosen(e[t]);this.chosenField.on("change",()=>{this.combinedFilterSearch()})}appendItemsToChosenSelector(){let e="";t(this.findInModal(this.selectorUpgradeDoc)).each((s,a)=>{e+=t(a).data("item-tags")+","});const s=i.trimExplodeAndUnique(",",e).sort((e,t)=>e.toLowerCase().localeCompare(t.toLowerCase()));this.chosenField.prop("disabled",!1),t.each(s,(e,s)=>{this.chosenField.append(t("<option>").text(s))}),this.chosenField.trigger("chosen:updated")}combinedFilterSearch(){const e=this.getModalBody(),s=e.find("div.item");if(this.chosenField.val().length<1&&this.fulltextSearchField.val().length<1)return this.currentModal.find(".panel-version .panel-collapse.in").collapse("hide"),s.removeClass("hidden searchhit filterhit"),!1;if(s.addClass("hidden").removeClass("searchhit filterhit"),this.chosenField.val().length>0){s.addClass("hidden").removeClass("filterhit");const a=[],n=[];t.each(this.chosenField.val(),(e,t)=>{const s='[data-item-tags*="'+t+'"]';t.includes(":",1)?a.push(s):n.push(s)});const o=n.join(""),l=[];if(a.length)for(let e of a)l.push(o+e);else l.push(o);const i=l.join(",");e.find(i).removeClass("hidden").addClass("searchhit filterhit")}else s.addClass("filterhit").removeClass("hidden");const a=this.fulltextSearchField.val();return e.find("div.item.filterhit").each((e,s)=>{const n=t(s);t(":contains("+a+")",n).length>0||t('input[value*="'+a+'"]',n).length>0?n.removeClass("hidden").addClass("searchhit"):n.removeClass("searchhit").addClass("hidden")}),e.find(".searchhit").closest(".panel-collapse").collapse("show"),e.find(".panel-version").each((e,s)=>{const a=t(s);a.find(".searchhit",".filterhit").length<1&&a.find(" > .panel-collapse").collapse("hide")}),!0}renderTags(e){const s=e.find(".t3js-tags");if(0===s.children().length){e.data("item-tags").split(",").forEach(e=>{s.append(t("<span />",{class:"label"}).text(e))})}}moveNotRelevantDocuments(e){e.find('[data-item-state="read"]').appendTo(this.findInModal(".panel-body-read")),e.find('[data-item-state="notAffected"]').appendTo(this.findInModal(".panel-body-not-affected"))}markRead(e){const s=this.getModalBody(),a=this.getModuleContent().data("upgrade-docs-mark-read-token"),l=t(e).closest("a");l.toggleClass("t3js-upgradeDocs-unmarkRead t3js-upgradeDocs-markRead"),l.find("i").toggleClass("fa-check fa-ban"),l.closest(".panel").appendTo(this.findInModal(".panel-body-read")),new n(o.getUrl()).post({install:{ignoreFile:l.data("filepath"),token:a,action:"upgradeDocsMarkRead"}}).catch(e=>{o.handleAjaxError(e,s)})}unmarkRead(e){const s=this.getModalBody(),a=this.getModuleContent().data("upgrade-docs-unmark-read-token"),l=t(e).closest("a"),i=l.closest(".panel").data("item-version");l.toggleClass("t3js-upgradeDocs-markRead t3js-upgradeDocs-unmarkRead"),l.find("i").toggleClass("fa-check fa-ban"),l.closest(".panel").appendTo(this.findInModal('*[data-group-version="'+i+'"] .panel-body')),new n(o.getUrl()).post({install:{ignoreFile:l.data("filepath"),token:a,action:"upgradeDocsUnmarkRead"}}).catch(e=>{o.handleAjaxError(e,s)})}}return new i}));