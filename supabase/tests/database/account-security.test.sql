begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select has_schema('private', 'private schema exists');
select has_table('private', 'member_accounts', 'private member accounts exist');
select has_table('private', 'policy_acceptances', 'private policy acceptances exist');
select has_table('private', 'account_deletion_requests', 'private deletion requests exist');

select ok(
    (select relrowsecurity
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'private' and c.relname = 'member_accounts'),
    'member accounts have RLS enabled'
);

select ok(
    (select relrowsecurity
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'recruitment_accounts'),
    'recruitment accounts have RLS enabled'
);

select ok(
    (select relrowsecurity
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'recruitment_submissions'),
    'recruitment submissions have RLS enabled'
);

select ok(
    not has_schema_privilege('anon', 'private', 'usage'),
    'anonymous users cannot use the private schema'
);

select ok(
    not has_schema_privilege('authenticated', 'private', 'usage'),
    'authenticated users cannot use the private schema directly'
);

select ok(
    not has_table_privilege('anon', 'private.member_accounts', 'select'),
    'anonymous users cannot read member accounts'
);

select ok(
    has_function_privilege('authenticated', 'public.request_account_deletion()', 'execute'),
    'authenticated users may request account deletion'
);

select ok(
    not has_function_privilege('anon', 'public.request_account_deletion()', 'execute'),
    'anonymous users cannot request account deletion'
);

select * from finish();
rollback;
