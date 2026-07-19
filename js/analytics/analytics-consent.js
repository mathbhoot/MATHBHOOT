const consentKey = 'mathbhoot.analyticsConsent.v1';
const measurementId = 'G-JPNB4LNP9J';
const analyticsModuleUrl = new URL('./google-analytics.js', import.meta.url);
let loadingPromise;

window[`ga-disable-${measurementId}`] = true;

const consentGranted = () => {
    try {
        return localStorage.getItem(consentKey) === 'granted';
    } catch {
        return false;
    }
};

const loadAnalytics = () => {
    if (!consentGranted()) return Promise.resolve(false);
    window[`ga-disable-${measurementId}`] = false;
    loadingPromise ||= import(analyticsModuleUrl.href).then(() => true);
    return loadingPromise;
};

const setConsent = async (granted) => {
    try {
        if (granted) localStorage.setItem(consentKey, 'granted');
        else localStorage.removeItem(consentKey);
    } catch {
        return false;
    }

    if (!granted) {
        window[`ga-disable-${measurementId}`] = true;
        return true;
    }
    return loadAnalytics();
};

window.MathbhootAnalyticsConsent = Object.freeze({
    isGranted: consentGranted,
    setConsent
});

loadAnalytics().catch(() => {
    console.warn('[MATHBHOOT] Analytics could not be loaded.');
});
