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
define(["require","jquery","TYPO3/CMS/Backend/Modal","TYPO3/CMS/Backend/Notification","TYPO3/CMS/Backend/Severity","TYPO3/CMS/Backend/Storage/Client","TYPO3/CMS/Core/Ajax/AjaxRequest"],(function(e,t,o,i,n,s,a){"use strict";var l;!function(e){e.loginrefresh="t3js-modal-loginrefresh",e.lockedModal="t3js-modal-backendlocked",e.loginFormModal="t3js-modal-backendloginform"}(l||(l={}));class d{constructor(){this.options={modalConfig:{backdrop:"static"}},this.webNotification=null,this.intervalTime=60,this.intervalId=null,this.backendIsLocked=!1,this.isTimingOut=!1,this.$timeoutModal=null,this.$backendLockedModal=null,this.$loginForm=null,this.loginFramesetUrl="",this.logoutUrl="",this.submitForm=e=>{e.preventDefault();const o=this.$loginForm.find("form"),n=o.find("input[name=p_field]"),s=o.find("input[name=userident]"),l=n.val();if(""===l&&""===s.val())return i.error(TYPO3.lang["mess.refresh_login_failed"],TYPO3.lang["mess.refresh_login_emptyPassword"]),void n.focus();l&&(s.val(l),n.val(""));const d={login_status:"login"};t.each(o.serializeArray(),(function(e,t){d[t.name]=t.value})),new a(o.attr("action")).post(d).then(async e=>{(await e.resolve()).login.success?this.hideLoginForm():(i.error(TYPO3.lang["mess.refresh_login_failed"],TYPO3.lang["mess.refresh_login_failed_message"]),n.focus())})},this.checkActiveSession=()=>{new a(TYPO3.settings.ajaxUrls.login_timedout).get().then(async e=>{const t=await e.resolve();t.login.locked?this.backendIsLocked||(this.backendIsLocked=!0,this.showBackendLockedModal()):this.backendIsLocked&&(this.backendIsLocked=!1,this.hideBackendLockedModal()),this.backendIsLocked||(t.login.timed_out||t.login.will_time_out)&&(t.login.timed_out?this.showLoginForm():this.showTimeoutModal())})}}initialize(){this.initializeTimeoutModal(),this.initializeBackendLockedModal(),this.initializeLoginForm(),this.startTask();const e=!(s.isset("notifications.asked")&&"yes"===s.get("notifications.asked")),t="undefined"!=typeof Notification&&"default"===Notification.permission;e&&"https:"===document.location.protocol&&t&&o.confirm(TYPO3.lang["notification.request.title"],TYPO3.lang["notification.request.description"],n.info,[{text:TYPO3.lang["button.yes"]||"Yes",btnClass:"btn-"+n.getCssClass(n.info),name:"ok",active:!0},{text:TYPO3.lang["button.no"]||"No",btnClass:"btn-"+n.getCssClass(n.notice),name:"cancel"}]).on("confirm.button.ok",()=>{Notification.requestPermission(),o.dismiss()}).on("confirm.button.cancel",()=>{o.dismiss()}).on("hide.bs.modal",()=>{s.set("notifications.asked","yes")})}startTask(){if(null!==this.intervalId)return;let e=1e3*this.intervalTime;this.intervalId=setInterval(this.checkActiveSession,e)}stopTask(){clearInterval(this.intervalId),this.intervalId=null}setIntervalTime(e){this.intervalTime=Math.min(e,86400)}setLogoutUrl(e){this.logoutUrl=e}setLoginFramesetUrl(e){this.loginFramesetUrl=e}showTimeoutModal(){this.isTimingOut=!0,this.$timeoutModal.modal(this.options.modalConfig),this.fillProgressbar(this.$timeoutModal),"https:"===document.location.protocol&&"undefined"!=typeof Notification&&"granted"===Notification.permission&&document.hidden&&(this.webNotification=new Notification(TYPO3.lang["mess.login_about_to_expire_title"],{body:TYPO3.lang["mess.login_about_to_expire"],icon:"/typo3/sysext/backend/Resources/Public/Images/Logo.png"}),this.webNotification.onclick=()=>{window.focus()})}hideTimeoutModal(){this.isTimingOut=!1,this.$timeoutModal.modal("hide"),"undefined"!=typeof Notification&&null!==this.webNotification&&this.webNotification.close()}showBackendLockedModal(){this.$backendLockedModal.modal(this.options.modalConfig)}hideBackendLockedModal(){this.$backendLockedModal.modal("hide")}showLoginForm(){new a(TYPO3.settings.ajaxUrls.logout).get().then(()=>{TYPO3.configuration.showRefreshLoginPopup?this.showLoginPopup():this.$loginForm.modal(this.options.modalConfig)})}showLoginPopup(){const e=window.open(this.loginFramesetUrl,"relogin_"+Math.random().toString(16).slice(2),"height=450,width=700,status=0,menubar=0,location=1");e&&e.focus()}hideLoginForm(){this.$loginForm.modal("hide")}initializeBackendLockedModal(){this.$backendLockedModal=this.generateModal(l.lockedModal),this.$backendLockedModal.find(".modal-header h4").text(TYPO3.lang["mess.please_wait"]),this.$backendLockedModal.find(".modal-body").append(t("<p />").text(TYPO3.lang["mess.be_locked"])),this.$backendLockedModal.find(".modal-footer").remove(),t("body").append(this.$backendLockedModal)}initializeTimeoutModal(){this.$timeoutModal=this.generateModal(l.loginrefresh),this.$timeoutModal.addClass("modal-severity-notice"),this.$timeoutModal.find(".modal-header h4").text(TYPO3.lang["mess.login_about_to_expire_title"]),this.$timeoutModal.find(".modal-body").append(t("<p />").text(TYPO3.lang["mess.login_about_to_expire"]),t("<div />",{class:"progress"}).append(t("<div />",{class:"progress-bar progress-bar-warning progress-bar-striped active",role:"progressbar","aria-valuemin":"0","aria-valuemax":"100"}).append(t("<span />",{class:"sr-only"})))),this.$timeoutModal.find(".modal-footer").append(t("<button />",{class:"btn btn-default","data-action":"logout"}).text(TYPO3.lang["mess.refresh_login_logout_button"]).on("click",()=>{top.location.href=this.logoutUrl}),t("<button />",{class:"btn btn-primary t3js-active","data-action":"refreshSession"}).text(TYPO3.lang["mess.refresh_login_refresh_button"]).on("click",()=>{new a(TYPO3.settings.ajaxUrls.login_timedout).get().then(()=>{this.hideTimeoutModal()})})),this.registerDefaultModalEvents(this.$timeoutModal),t("body").append(this.$timeoutModal)}initializeLoginForm(){if(TYPO3.configuration.showRefreshLoginPopup)return;this.$loginForm=this.generateModal(l.loginFormModal),this.$loginForm.addClass("modal-notice");let o=String(TYPO3.lang["mess.refresh_login_title"]).replace("%s",TYPO3.configuration.username);this.$loginForm.find(".modal-header h4").text(o),this.$loginForm.find(".modal-body").append(t("<p />").text(TYPO3.lang["mess.login_expired"]),t("<form />",{id:"beLoginRefresh",method:"POST",action:TYPO3.settings.ajaxUrls.login}).append(t("<div />",{class:"form-group"}).append(t("<input />",{type:"password",name:"p_field",autofocus:"autofocus",class:"form-control",placeholder:TYPO3.lang["mess.refresh_login_password"],"data-rsa-encryption":"t3-loginrefres-userident"})),t("<input />",{type:"hidden",name:"username",value:TYPO3.configuration.username}),t("<input />",{type:"hidden",name:"userident",id:"t3-loginrefres-userident"}))),this.$loginForm.find(".modal-footer").append(t("<a />",{href:this.logoutUrl,class:"btn btn-default"}).text(TYPO3.lang["mess.refresh_exit_button"]),t("<button />",{type:"button",class:"btn btn-primary","data-action":"refreshSession"}).text(TYPO3.lang["mess.refresh_login_button"]).on("click",()=>{this.$loginForm.find("form").trigger("submit")})),this.registerDefaultModalEvents(this.$loginForm).on("submit",this.submitForm),t("body").append(this.$loginForm),window.require.specified("TYPO3/CMS/Rsaauth/RsaEncryptionModule")&&new Promise((function(t,o){e(["TYPO3/CMS/Rsaauth/RsaEncryptionModule"],(function(e){t("object"!=typeof e||"default"in e?{default:e}:Object.defineProperty(e,"default",{value:e,enumerable:!1}))}),o)})).then((function({default:e}){e.registerForm(t("#beLoginRefresh").get(0))}))}generateModal(e){return t("<div />",{id:e,class:"t3js-modal "+e+" modal modal-type-default modal-severity-notice modal-style-light modal-size-small fade"}).append(t("<div />",{class:"modal-dialog"}).append(t("<div />",{class:"modal-content"}).append(t("<div />",{class:"modal-header"}).append(t("<h4 />",{class:"modal-title"})),t("<div />",{class:"modal-body"}),t("<div />",{class:"modal-footer"}))))}fillProgressbar(e){if(!this.isTimingOut)return;let t=0;const o=e.find(".progress-bar"),i=o.children(".sr-only"),n=setInterval(()=>{const e=t>=100;!this.isTimingOut||e?(clearInterval(n),e&&(this.hideTimeoutModal(),this.showLoginForm()),t=0):t+=1;const s=t+"%";o.css("width",s),i.text(s)},300)}registerDefaultModalEvents(e){return e.on("hidden.bs.modal",()=>{this.startTask()}).on("shown.bs.modal",()=>{this.stopTask(),this.$timeoutModal.find(".modal-footer .t3js-active").first().focus()}),e}}let r;try{window.opener&&window.opener.TYPO3&&window.opener.TYPO3.LoginRefresh&&(r=window.opener.TYPO3.LoginRefresh),parent&&parent.window.TYPO3&&parent.window.TYPO3.LoginRefresh&&(r=parent.window.TYPO3.LoginRefresh),top&&top.TYPO3&&top.TYPO3.LoginRefresh&&(r=top.TYPO3.LoginRefresh)}catch(e){}return r||(r=new d,"undefined"!=typeof TYPO3&&(TYPO3.LoginRefresh=r)),r}));