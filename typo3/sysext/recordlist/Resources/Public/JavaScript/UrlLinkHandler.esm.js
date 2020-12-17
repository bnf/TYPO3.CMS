import $ from '../../../../core/Resources/Public/JavaScript/Contrib/jquery/jquery.esm.js';
import LinkBrowser from './LinkBrowser.esm.js';

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
 * Module: TYPO3/CMS/Recordlist/UrlLinkHandler
 * @exports TYPO3/CMS/Recordlist/UrlLinkHandler
 * URL link interaction
 */
class UrlLinkHandler {
    constructor() {
        this.link = (event) => {
            event.preventDefault();
            const value = $(event.currentTarget).find('[name="lurl"]').val();
            if (value === '') {
                return;
            }
            LinkBrowser.finalizeFunction(value);
        };
        $(() => {
            $('#lurlform').on('submit', this.link);
        });
    }
}
var UrlLinkHandler$1 = new UrlLinkHandler();

export default UrlLinkHandler$1;
