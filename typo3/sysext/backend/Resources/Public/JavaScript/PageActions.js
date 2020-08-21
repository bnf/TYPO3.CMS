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
define(["require","./Enum/KeyTypes","jquery","./Storage/Persistent","./Wizard/NewContentElement"],(function(e,t,i,n,a){"use strict";var s;!function(e){e.pageTitle=".t3js-title-inlineedit",e.hiddenElements=".t3js-hidden-record",e.newButton=".t3js-toggle-new-content-element-wizard"}(s||(s={}));return new class{constructor(){this.pageId=0,this.pageOverlayId=0,this.$pageTitle=null,this.$showHiddenElementsCheckbox=null,i(()=>{this.initializeElements(),this.initializeEvents(),this.initializeNewContentElementWizard(),this.initializePageTitleRenaming()})}setPageId(e){this.pageId=e}setLanguageOverlayId(e){this.pageOverlayId=e}initializePageTitleRenaming(){if(!i.isReady)return void i(()=>{this.initializePageTitleRenaming()});if(this.pageId<=0)return;const e=i('<a class="hidden" href="#" data-action="edit"><span class="t3-icon fa fa-pencil"></span></a>');e.on("click",e=>{e.preventDefault(),this.editPageTitle()}),this.$pageTitle.on("dblclick",()=>{this.editPageTitle()}).on("mouseover",()=>{e.removeClass("hidden")}).on("mouseout",()=>{e.addClass("hidden")}).append(e)}initializeElements(){this.$pageTitle=i(s.pageTitle+":first"),this.$showHiddenElementsCheckbox=i("#checkTt_content_showHidden")}initializeEvents(){this.$showHiddenElementsCheckbox.on("change",this.toggleContentElementVisibility)}toggleContentElementVisibility(e){const t=i(e.currentTarget),a=i(s.hiddenElements),l=i("<span />",{class:"checkbox-spinner fa fa-circle-o-notch fa-spin"});t.hide().after(l),t.prop("checked")?a.slideDown():a.slideUp(),n.set("moduleData.web_layout.tt_content_showHidden",t.prop("checked")?"1":"0").done(()=>{l.remove(),t.show()})}editPageTitle(){const e=i('<form><div class="form-group"><div class="input-group input-group-lg"><input class="form-control t3js-title-edit-input"><span class="input-group-btn"><button class="btn btn-default" type="button" data-action="submit"><span class="t3-icon fa fa-floppy-o"></span></button> </span><span class="input-group-btn"><button class="btn btn-default" type="button" data-action="cancel"><span class="t3-icon fa fa-times"></span></button> </span></div></div></form>'),n=e.find("input");e.find('[data-action="cancel"]').on("click",()=>{e.replaceWith(this.$pageTitle),this.initializePageTitleRenaming()}),e.find('[data-action="submit"]').on("click",()=>{const t=n.val().trim();""!==t&&this.$pageTitle.text()!==t?this.saveChanges(n):e.find('[data-action="cancel"]').trigger("click")}),n.parents("form").on("submit",e=>(e.preventDefault(),!1));const a=this.$pageTitle;a.children().last().remove(),a.replaceWith(e),n.val(a.text()).focus(),n.on("keyup",i=>{switch(i.which){case t.KeyTypesEnum.ENTER:e.find('[data-action="submit"]').trigger("click");break;case t.KeyTypesEnum.ESCAPE:e.find('[data-action="cancel"]').trigger("click")}})}saveChanges(t){const i=t.parents("form");i.find("button").addClass("disabled"),t.attr("disabled","disabled");let n,a={};n=this.pageOverlayId>0?this.pageOverlayId:this.pageId,a.data={},a.data.pages={},a.data.pages[n]={title:t.val()},e(["TYPO3/CMS/Backend/AjaxDataHandler"],e=>{e.process(a).then(()=>{i.find("[data-action=cancel]").trigger("click"),this.$pageTitle.text(t.val()),this.initializePageTitleRenaming(),top.TYPO3.Backend.NavigationContainer.PageTree.refreshTree()}).catch(()=>{i.find("[data-action=cancel]").trigger("click")})})}initializeNewContentElementWizard(){Array.from(document.querySelectorAll(s.newButton)).forEach(e=>{e.classList.remove("disabled")}),i(s.newButton).on("click",e=>{e.preventDefault();const t=i(e.currentTarget);a.wizard(t.attr("href"),t.data("title"))})}}}));