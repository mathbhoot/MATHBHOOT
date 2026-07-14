(() => {
    'use strict';

    const footer = document.querySelector('.site-footer');

    if (!footer) return;

    const moduleSource = document.currentScript?.src;
    const legalUrl = moduleSource
        ? new URL('../../html/legal/educational-purpose.html', moduleSource).href
        : '/html/legal/educational-purpose.html';
    const existingLink = footer.querySelector('a[href$="/legal/educational-purpose.html"], a[href="educational-purpose.html"]');
    let footerText = footer.querySelector('p');

    if (!footerText) {
        footerText = document.createElement('p');
        footer.appendChild(footerText);
    }

    const copyright = document.createElement('span');
    copyright.className = 'global-footer-copyright';
    copyright.textContent = '©2026 MATHBHOOT. All rights reserved.';

    const legalLink = existingLink || document.createElement('a');
    legalLink.className = 'global-legal-link';
    legalLink.href = legalUrl;
    legalLink.textContent = 'Legal & Child Safety';
    legalLink.setAttribute('aria-label', 'Read the MATHBHOOT educational purpose and child-safety notice');
    if (window.location.href === legalLink.href) legalLink.setAttribute('aria-current', 'page');

    footerText.replaceChildren(copyright, legalLink);
})();
