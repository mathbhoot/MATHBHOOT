create or replace function private.prepare_member_account()
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

    if supplied_dob::date not between date '1900-01-01' and current_date then
        raise exception 'Valid date of birth is required' using errcode = '22023';
    end if;

    new.raw_app_meta_data := jsonb_set(
        coalesce(new.raw_app_meta_data, '{}'::jsonb),
        '{_mathbhoot_private_signup}',
        jsonb_build_object(
            'full_name', supplied_name,
            'date_of_birth', supplied_dob
        ),
        true
    );
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb)
        - 'full_name'
        - 'date_of_birth';

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
begin
    if private_signup is null
       or supplied_name is null
       or char_length(supplied_name) not between 2 and 80 then
        raise exception 'Valid private member details are required' using errcode = '22023';
    end if;

    if supplied_dob is null or supplied_dob !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'Valid private member details are required' using errcode = '22023';
    end if;

    if supplied_dob::date not between date '1900-01-01' and current_date then
        raise exception 'Valid private member details are required' using errcode = '22023';
    end if;

    insert into private.member_accounts (user_id, full_name, date_of_birth, email)
    values (new.id, supplied_name, supplied_dob::date, lower(new.email));

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
            - '_mathbhoot_private_signup'
    where id = new.id;

    return new;
end;
$$;

revoke execute on function private.capture_member_account() from public, anon, authenticated;

drop trigger if exists prepare_member_account_before_signup on auth.users;
create trigger prepare_member_account_before_signup
before insert on auth.users
for each row execute function private.prepare_member_account();

drop trigger if exists capture_member_account_after_signup on auth.users;
create trigger capture_member_account_after_signup
after insert on auth.users
for each row execute function private.capture_member_account();

update auth.users as account
set raw_user_meta_data = coalesce(account.raw_user_meta_data, '{}'::jsonb)
        - 'full_name'
        - 'date_of_birth',
    raw_app_meta_data = coalesce(account.raw_app_meta_data, '{}'::jsonb)
        - '_mathbhoot_private_signup'
where exists (
    select 1
    from private.member_accounts as private_account
    where private_account.user_id = account.id
);
