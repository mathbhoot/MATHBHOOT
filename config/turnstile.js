/**
 * Public Cloudflare Turnstile configuration.
 *
 * This public site key is restricted to the production Mathbhoot hostname.
 * Never place the Turnstile secret key in this file or any browser code.
 */
export const turnstileConfig = Object.freeze({
    siteKey: '0x4AAAAAAD4CyJHFc0TkWt_Z',
    mode: 'production'
});
