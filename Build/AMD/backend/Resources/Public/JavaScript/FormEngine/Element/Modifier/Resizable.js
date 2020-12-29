define(['require', 'exports'], function (require, exports) { 'use strict';

    function _interopNamespaceDefaultOnly(e) {
        return Object.freeze({__proto__: null, 'default': e});
    }

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
    /**
     * Convert textarea so they grow when it is typed in.
     */
    class Resizable {
        /**
         * @param {HTMLTextAreaElement} textarea
         */
        static enable(textarea) {
            new Promise(function (resolve, reject) { require(['../../../../../../../core/Resources/Public/JavaScript/Contrib/autosize'], function (m) { resolve(/*#__PURE__*/_interopNamespaceDefaultOnly(m)); }, reject) }).then(({ default: autosize }) => {
                autosize(textarea);
            });
        }
    }

    exports.Resizable = Resizable;

    Object.defineProperty(exports, '__esModule', { value: true });

});
