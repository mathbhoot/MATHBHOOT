create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.member_accounts (
    user_id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    date_of_birth date not null,
    email text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_accounts_name_length check (char_length(trim(full_name)) between 2 and 80),
    constraint member_accounts_dob_range check (date_of_birth between date '1900-01-01' and current_date),
    constraint member_accounts_email_length check (char_length(email) between 3 and 254)
);

revoke all on table private.member_accounts from public, anon, authenticated;
alter table private.member_accounts enable row level security;

create or replace function private.capture_member_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    supplied_name text := trim(new.raw_user_meta_data ->> 'full_name');
    supplied_dob text := new.raw_user_meta_data ->> 'date_of_birth';
begin
    if supplied_name is null or char_length(supplied_name) not between 2 and 80 then
        raise exception 'Valid member name is required' using errcode = '22023';
    end if;

    if supplied_dob is null or supplied_dob !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'Valid date of birth is required' using errcode = '22023';
    end if;

    insert into private.member_accounts (user_id, full_name, date_of_birth, email)
    values (new.id, supplied_name, supplied_dob::date, lower(new.email));

    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'full_name' - 'date_of_birth'
    where id = new.id;

    return new;
end;
$$;

revoke execute on function private.capture_member_account() from public, anon, authenticated;

drop trigger if exists capture_member_account_after_signup on auth.users;
create trigger capture_member_account_after_signup
after insert on auth.users
for each row execute function private.capture_member_account();

create or replace function private.sync_member_account_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update private.member_accounts
    set email = lower(new.email), updated_at = now()
    where user_id = new.id;
    return new;
end;
$$;

revoke execute on function private.sync_member_account_email() from public, anon, authenticated;

drop trigger if exists sync_member_account_email_after_change on auth.users;
create trigger sync_member_account_email_after_change
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_member_account_email();
