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
var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};define(["require","exports","jquery","./Viewport","./Icons","jquery/autocomplete","./Input/Clearable"],(function(e,t,o,l,a){"use strict";var r;o=__importDefault(o),function(e){e.containerSelector="#typo3-cms-backend-backend-toolbaritems-livesearchtoolbaritem",e.toolbarItem=".t3js-toolbar-item-search",e.dropdownToggle=".t3js-toolbar-search-dropdowntoggle",e.searchFieldSelector=".t3js-topbar-navigation-search-field",e.formSelector=".t3js-topbar-navigation-search"}(r||(r={}));return new class{constructor(){this.url=TYPO3.settings.ajaxUrls.livesearch,l.Topbar.Toolbar.registerEvent(()=>{let e;this.registerAutocomplete(),this.registerEvents(),o.default(r.toolbarItem).removeAttr("style"),null!==(e=document.querySelector(r.searchFieldSelector))&&e.clearable({onClear:()=>{o.default(r.dropdownToggle).hasClass("show")&&o.default(r.dropdownToggle).dropdown("toggle")}})})}registerAutocomplete(){o.default(r.searchFieldSelector).autocomplete({serviceUrl:this.url,paramName:"q",dataType:"json",minChars:2,width:"100%",groupBy:"typeLabel",noCache:!0,containerClass:r.toolbarItem.substr(1,r.toolbarItem.length),appendTo:r.containerSelector+" .dropdown-menu",forceFixPosition:!1,preserveInput:!0,showNoSuggestionNotice:!0,triggerSelectOnValidInput:!1,preventBadQueries:!1,noSuggestionNotice:'<h3 class="dropdown-headline">'+TYPO3.lang.liveSearch_listEmptyText+"</h3><p>"+TYPO3.lang.liveSearch_helpTitle+"</p><hr><p>"+TYPO3.lang.liveSearch_helpDescription+"<br>"+TYPO3.lang.liveSearch_helpDescriptionPages+"</p>",transformResult:e=>({suggestions:o.default.map(e,e=>({value:e.title,data:e}))}),formatGroup:(e,t,o)=>{let l="";return o>0&&(l="<hr>"),l+'<h3 class="dropdown-headline">'+t+"</h3>"},formatResult:e=>'<div class="dropdown-table"><div class="dropdown-table-row"><div class="dropdown-table-column dropdown-table-icon">'+e.data.iconHTML+'</div><div class="dropdown-table-column dropdown-table-title"><a class="dropdown-table-title-ellipsis dropdown-list-link" href="#" data-pageid="'+e.data.pageId+'" data-target="'+e.data.editLink+'">'+e.data.title+"</a></div></div></div>",onSearchStart:()=>{const e=o.default(r.toolbarItem);e.hasClass("loading")||(e.addClass("loading"),a.getIcon("spinner-circle-light",a.sizes.small,"",a.states.default,a.markupIdentifiers.inline).then(t=>{e.find(".icon-apps-toolbar-menu-search").replaceWith(t)}))},onSearchComplete:()=>{const e=o.default(r.toolbarItem),t=o.default(r.searchFieldSelector);!o.default(r.dropdownToggle).hasClass("show")&&t.val().length>1&&(o.default(r.dropdownToggle).dropdown("toggle"),t.focus()),e.hasClass("loading")&&(e.removeClass("loading"),a.getIcon("apps-toolbar-menu-search",a.sizes.small,"",a.states.default,a.markupIdentifiers.inline).then(t=>{e.find(".icon-spinner-circle-light").replaceWith(t)}))},beforeRender:e=>{e.append('<hr><div><a href="#" class="btn btn-primary pull-right t3js-live-search-show-all">'+TYPO3.lang.liveSearch_showAllResults+"</a></div>"),o.default(r.dropdownToggle).hasClass("show")||(o.default(r.dropdownToggle).dropdown("toggle"),o.default(r.searchFieldSelector).focus())},onHide:()=>{o.default(r.dropdownToggle).hasClass("show")&&o.default(r.dropdownToggle).dropdown("toggle")}})}registerEvents(){const e=o.default(r.searchFieldSelector);if(o.default(r.containerSelector).on("click",".t3js-live-search-show-all",t=>{t.preventDefault(),TYPO3.ModuleMenu.App.showModule("web_list","id=0&search_levels=-1&search_field="+encodeURIComponent(e.val())),e.val("").trigger("change")}),e.length){o.default("."+r.toolbarItem.substr(1,r.toolbarItem.length)).on("click.autocomplete",".dropdown-list-link",t=>{t.preventDefault();const l=o.default(t.currentTarget);top.jump(l.data("target"),"web_list","web",l.data("pageid")),e.val("").trigger("change")})}o.default(r.formSelector).on("submit",e=>{e.preventDefault()})}}}));