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
define(["require","jquery","TYPO3/CMS/Core/Ajax/AjaxRequest","TYPO3/CMS/Backend/Icons","TYPO3/CMS/Backend/Modal","./Renderable/InfoBox","./Renderable/ProgressBar","./Renderable/Severity"],(function(e,t,n,o,a,l,i,s){"use strict";return new class{constructor(){this.selectorBody=".t3js-body",this.selectorMainContent=".t3js-module-body"}initialize(){this.registerInstallToolRoutes(),t(document).on("click",".t3js-login-lockInstallTool",e=>{e.preventDefault(),this.logout()}),t(document).on("click",".t3js-login-login",e=>{e.preventDefault(),this.login()}),t(document).on("keydown","#t3-install-form-password",e=>{"Enter"===e.key&&(e.preventDefault(),t(".t3js-login-login").trigger("click"))}),t(document).on("click",".t3js-modulemenu-action",e=>{e.preventDefault();const n=t(e.currentTarget);window.location.href=n.data("link")}),t(document).on("click",".card .btn",n=>{n.preventDefault();const l=t(n.currentTarget),i=l.data("require"),s=l.data("inline");if(void 0!==s&&1===parseInt(s,10))new Promise((function(t,n){e([i],(function(e){t("object"==typeof e?Object.defineProperty(e,"default",{value:e,enumerable:!1}):{default:e})}),n)})).then(({default:e})=>{e.initialize(l)});else{const n=l.closest(".card").find(".card-title").html(),s=l.data("modalSize")||a.sizes.large,c=a.advanced({type:a.types.default,title:n,size:s,content:t('<div class="modal-loading">'),additionalCssClasses:["install-tool-modal"],callback:t=>{new Promise((function(t,n){e([i],(function(e){t("object"==typeof e?Object.defineProperty(e,"default",{value:e,enumerable:!1}):{default:e})}),n)})).then(({default:e})=>{e.initialize(t)})}});o.getIcon("spinner-circle",o.sizes.default,null,null,o.markupIdentifiers.inline).then(e=>{c.find(".modal-loading").append(e)})}}),"backend"===t(this.selectorBody).data("context")?this.executeSilentConfigurationUpdate():this.preAccessCheck()}registerInstallToolRoutes(){void 0===TYPO3.settings&&(TYPO3.settings={ajaxUrls:{icons:window.location.origin+window.location.pathname+"?install[controller]=icon&install[action]=getIcon",icons_cache:window.location.origin+window.location.pathname+"?install[controller]=icon&install[action]=getCacheIdentifier"}})}getUrl(e,n){const o=t(this.selectorBody).data("context");let a=location.href;return a=a.replace(location.search,""),void 0===n&&(n=t(this.selectorBody).data("controller")),a=a+"?install[controller]="+n,void 0!==o&&""!==o&&(a=a+"&install[context]="+o),void 0!==e&&(a=a+"&install[action]="+e),a}executeSilentConfigurationUpdate(){this.updateLoadingInfo("Checking session and executing silent configuration update"),new n(this.getUrl("executeSilentConfigurationUpdate","layout")).get({cache:"no-cache"}).then(async e=>{!0===(await e.resolve()).success?this.executeSilentExtensionConfigurationSynchronization():this.executeSilentConfigurationUpdate()},e=>{this.handleAjaxError(e)})}executeSilentExtensionConfigurationSynchronization(){const e=t(this.selectorBody);this.updateLoadingInfo("Executing silent extension configuration synchronization"),new n(this.getUrl("executeSilentExtensionConfigurationSynchronization","layout")).get({cache:"no-cache"}).then(async t=>{if(!0===(await t.resolve()).success)this.loadMainLayout();else{const t=l.render(s.error,"Something went wrong","");e.empty().append(t)}},e=>{this.handleAjaxError(e)})}loadMainLayout(){const e=t(this.selectorBody);this.updateLoadingInfo("Loading main layout"),new n(this.getUrl("mainLayout","layout")).get({cache:"no-cache"}).then(async n=>{const o=await n.resolve();if(!0===o.success&&"undefined"!==o.html&&o.html.length>0){if(e.empty().append(o.html),"backend"!==t(this.selectorBody).data("context")){const t=e.data("controller");e.find('.t3js-modulemenu-action[data-controller="'+t+'"]').addClass("modulemenu-action-active")}this.loadCards()}else{const t=l.render(s.error,"Something went wrong","");e.empty().append(t)}},e=>{this.handleAjaxError(e)})}async handleAjaxError(e,n){let o;if(403===e.response.status){"backend"===t(this.selectorBody).data("context")?(o=l.render(s.error,"The install tool session expired. Please reload the backend and try again."),t(this.selectorBody).empty().append(o)):this.checkEnableInstallToolFile()}else{const a=this.getUrl(void 0,"upgrade");o=t('<div class="t3js-infobox callout callout-sm callout-danger"><div class="callout-body"><p>Something went wrong. Please use <b><a href="'+a+'">Check for broken extensions</a></b> to see if a loaded extension breaks this part of the install tool and unload it.</p><p>The box below may additionally reveal further details on what went wrong depending on your debug settings. It may help to temporarily switch to debug mode using <b>Settings > Configuration Presets > Debug settings.</b></p><p>If this error happens at an early state and no full exception back trace is shown, it may also help to manually increase debugging output in <code>typo3conf/LocalConfiguration.php</code>:<code>[\'BE\'][\'debug\'] => true</code>, <code>[\'SYS\'][\'devIPmask\'] => \'*\'</code>, <code>[\'SYS\'][\'displayErrors\'] => 1</code>,<code>[\'SYS\'][\'systemLogLevel\'] => 0</code>, <code>[\'SYS\'][\'exceptionalErrors\'] => 12290</code></p></div></div><div class="panel-group" role="tablist" aria-multiselectable="true"><div class="panel panel-default panel-flat searchhit"><div class="panel-heading" role="tab" id="heading-error"><h3 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapse-error" aria-expanded="true" aria-controls="collapse-error" class="collapsed"><span class="caret"></span><strong>Ajax error</strong></a></h3></div><div id="collapse-error" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading-error"><div class="panel-body">'+await e.response.text()+"</div></div></div></div>"),void 0!==n?t(n).empty().html(o):t(this.selectorBody).empty().html(o)}}checkEnableInstallToolFile(){new n(this.getUrl("checkEnableInstallToolFile")).get({cache:"no-cache"}).then(async e=>{!0===(await e.resolve()).success?this.checkLogin():this.showEnableInstallTool()},e=>{this.handleAjaxError(e)})}showEnableInstallTool(){new n(this.getUrl("showEnableInstallToolFile")).get({cache:"no-cache"}).then(async e=>{const n=await e.resolve();!0===n.success&&t(this.selectorBody).empty().append(n.html)},e=>{this.handleAjaxError(e)})}checkLogin(){new n(this.getUrl("checkLogin")).get({cache:"no-cache"}).then(async e=>{!0===(await e.resolve()).success?this.loadMainLayout():this.showLogin()},e=>{this.handleAjaxError(e)})}showLogin(){new n(this.getUrl("showLogin")).get({cache:"no-cache"}).then(async e=>{const n=await e.resolve();!0===n.success&&t(this.selectorBody).empty().append(n.html)},e=>{this.handleAjaxError(e)})}login(){const e=t(".t3js-login-output"),o=i.render(s.loading,"Loading...","");e.empty().html(o),new n(this.getUrl()).post({install:{action:"login",token:t("[data-login-token]").data("login-token"),password:t(".t3-install-form-input-text").val()}}).then(async t=>{const n=await t.resolve();!0===n.success?this.executeSilentConfigurationUpdate():n.status.forEach(t=>{const n=l.render(t.severity,t.title,t.message);e.empty().html(n)})},e=>{this.handleAjaxError(e)})}logout(){new n(this.getUrl("logout")).get({cache:"no-cache"}).then(async e=>{!0===(await e.resolve()).success&&this.showEnableInstallTool()},e=>{this.handleAjaxError(e)})}loadCards(){const e=t(this.selectorMainContent);new n(this.getUrl("cards")).get({cache:"no-cache"}).then(async t=>{const n=await t.resolve();if(!0===n.success&&"undefined"!==n.html&&n.html.length>0)e.empty().append(n.html);else{const t=l.render(s.error,"Something went wrong","");e.empty().append(t)}},e=>{this.handleAjaxError(e)})}updateLoadingInfo(e){t(this.selectorBody).find("#t3js-ui-block-detail").text(e)}preAccessCheck(){this.updateLoadingInfo("Execute pre access check"),new n(this.getUrl("preAccessCheck","layout")).get({cache:"no-cache"}).then(async e=>{const t=await e.resolve();t.installToolLocked?this.checkEnableInstallToolFile():t.isAuthorized?this.executeSilentConfigurationUpdate():this.showLogin()},e=>{this.handleAjaxError(e)})}}}));