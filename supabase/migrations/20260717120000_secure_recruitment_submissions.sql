create table if not exists public.recruitment_accounts (
    user_id uuid primary key references auth.users(id) on delete cascade,
    username text not null,
    email text not null,
    created_at timestamptz not null default now(),
    constraint recruitment_accounts_username_format check (username ~ '^[A-Za-z0-9_]{3,30}$'),
    constraint recruitment_accounts_email_length check (char_length(email) between 3 and 254),
    constraint recruitment_accounts_user_username_unique unique (user_id, username)
);

create unique index if not exists recruitment_accounts_username_lower_unique
    on public.recruitment_accounts (lower(username));

create unique index if not exists recruitment_accounts_email_lower_unique
    on public.recruitment_accounts (lower(email));

create table if not exists public.recruitment_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    username text not null,
    mission text not null,
    idea_description text not null,
    status text not null default 'submitted',
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    constraint recruitment_submissions_account_fk
        foreign key (user_id, username)
        references public.recruitment_accounts(user_id, username)
        on update cascade on delete cascade,
    constraint recruitment_submissions_mission_check
        check (mission in ('Mathematical Trap', 'NPC or Character', 'Ancient Artifact', 'MathVilla Room', 'Mathematical Rule', 'Other')),
    constraint recruitment_submissions_idea_length
        check (char_length(idea_description) between 40 and 3000),
    constraint recruitment_submissions_status_check
        check (status in ('submitted', 'under_review', 'approved', 'rejected'))
);

alter table public.recruitment_accounts enable row level security;
alter table public.recruitment_submissions enable row level security;

revoke all on table public.recruitment_accounts from public, anon, authenticated;
revoke all on table public.recruitment_submissions from public, anon, authenticated;

grant insert on table public.recruitment_accounts to authenticated;
grant insert on table public.recruitment_submissions to authenticated;

drop policy if exists "Account owner can register" on public.recruitment_accounts;
create policy "Account owner can register"
on public.recruitment_accounts
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
);

drop policy if exists "Account owner can submit" on public.recruitment_submissions;
create policy "Account owner can submit"
on public.recruitment_submissions
for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'submitted');

create or replace function public.submit_recruitment_idea(
    requested_username text,
    selected_mission text,
    idea_description text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
    current_user_id uuid := auth.uid();
    current_email text := auth.jwt() ->> 'email';
    submission_id uuid := gen_random_uuid();
begin
    if current_user_id is null or current_email is null then
        raise exception 'A verified account is required' using errcode = '22023';
    end if;

    if requested_username !~ '^[A-Za-z0-9_]{3,30}$'
       or selected_mission not in ('Mathematical Trap', 'NPC or Character', 'Ancient Artifact', 'MathVilla Room', 'Mathematical Rule', 'Other')
       or char_length(trim(idea_description)) not between 40 and 3000 then
        raise exception 'Invalid recruitment submission' using errcode = '22023';
    end if;

    insert into public.recruitment_accounts (user_id, username, email)
    values (current_user_id, requested_username, lower(current_email))
    on conflict (user_id) do nothing;

    insert into public.recruitment_submissions (id, user_id, username, mission, idea_description)
    values (submission_id, current_user_id, requested_username, selected_mission, trim(idea_description));

    return submission_id;
end;
$$;

revoke execute on function public.submit_recruitment_idea(text, text, text) from public, anon;
grant execute on function public.submit_recruitment_idea(text, text, text) to authenticated;
