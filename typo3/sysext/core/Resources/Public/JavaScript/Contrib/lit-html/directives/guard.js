define(["exports","../lit-html","../directive"],(function(exports,litHtml,directive){"use strict";
/**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const e={},i=directive.directive(class extends directive.Directive{constructor(){super(...arguments),this.$t=e}render(r,t){return t()}update(t,[s,e]){if(Array.isArray(s)){if(Array.isArray(this.$t)&&this.$t.length===s.length&&s.every((r,t)=>r===this.$t[t]))return litHtml.noChange}else if(this.$t===s)return litHtml.noChange;return this.$t=Array.isArray(s)?Array.from(s):s,this.render(s,e)}});exports.guard=i,Object.defineProperty(exports,"__esModule",{value:!0})}));
