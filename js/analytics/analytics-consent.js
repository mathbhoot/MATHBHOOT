const consentKey = 'mathbhoot.analyticsConsent.v1';
const measurementId = 'G-JPNB4LNP9J';
const analyticsModuleUrl = new URL('./google-analytics.js', import.meta.url);
const contentUrl = new URL('./analytics-consent-content.json', import.meta.url);
const stylesheetUrl = new URL('../../css/analytics/analytics-consent.css', import.meta.url);
let loadingPromise;

window[`ga-disable-${measurementId}`] = true;

const consentGranted = () => {
    try {
        return localStorage.getItem(consentKey) === 'granted';
    } catch {
        return false;
    }
};

const consentRecorded = () => {
    try {
        return ['granted', 'denied'].includes(localStorage.getItem(consentKey));
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
        localStorage.setItem(consentKey, granted ? 'granted' : 'denied');
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

const showConsentPrompt = async () => {
    if (consentRecorded() || !document.body || document.querySelector('[data-analytics-consent]')) return;

    const response = await fetch(contentUrl.href, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Analytics consent content is unavailable.');
    const content = await response.json();
    if (![content.message, content.acceptLabel, content.declineLabel].every((value) => typeof value === 'string')) return;

    if (!document.querySelector('[data-analytics-consent-styles]')) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = stylesheetUrl.href;
        stylesheet.dataset.analyticsConsentStyles = 'true';
        document.head?.appendChild(stylesheet);
    }

    const prompt = document.createElement('section');
    prompt.className = 'analytics-consent';
    prompt.dataset.analyticsConsent = 'true';
    prompt.setAttribute('aria-label', content.heading || 'Analytics preferences');

    const message = document.createElement('p');
    message.textContent = content.message;
    const actions = document.createElement('div');
    actions.className = 'analytics-consent__actions';

    const makeButton = (label, granted, className) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = label;
        button.addEventListener('click', async () => {
            button.disabled = true;
            await setConsent(granted);
            prompt.remove();
        });
        return button;
    };

    actions.append(
        makeButton(content.declineLabel, false, 'analytics-consent__decline'),
        makeButton(content.acceptLabel, true, 'analytics-consent__accept')
    );
    prompt.append(message, actions);
    document.body.appendChild(prompt);
};

loadAnalytics().catch(() => {
    console.warn('[MATHBHOOT] Analytics could not be loaded.');
});

showConsentPrompt().catch(() => {
    console.warn('[MATHBHOOT] Analytics preferences could not be displayed. Analytics remains disabled.');
});
