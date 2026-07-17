const SUPABASE_CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const isConfigured = ({ url, publishableKey } = {}) => {
    if (typeof url !== 'string' || typeof publishableKey !== 'string') return false;

    try {
        const endpoint = new URL(url);
        return endpoint.protocol === 'https:'
            && endpoint.hostname.endsWith('.supabase.co')
            && !url.includes('YOUR_PROJECT_REF')
            && publishableKey.startsWith('sb_publishable_');
    } catch {
        return false;
    }
};

const connectSupabase = async () => {
    const [{ createClient }, { supabaseConfig }] = await Promise.all([
        import(SUPABASE_CDN_URL),
        import('./supabasekeys.js')
    ]);

    if (typeof createClient !== 'function') {
        throw new Error('The Supabase browser library did not load correctly.');
    }

    if (!isConfigured(supabaseConfig)) {
        throw new Error('Add the Supabase project URL and publishable key in config/supabasekeys.js.');
    }

    const client = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });

    const { error } = await client.auth.getSession();
    if (error) throw error;

    window.dispatchEvent(new CustomEvent('mathbhoot:supabase-ready', {
        detail: { client }
    }));

    return client;
};

const clientPromise = connectSupabase().catch((error) => {
    console.warn('[MATHBHOOT] Supabase is not connected:', error.message);
    window.dispatchEvent(new CustomEvent('mathbhoot:supabase-error', {
        detail: { message: error.message }
    }));
    return null;
});

window.MathbhootSupabase = Object.freeze({
    getClient: () => clientPromise
});
