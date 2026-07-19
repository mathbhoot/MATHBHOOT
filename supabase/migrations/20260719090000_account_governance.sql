create table if not exists private.policy_acceptances (
    user_id uuid not null references auth.users(id) on delete cascade,
    policy_version text not null,
    accepted_at timestamptz not null default now(),
    primary key (user_id, policy_version),
    constraint policy_acceptances_version_length
        check (char_length(policy_version) between 8 and 40)
);

create table if not exists private.account_deletion_requests (
    user_id uuid primary key references auth.users(id) on delete cascade,
    requested_at timestamptz not null default now(),
    status text not null default 'requested',
    completed_at timestamptz,
    constraint account_deletion_requests_status
        check (status in ('requested', 'processing', 'completed', 'cancelled'))
);

revoke all on table private.policy_acceptances from public, anon, authenticated;
revoke all on table private.account_deletion_requests from public, anon, authenticated;
alter table private.policy_acceptances enable row level security;
alter table private.account_deletion_requests enable row level security;

create or replace function private.prepare_member_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    supplied_name text := trim(new.raw_user_meta_data ->> 'full_name');
    supplied_dob text := new.raw_user_meta_data ->> 'date_of_birth';
    supplied_policy_version text := new.raw_user_meta_data ->> 'policy_version';
    supplied_terms_accepted boolean := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false);
begin
    if supplied_name is null or char_length(supplied_name) not between 2 and 80 then
        raise exception 'Valid member name is required' using errcode = '22023';
    end if;

    if supplied_dob is null or supplied_dob !~ '^\d{4}-\d{2}-\d{2}$'
       or supplied_dob::date not between date '1900-01-01' and current_date
       or supplied_dob::date > current_date - interval '18 years' then
        raise exception 'Account holder must be at least 18 years old' using errcode = '22023';
    end if;

    if not supplied_terms_accepted or supplied_policy_version <> '2026-07-19' then
        raise exception 'Current policies must be accepted' using errcode = '22023';
    end if;

    new.raw_app_meta_data := jsonb_set(
        coalesce(new.raw_app_meta_data, '{}'::jsonb),
        '{_mathbhoot_private_signup}',
        jsonb_build_object(
            'full_name', supplied_name,
            'date_of_birth', supplied_dob,
            'policy_version', supplied_policy_version
        ),
        true
    );
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb)
        - 'full_name' - 'date_of_birth' - 'terms_accepted' - 'policy_version';
    return new;
end;
$$;

revoke execute on function private.prepare_member_account() from public, anon, authenticated;

create or replace function private.capture_member_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    private_signup jsonb := new.raw_app_meta_data -> '_mathbhoot_private_signup';
    supplied_name text := trim(private_signup ->> 'full_name');
    supplied_dob text := private_signup ->> 'date_of_birth';
    supplied_policy_version text := private_signup ->> 'policy_version';
begin
    if private_signup is null then
        raise exception 'Valid private member details are required' using errcode = '22023';
    end if;

    insert into private.member_accounts (user_id, full_name, date_of_birth, email)
    values (new.id, supplied_name, supplied_dob::date, lower(new.email));

    insert into private.policy_acceptances (user_id, policy_version)
    values (new.id, supplied_policy_version);

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - '_mathbhoot_private_signup'
    where id = new.id;
    return new;
end;
$$;

revoke execute on function private.capture_member_account() from public, anon, authenticated;

create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if auth.uid() is null then
        raise exception 'Authentication required' using errcode = '28000';
    end if;

    insert into private.account_deletion_requests (user_id)
    values (auth.uid())
    on conflict (user_id) do update
    set requested_at = now(), status = 'requested', completed_at = null;
end;
$$;

revoke execute on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
