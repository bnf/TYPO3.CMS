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
define(["jquery","./LinkBrowser"],(function(t,e){"use strict";return new class{constructor(){t(()=>{t("#lmailform").on("submit",r=>{r.preventDefault();let i=t(r.currentTarget).find('[name="lemail"]').val();if("mailto:"!==i){for(;"mailto:"===i.substr(0,7);)i=i.substr(7);e.finalizeFunction("mailto:"+i)}})})}}}));