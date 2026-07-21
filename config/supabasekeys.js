/**
 * Dormant public Supabase browser configuration.
 *
 * Recruitment and account features are paused. Restore a hostname-restricted
 * publishable key only as part of an approved feature reactivation audit.
 * Never place a secret key or service_role key in browser code.
 */
export const supabaseConfig = Object.freeze({
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    publishableKey: 'sb_publishable_REPLACE_BEFORE_ENABLE'
});
