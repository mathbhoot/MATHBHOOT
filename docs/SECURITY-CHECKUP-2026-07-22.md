# MATHBHOOT Security Checkup — 22 July 2026

## Scope

This review covered the deployable static site, Control Room recruitment flow, browser-side configuration, Supabase/Auth/Turnstile references, deployment headers, local data storage, and secret-like credential patterns. It did not access or alter the remote Supabase, Cloudflare, Resend, Vercel, DNS, or email-provider dashboards.

## Current posture

- Control Room recruitment is paused and fail-closed.
- No recruitment form fields or submit controls are rendered.
- The Supabase submission client and local draft store are not loaded by the page.
- Dormant Supabase, Auth, Turnstile, database, and local-development files are excluded from Vercel deployment.
- Public browser configuration values have been replaced with non-working placeholders.
- The production Content Security Policy blocks form submission, frames, Supabase, Turnstile, and the unused package CDN.
- HSTS and same-origin resource policy headers are enabled.
- No active Resend or Docker runtime integration was found.
- No private/service-role key, private key block, payment secret, or Resend API credential was found in the current tracked tree.

## Important operational actions

Repository changes cannot disable remote services or invalidate credentials already stored in provider dashboards. While these features remain unused:

1. Disable public signups and email OTP in the Supabase Auth dashboard.
2. Review and revoke unused Supabase sessions; rotate keys if a secret key was ever shared outside the provider dashboard.
3. Confirm Row Level Security remains enabled on every public-schema table.
4. Disable or delete unused Resend API keys and sending domains.
5. Remove unused Turnstile widgets or keep their hostname allowlist restricted to production.
6. Remove unused Vercel environment variables and redeploy after these repository changes are committed.

The former Supabase publishable key and Turnstile site key were designed for browser exposure; replacing them reduces dormant surface area but does not substitute for dashboard review. Any secret or service-role credential exposed in source or chat history must be revoked immediately.

## Reactivation gate

Do not restore recruitment by changing only the availability JSON. Reactivation requires restoring deployment inclusions and environment-specific public configuration, reviewing Supabase RLS/RPC tests, re-enabling CAPTCHA and rate limits, validating privacy/retention copy, testing email delivery, and performing a fresh security review before accepting personal information.
