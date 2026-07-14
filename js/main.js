const legalFooterScript = document.createElement('script');
const mainScriptSource = document.currentScript?.src;
legalFooterScript.src = mainScriptSource
    ? new URL('global/legal-footer-link.js', mainScriptSource).href
    : '/js/global/legal-footer-link.js';
legalFooterScript.defer = true;
legalFooterScript.dataset.mathbhootLegalFooterLoader = 'true';

if (document.head && !document.querySelector('[data-mathbhoot-legal-footer-loader]')) {
    document.head.appendChild(legalFooterScript);
}

const analyticsScript = document.createElement('script');
analyticsScript.src = '/js/analytics/google-analytics.js';
analyticsScript.async = true;
analyticsScript.dataset.mathbhootAnalyticsLoader = 'true';

if (document.head && !document.querySelector('[data-mathbhoot-analytics-loader]')) {
    document.head.appendChild(analyticsScript);
}

const navToggles = document.querySelectorAll('.nav-toggle');

navToggles.forEach((navToggle) => {
    const controlledId = navToggle.getAttribute('aria-controls');
    const navbar = navToggle.closest('.navbar');
    const navLinks = controlledId
        ? document.getElementById(controlledId)
        : navbar?.querySelector('.nav-links');

    if (!navbar || !navLinks) return;

    const closeMenu = (restoreFocus = false) => {
        const wasOpen = navLinks.classList.contains('active');
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open main navigation');
        if (restoreFocus && wasOpen) navToggle.focus();
    };

    navToggle.addEventListener('click', () => {
        const willOpen = !navLinks.classList.contains('active');
        navLinks.classList.toggle('active', willOpen);
        navToggle.setAttribute('aria-expanded', String(willOpen));
        navToggle.setAttribute('aria-label', willOpen ? 'Close main navigation' : 'Open main navigation');
    });

    navLinks.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('a')) closeMenu();
    });

    document.addEventListener('pointerdown', (event) => {
        if (!navbar.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu(true);
    });

    const desktopLayout = window.matchMedia('(min-width: 769px)');
    const handleLayoutChange = (event) => {
        if (event.matches) closeMenu();
    };

    if (typeof desktopLayout.addEventListener === 'function') {
        desktopLayout.addEventListener('change', handleLayoutChange);
    } else if (typeof desktopLayout.addListener === 'function') {
        desktopLayout.addListener(handleLayoutChange);
    }
});
