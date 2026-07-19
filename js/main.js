import('./analytics/analytics-consent.js').catch(() => {
    console.warn('[MATHBHOOT] Analytics consent controls are unavailable. Analytics remains disabled.');
});

import('./auth/auth-ui.js').catch(() => {
    console.warn('[MATHBHOOT] Account controls are temporarily unavailable.');
});

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
