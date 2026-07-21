/**
 * Dormant public Cloudflare Turnstile configuration.
 *
 * Restore a hostname-restricted site key only when account forms are approved
 * for reactivation. Never place the Turnstile secret key in browser code.
 */
export const turnstileConfig = Object.freeze({
    siteKey: 'TURNSTILE_SITE_KEY_REPLACE_BEFORE_ENABLE',
    mode: 'disabled'
});
