const analyticsScript = document.createElement('script');
analyticsScript.src = '/js/analytics/google-analytics.js';
analyticsScript.async = true;
analyticsScript.dataset.mathbhootAnalyticsLoader = 'true';

if (document.head && !document.querySelector('[data-mathbhoot-analytics-loader]')) {
    document.head.appendChild(analyticsScript);
}

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navLinks.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(!isExpanded));
    });
}
