import '../../../config/supabase.js';

const allowedMissions = new Set([
    'Mathematical Trap',
    'NPC or Character',
    'Ancient Artifact',
    'MathVilla Room',
    'Mathematical Rule',
    'Other'
]);

const validate = (draft) => {
    const username = String(draft?.username || '').trim();
    const email = String(draft?.email || '').trim().toLowerCase();
    const mission = String(draft?.mission || '').trim();
    const ideaDescription = String(draft?.ideaDescription || '').trim();

    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) throw new Error('Username must use 3–30 letters, numbers, or underscores.');
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) throw new Error('Enter a valid account email address.');
    if (!allowedMissions.has(mission)) throw new Error('Choose one of the available missions.');
    if (ideaDescription.length < 40 || ideaDescription.length > 3000) throw new Error('Idea description must contain 40–3000 characters.');
    if (!draft?.originalityConfirmed) throw new Error('Confirm the originality and storage agreement before submitting.');

    return { username, email, mission, ideaDescription };
};

const getClient = async () => {
    const client = await window.MathbhootSupabase?.getClient?.();
    if (!client) throw new Error('The secure Supabase connection is unavailable. Please try again later.');
    return client;
};

const submit = async (draft) => {
    const clean = validate(draft);
    const client = await getClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw new Error('Your account session could not be verified.');

    const user = sessionData.session?.user;
    if (!user) {
        const { error } = await client.auth.signInWithOtp({
            email: clean.email,
            options: {
                emailRedirectTo: window.location.href.split('#')[0],
                data: { requested_username: clean.username }
            }
        });
        if (error) throw new Error('The verification email could not be sent. Please try again shortly.');
        return { verificationSent: true };
    }

    if (String(user.email || '').toLowerCase() !== clean.email) {
        throw new Error('Use the email address verified for this account, or sign out before using another email.');
    }

    const { data, error } = await client.rpc('submit_recruitment_idea', {
        requested_username: clean.username,
        selected_mission: clean.mission,
        idea_description: clean.ideaDescription
    });

    if (error) {
        if (error.code === '23505') throw new Error('That username is already taken. Please choose another.');
        if (error.code === '23514' || error.code === '22023') throw new Error('The submission did not pass secure validation. Review the fields and try again.');
        throw new Error('The idea could not be submitted safely. Your draft remains on this device.');
    }

    return { submitted: true, reference: String(data || '').slice(0, 8).toUpperCase() };
};

window.MathbhootRecruitmentSubmission = Object.freeze({ submit });
