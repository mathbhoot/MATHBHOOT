# MATHBHOOT Supabase Operations

The files in this directory are the source of truth for database structure and access policies. Do not create or alter production tables directly in the Supabase Dashboard.

## Local workflow

Docker Desktop must be running. This computer has limited Docker memory, so use the focused service set needed by the current account feature:

```powershell
npx.cmd --yes supabase@latest start --exclude studio,edge-runtime,imgproxy,realtime
npx.cmd --yes supabase@latest db reset
npx.cmd --yes supabase@latest test db
npx.cmd --yes supabase@latest db lint --local --level warning
```

Use `npx.cmd --yes supabase@latest stop` when local services are no longer needed.

## Migration rules

- Use a unique 14-digit UTC timestamp: `YYYYMMDDHHMMSS_descriptive_name.sql`.
- Test every migration from a clean `db reset`.
- Add or update pgTAP tests for RLS, grants, and security-sensitive functions.
- Run `db push --linked --dry-run` and review the exact file list before deployment.
- Never use `--include-all` unless migration history has been inspected and the reason is documented.
- Never place personal data, production credentials, or service-role keys in migrations or seed files.

## Production project

- Project name: `MATHBHOOT`
- Project reference: `iolqxnabcvcpqmrcgypd`
- Region: Northeast Asia (Seoul)

The project reference is public metadata. Personal access tokens, database passwords, SMTP credentials, CAPTCHA secrets, and secret/service-role keys must remain outside Git.

## Configuration boundary

`config.toml` is for local development and contains localhost URLs. Do not run `supabase config push` against production. Configure production Auth URLs, SMTP, CAPTCHA, and rate limits in the Supabase Dashboard and record non-secret decisions in project documentation.

## Current security checks

`tests/database/account-security.test.sql` verifies private-schema isolation, RLS on account and recruitment tables, and deletion-request function permissions. Local signup testing also confirmed that adult registration creates one private account and one policy-acceptance record while underage registration is rejected by the database.
