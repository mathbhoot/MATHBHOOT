import '../../config/supabase.js';
import { turnstileConfig } from '../../config/turnstile.js';

const moduleRoot = new URL('../../', import.meta.url);
const contentUrl = new URL('data/auth/auth-content.json', moduleRoot);
const styleUrl = new URL('css/auth/auth-ui.css', moduleRoot);
const turnstileScriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const turnstileLoadTimeoutMs = 12000;

let turnstilePromise;

const make = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

const loadStyles = () => {
    if (!document.head || document.querySelector('[data-mathbhoot-auth-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleUrl.href;
    link.dataset.mathbhootAuthStyles = 'true';
    document.head.append(link);
};

const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstilePromise) return turnstilePromise;

    turnstilePromise = new Promise((resolve, reject) => {
        let timeoutId;
        let script = document.querySelector('[data-mathbhoot-turnstile]');

        const cleanup = () => {
            window.clearTimeout(timeoutId);
            script?.removeEventListener('load', resolveLoadedApi);
            script?.removeEventListener('error', rejectLoad);
        };
        const resolveLoadedApi = () => {
            cleanup();
            if (window.turnstile) {
                if (script) script.dataset.loaded = 'true';
                resolve(window.turnstile);
            } else {
                rejectLoad();
            }
        };
        const rejectLoad = () => {
            cleanup();
            script?.remove();
            reject(new Error('Turnstile API unavailable'));
        };

        if (!script) {
            script = document.createElement('script');
            script.src = turnstileScriptUrl;
            script.async = true;
            script.defer = true;
            script.dataset.mathbhootTurnstile = 'true';
        } else if (script.dataset.loaded === 'true') {
            resolveLoadedApi();
            return;
        }

        script.addEventListener('load', resolveLoadedApi, { once: true });
        script.addEventListener('error', rejectLoad, { once: true });
        timeoutId = window.setTimeout(rejectLoad, turnstileLoadTimeoutMs);
        if (!script.isConnected) document.head.append(script);
    }).catch((error) => {
        turnstilePromise = undefined;
        throw error;
    });

    return turnstilePromise;
};

const getClient = async () => {
    const client = await window.MathbhootSupabase?.getClient?.();
    if (!client) throw new Error('connection');
    return client;
};

const cleanReturnUrl = () => `${window.location.origin}${window.location.pathname}${window.location.search}`;

const buildField = (definition) => {
    const field = make('div', 'auth-field');
    const label = make('label', '', definition.label);
    const input = make('input');
    label.htmlFor = definition.id;
    input.id = definition.id;
    input.name = definition.name;
    input.type = definition.type;
    input.required = Boolean(definition.required);
    if (definition.autocomplete) input.autocomplete = definition.autocomplete;
    if (definition.minlength) input.minLength = Number(definition.minlength);
    if (definition.maxlength) input.maxLength = Number(definition.maxlength);
    field.append(label, input);
    return field;
};

const passwordIsStrong = (password) => password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);

