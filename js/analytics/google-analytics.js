(() => {
    const measurementId = 'G-JPNB4LNP9J';

    if (window.__mathbhootAnalyticsLoaded) {
        return;
    }

    window.__mathbhootAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
        send_page_view: true
    });

    const existingTag = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);

    if (!existingTag) {
        const googleTag = document.createElement('script');
        googleTag.async = true;
        googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        googleTag.dataset.mathbhootAnalytics = 'true';
        document.head.appendChild(googleTag);
    }
})();
