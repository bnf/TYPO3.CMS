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
var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};define(["require","exports","jquery","TYPO3/CMS/Backend/ActionButton/DeferredAction","TYPO3/CMS/Backend/ActionButton/ImmediateAction","TYPO3/CMS/Backend/Notification"],(function(e,t,a,o,i,c){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),a=__importDefault(a),describe("TYPO3/CMS/Backend/Notification:",()=>{beforeEach(()=>{a.default.fx.off=!0,jasmine.clock().install();const e=document.getElementById("alert-container");for(;null!==e&&e.firstChild;)e.removeChild(e.firstChild)}),afterEach(()=>{jasmine.clock().uninstall()}),describe("can render notifications with dismiss after 1000ms",()=>{for(let e of[{method:c.notice,title:"Notice message",message:"This notification describes a notice",class:"alert-notice"},{method:c.info,title:"Info message",message:"This notification describes an informative action",class:"alert-info"},{method:c.success,title:"Success message",message:"This notification describes a successful action",class:"alert-success"},{method:c.warning,title:"Warning message",message:"This notification describes a harmful action",class:"alert-warning"},{method:c.error,title:"Error message",message:"This notification describes an erroneous action",class:"alert-danger"}])it("can render a notification of type "+e.class,async()=>{e.method(e.title,e.message,1),await document.querySelector("#alert-container typo3-notification-message:last-child").updateComplete;const t="div.alert."+e.class,a=document.querySelector(t);expect(a).not.toBe(null),expect(a.querySelector(".alert-title").textContent).toEqual(e.title),expect(a.querySelector(".alert-message").textContent).toEqual(e.message),jasmine.clock().tick(1200),expect(document.querySelector(t)).toBe(null)})}),it("can render action buttons",async()=>{c.info("Info message","Some text",1,[{label:"My action",action:new i(e=>e)},{label:"My other action",action:new o(e=>e)}]),await document.querySelector("#alert-container typo3-notification-message:last-child").updateComplete;const e=document.querySelector("div.alert");expect(e.querySelector(".alert-actions")).not.toBe(null),expect(e.querySelectorAll(".alert-actions a").length).toEqual(2),expect(e.querySelectorAll(".alert-actions a")[0].textContent).toEqual("My action"),expect(e.querySelectorAll(".alert-actions a")[1].textContent).toEqual("My other action")}),it("immediate action is called",async()=>{const e={callback:()=>{}};spyOn(e,"callback").and.callThrough(),c.info("Info message","Some text",1,[{label:"My immediate action",action:new i(e.callback)}]),await document.querySelector("#alert-container typo3-notification-message:last-child").updateComplete;document.querySelector("div.alert").querySelector(".alert-actions a").click(),expect(e.callback).toHaveBeenCalled()})})}));