const initialize = async () => {
    const navLists = document.querySelectorAll('.navbar .nav-links');
    if (!navLists.length || !document.body) return;

    loadStyles();
    const response = await fetch(contentUrl);
    if (!response.ok) throw new Error('Auth content unavailable');
    const content = await response.json();
    if (!content?.navigation || !content?.signup || !content?.login || !content?.messages) return;

    let client = null;
    let session = null;
    let currentView = 'login';
    let lastFocused = null;
    let activeCaptcha = null;

    const dialog = make('dialog', 'auth-dialog');
    dialog.setAttribute('aria-labelledby', 'authDialogTitle');
    const shell = make('div', 'auth-dialog-shell');
    const close = make('button', 'auth-dialog-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', content.dialog.closeLabel);
    const eyebrow = make('p', 'auth-eyebrow', content.dialog.eyebrow);
    const view = make('div', 'auth-view');
    shell.append(close, eyebrow, view);
    dialog.append(shell);
    document.body.append(dialog);

    const setStatus = (status, message = '', state = '') => {
        status.textContent = message;
        status.dataset.state = state;
    };

    const safeServiceCode = (error) => {
        const code = String(error?.code || 'unknown').toLowerCase();
        return /^[a-z0-9_-]{2,64}$/.test(code) ? code : 'unknown';
    };

    const setServiceError = (status, error) => {
        const code = safeServiceCode(error);
        console.warn('[MATHBHOOT] Authentication service error:', code);
        setStatus(
            status,
            content.messages.serviceErrorCode?.replace('{code}', code)
                || content.messages.genericError
        );
    };

    const setWorking = (form, working) => {
        form.querySelectorAll('button, input').forEach((control) => {
            control.disabled = working;
        });
    };

    const mountCaptcha = (form, status, action) => {
        const container = make('div', 'auth-captcha');
        const submit = form.querySelector('.auth-submit');
        let token = '';
        let widgetId;
        if (submit) submit.disabled = true;
        form.insertBefore(container, submit);

        const setCaptchaStatus = (message) => {
            status.dataset.source = 'captcha';
            setStatus(status, message);
        };

        const clearCaptchaStatus = () => {
            if (status.dataset.source !== 'captcha') return;
            delete status.dataset.source;
            setStatus(status);
        };

        loadTurnstile()
            .then((turnstile) => {
                if (!turnstile || !container.isConnected) return;
                widgetId = turnstile.render(container, {
                    sitekey: turnstileConfig.siteKey,
                    theme: 'dark',
                    size: 'flexible',
                    action,
                    callback: (value) => {
                        token = value;
                        if (submit) submit.disabled = false;
                        clearCaptchaStatus();
                    },
                    'expired-callback': () => {
                        token = '';
                        if (submit) submit.disabled = true;
                        setCaptchaStatus(content.messages.captchaExpired);
                    },
                    'timeout-callback': () => {
                        token = '';
                        if (submit) submit.disabled = true;
                        setCaptchaStatus(content.messages.captchaExpired);
                    },
                    'error-callback': (errorCode) => {
                        token = '';
                        if (submit) submit.disabled = true;
                        const safeCode = /^\d{3,6}$/.test(String(errorCode || ''))
                            ? String(errorCode)
                            : 'unknown';
                        const diagnosticMessage = content.messages.captchaErrorCode
                            ?.replace('{code}', safeCode)
                            || content.messages.captchaError;
                        console.warn('[MATHBHOOT] Turnstile client error:', safeCode);
                        setCaptchaStatus(diagnosticMessage);
                        return true;
                    }
                });
            })
            .catch(() => setCaptchaStatus(content.messages.captchaError));

        return Object.freeze({
            getToken: () => token,
            reset: () => {
                token = '';
                if (submit) submit.disabled = true;
                if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
            },
            remove: () => {
                if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
            }
        });
    };

    const renderForm = (section, fields, onSubmit) => {
        activeCaptcha?.remove();
        activeCaptcha = null;
        const title = make('h2', '', section.title);
        title.id = 'authDialogTitle';
        const description = make('p', 'auth-description', section.description);
        const form = make('form', 'auth-form');
        fields.forEach((field) => form.append(buildField(field)));
        const submit = make('button', 'auth-submit', section.submit);
        submit.type = 'submit';
        const status = make('p', 'auth-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        form.append(submit, status);
        form.addEventListener('submit', (event) => onSubmit(event, form, status));
        view.replaceChildren(title, description, form);
        return { form, status, submit };
    };

    const renderSignup = () => {
        currentView = 'signup';
        let captcha;
        const { form, status } = renderForm(content.signup, content.signup.fields, async (event, activeForm, activeStatus) => {
            event.preventDefault();
            if (!activeForm.reportValidity()) return;
            const captchaToken = captcha?.getToken();
            if (!captchaToken) {
                setStatus(activeStatus, content.messages.captchaWaiting);
                return;
            }
            const values = new FormData(activeForm);
            const password = String(values.get('password') || '');
            if (password !== String(values.get('passwordConfirm') || '')) {
                setStatus(activeStatus, content.signup.passwordMismatch);
                return;
            }
            if (!passwordIsStrong(password)) {
                setStatus(activeStatus, content.signup.passwordRule);
                return;
            }

            setWorking(activeForm, true);
            setStatus(activeStatus, content.messages.working);
            try {
                client ||= await getClient();
                const { error } = await client.auth.signUp({
                    email: String(values.get('email') || '').trim().toLowerCase(),
                    password,
                    options: {
                        emailRedirectTo: cleanReturnUrl(),
                        captchaToken,
                        data: {
                            full_name: String(values.get('fullName') || '').trim(),
                            date_of_birth: String(values.get('dateOfBirth') || '')
                        }
                    }
                });
                if (error) throw error;
                activeForm.reset();
                setStatus(activeStatus, content.signup.success, 'success');
            } catch (error) {
                setServiceError(activeStatus, error);
            } finally {
                setWorking(activeForm, false);
                captcha?.reset();
            }
        });
        const note = make('p', 'auth-form-note', content.signup.passwordRule);
        const privacy = make('p', 'auth-form-note', content.signup.privacyNotice);
        form.insertBefore(note, form.querySelector('.auth-submit'));
        form.insertBefore(privacy, form.querySelector('.auth-submit'));
        captcha = mountCaptcha(form, status, 'signup');
        activeCaptcha = captcha;
        const dob = form.elements.namedItem('dateOfBirth');
        if (dob) {
            const today = new Date();
            dob.max = today.toISOString().slice(0, 10);
            dob.min = '1900-01-01';
        }
        status.textContent = '';
    };

    const renderReset = () => {
        currentView = 'reset';
        const fields = [content.login.fields.find((field) => field.name === 'email')].filter(Boolean);
        let captcha;
        const { form, status } = renderForm(content.reset, fields, async (event, activeForm, activeStatus) => {
            event.preventDefault();
            if (!activeForm.reportValidity()) return;
            const captchaToken = captcha?.getToken();
            if (!captchaToken) {
                setStatus(activeStatus, content.messages.captchaWaiting);
                return;
            }
            setWorking(activeForm, true);
            setStatus(activeStatus, content.messages.working);
            try {
                client ||= await getClient();
                const values = new FormData(activeForm);
                const { error } = await client.auth.resetPasswordForEmail(
                    String(values.get('email') || '').trim().toLowerCase(),
                    { redirectTo: cleanReturnUrl(), captchaToken }
                );
                if (error) throw error;
                activeForm.reset();
                setStatus(activeStatus, content.reset.success, 'success');
            } catch (error) {
                setServiceError(activeStatus, error);
            } finally {
                setWorking(activeForm, false);
                captcha?.reset();
            }
        });
        const back = make('button', 'auth-text-button', content.reset.back);
        back.type = 'button';
        back.addEventListener('click', () => renderLogin());
        form.append(back);
        captcha = mountCaptcha(form, status, 'password_reset');
        activeCaptcha = captcha;
    };

    const renderUpdatePassword = () => {
        currentView = 'update-password';
        const passwordFields = content.signup.fields.filter((field) => field.name === 'password' || field.name === 'passwordConfirm');
        const { form } = renderForm(content.updatePassword, passwordFields, async (event, activeForm, status) => {
            event.preventDefault();
            if (!activeForm.reportValidity()) return;
            const values = new FormData(activeForm);
            const password = String(values.get('password') || '');
            if (password !== String(values.get('passwordConfirm') || '')) {
                setStatus(status, content.signup.passwordMismatch);
                return;
            }
            if (!passwordIsStrong(password)) {
                setStatus(status, content.signup.passwordRule);
                return;
            }
            setWorking(activeForm, true);
            setStatus(status, content.messages.working);
            try {
                client ||= await getClient();
                const { error } = await client.auth.updateUser({ password });
                if (error) throw error;
                activeForm.reset();
                setStatus(status, content.updatePassword.success, 'success');
            } catch {
                setStatus(status, content.messages.genericError);
            } finally {
                setWorking(activeForm, false);
            }
        });
        form.insertBefore(make('p', 'auth-form-note', content.signup.passwordRule), form.querySelector('.auth-submit'));
    };

    const renderAccount = () => {
        currentView = 'account';
        const title = make('h2', '', content.account.title);
        title.id = 'authDialogTitle';
        const verified = make('p', 'auth-description', content.account.verified);
        const email = make('p', 'auth-account-detail');
        email.append(make('strong', '', `${content.account.emailLabel}: `), document.createTextNode(session?.user?.email || ''));
        const onboarding = make('p', 'auth-account-detail', content.account.onboarding);
        view.replaceChildren(title, verified, email, onboarding);
    };

    const renderLogin = () => {
        currentView = 'login';
        let captcha;
        const { form, status } = renderForm(content.login, content.login.fields, async (event, activeForm, activeStatus) => {
            event.preventDefault();
            if (!activeForm.reportValidity()) return;
            const captchaToken = captcha?.getToken();
            if (!captchaToken) {
                setStatus(activeStatus, content.messages.captchaWaiting);
                return;
            }
            setWorking(activeForm, true);
            setStatus(activeStatus, content.messages.working);
            try {
                client ||= await getClient();
                const values = new FormData(activeForm);
                const { error } = await client.auth.signInWithPassword({
                    email: String(values.get('email') || '').trim().toLowerCase(),
                    password: String(values.get('password') || ''),
                    options: { captchaToken }
                });
                if (error) throw error;
                activeForm.reset();
                dialog.close();
            } catch {
                setStatus(activeStatus, content.messages.loginFailed);
            } finally {
                setWorking(activeForm, false);
                captcha?.reset();
            }
        });
        const forgot = make('button', 'auth-text-button', content.login.forgotPassword);
        forgot.type = 'button';
        forgot.addEventListener('click', () => renderReset());
        form.append(forgot);
        captcha = mountCaptcha(form, status, 'login');
        activeCaptcha = captcha;
    };

    const openDialog = (requestedView) => {
        lastFocused = document.activeElement;
        if (requestedView === 'signup') renderSignup();
        else if (requestedView === 'account' && session) renderAccount();
        else if (requestedView === 'update-password') renderUpdatePassword();
        else renderLogin();
        if (!dialog.open) dialog.showModal();
        document.body.classList.add('auth-dialog-open');
    };

    const updateNavigation = () => {
        navLists.forEach((navList) => {
            navList.querySelector('.auth-nav-slot')?.remove();
            const slot = make('li', 'auth-nav-slot');
            if (session) {
                const account = make('button', 'auth-nav-button auth-nav-button-primary', content.navigation.account);
                account.type = 'button';
                account.addEventListener('click', () => openDialog('account'));
                const logout = make('button', 'auth-nav-button', content.navigation.logOut);
                logout.type = 'button';
                logout.addEventListener('click', async () => {
                    logout.disabled = true;
                    try {
                        client ||= await getClient();
                        await client.auth.signOut({ scope: 'local' });
                    } finally {
                        logout.disabled = false;
                    }
                });
                slot.append(account, logout);
            } else {
                const signup = make('button', 'auth-nav-button auth-nav-button-primary', content.navigation.signUp);
                signup.type = 'button';
                signup.addEventListener('click', () => openDialog('signup'));
                const login = make('button', 'auth-nav-button', content.navigation.logIn);
                login.type = 'button';
                login.addEventListener('click', () => openDialog('login'));
                slot.append(signup, login);
            }
            navList.append(slot);
        });
    };

    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
        document.body.classList.remove('auth-dialog-open');
        if (lastFocused instanceof HTMLElement) lastFocused.focus();
    });
    dialog.addEventListener('cancel', () => document.body.classList.remove('auth-dialog-open'));

    updateNavigation();
    try {
        client = await getClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        session = data.session;
        updateNavigation();
        client.auth.onAuthStateChange((event, nextSession) => {
            session = nextSession;
            updateNavigation();
            if (event === 'PASSWORD_RECOVERY') openDialog('update-password');
            if (event === 'SIGNED_IN' && currentView === 'login' && dialog.open) dialog.close();
        });
    } catch {
        session = null;
        updateNavigation();
    }
};

initialize().catch(() => {
    console.warn('[MATHBHOOT] Account interface could not be initialized.');
});
