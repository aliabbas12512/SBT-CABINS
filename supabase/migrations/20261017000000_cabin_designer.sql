-- SBT CABINS — cabin designer and quotation requests.
--
-- Security model: Row Level Security is ON for every table and there are no
-- table policies, so nothing can be read or written directly. The website's
-- server calls the SECURITY DEFINER functions below with the project's
-- anon/publishable key (kept server-side). Admin functions require a session
-- token obtained with the admin password; only a hash of the token is stored.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.designer_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.design_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  access_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lang text not null default 'en' check (lang in ('en', 'ar')),
  customer jsonb not null default '{}'::jsonb,
  design jsonb not null,
  estimate jsonb not null default '{}'::jsonb,
  service text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'quoted', 'approved', 'rejected', 'closed')),
  admin_notes text,
  approved jsonb,
  approved_at timestamptz
);
create index if not exists design_requests_created_idx on public.design_requests (created_at desc);

create table if not exists public.admin_auth (
  id int primary key default 1 check (id = 1),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

create table if not exists public.admin_login_attempts (
  at timestamptz not null default now(),
  ok boolean not null
);

alter table public.designer_settings enable row level security;
alter table public.design_requests enable row level security;
alter table public.admin_auth enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_login_attempts enable row level security;
revoke all on public.designer_settings, public.design_requests, public.admin_auth, public.admin_sessions, public.admin_login_attempts from anon, authenticated;

insert into public.designer_settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Public functions
-- ------------------------------------------------------------------

create or replace function public.designer_get_settings()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(data, '{}'::jsonb) || jsonb_build_object('updatedAt', updated_at) from designer_settings where id = 1;
$$;

create or replace function public.designer_submit(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ref text;
  v_key text;
  v_recent int;
begin
  if p is null or octet_length(p::text) > 60000 then raise exception 'invalid_payload'; end if;
  if jsonb_typeof(p->'design') <> 'object' or jsonb_typeof(p->'customer') <> 'object' then raise exception 'invalid_payload'; end if;
  if coalesce(length(trim(p->'customer'->>'name')), 0) = 0 or coalesce(length(trim(p->'customer'->>'phone')), 0) = 0 then raise exception 'missing_contact'; end if;
  select count(*) into v_recent from design_requests where created_at > now() - interval '1 minute';
  if v_recent >= 20 then raise exception 'rate_limited'; end if;
  v_ref := 'SBT-D-' || to_char(now() at time zone 'Asia/Riyadh', 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
  v_key := encode(gen_random_bytes(16), 'hex');
  insert into design_requests (ref, access_key, lang, customer, design, estimate, service)
  values (
    v_ref, v_key,
    case when p->>'lang' = 'ar' then 'ar' else 'en' end,
    p->'customer', p->'design', coalesce(p->'estimate', '{}'::jsonb),
    case when p->>'service' in ('delivery', 'installation', 'both', 'none') then p->>'service' else null end
  );
  return jsonb_build_object('ref', v_ref, 'key', v_key);
end $$;

create or replace function public.designer_get_request(p_ref text, p_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ref', ref, 'createdAt', created_at, 'lang', lang, 'customer', customer, 'design', design,
    'estimate', estimate, 'service', service, 'status', status, 'approved', approved, 'approvedAt', approved_at)
  from design_requests where ref = p_ref and access_key = p_key;
$$;

-- ------------------------------------------------------------------
-- Admin
-- ------------------------------------------------------------------

create or replace function public.admin_session_ok(p_token text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from admin_sessions where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now());
$$;

create or replace function public.admin_login(p_password text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_hash text;
  v_fails int;
  v_token text;
begin
  select count(*) into v_fails from admin_login_attempts where not ok and at > now() - interval '15 minutes';
  if v_fails >= 8 then raise exception 'locked'; end if;
  select password_hash into v_hash from admin_auth where id = 1;
  if v_hash is null then raise exception 'not_configured'; end if;
  if crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    -- Return (not raise) so the failed attempt is committed and counts towards the lockout.
    insert into admin_login_attempts (ok) values (false);
    return null;
  end if;
  insert into admin_login_attempts (ok) values (true);
  delete from admin_sessions where expires_at < now();
  delete from admin_login_attempts where at < now() - interval '1 day';
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into admin_sessions (token_hash, expires_at) values (encode(digest(v_token, 'sha256'), 'hex'), now() + interval '12 hours');
  return v_token;
end $$;

create or replace function public.admin_logout(p_token text)
returns void language sql security definer set search_path = public, extensions as $$
  delete from admin_sessions where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

create or replace function public.admin_save_settings(p_token text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not admin_session_ok(p_token) then raise exception 'unauthorized'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 200000 then raise exception 'invalid_payload'; end if;
  update designer_settings set data = p_data - 'updatedAt', updated_at = now() where id = 1;
  return designer_get_settings();
end $$;

create or replace function public.admin_list_requests(p_token text, p_limit int default 200)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_session_ok(p_token) then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(x order by (x->>'createdAt') desc) from (
      select jsonb_build_object(
        'ref', ref, 'key', access_key, 'createdAt', created_at, 'updatedAt', updated_at, 'lang', lang,
        'customer', customer, 'design', design, 'estimate', estimate, 'service', service, 'status', status,
        'adminNotes', admin_notes, 'approved', approved, 'approvedAt', approved_at) as x
      from design_requests order by created_at desc limit least(greatest(coalesce(p_limit, 200), 1), 1000)
    ) s), '[]'::jsonb);
end $$;

create or replace function public.admin_update_request(p_token text, p_ref text, p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not admin_session_ok(p_token) then raise exception 'unauthorized'; end if;
  update design_requests set
    status = case when p_patch ? 'status' and p_patch->>'status' in ('new', 'reviewing', 'quoted', 'approved', 'rejected', 'closed') then p_patch->>'status' else status end,
    admin_notes = case when p_patch ? 'adminNotes' then left(p_patch->>'adminNotes', 4000) else admin_notes end,
    approved = case when p_patch ? 'approved' then nullif(p_patch->'approved', 'null'::jsonb) else approved end,
    approved_at = case when p_patch ? 'approved' then (case when p_patch->'approved' = 'null'::jsonb then null else now() end) else approved_at end,
    updated_at = now()
  where ref = p_ref;
  if not found then raise exception 'not_found'; end if;
end $$;

create or replace function public.admin_change_password(p_token text, p_old text, p_new text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  if not admin_session_ok(p_token) then raise exception 'unauthorized'; end if;
  if length(coalesce(p_new, '')) < 10 then raise exception 'weak_password'; end if;
  select password_hash into v_hash from admin_auth where id = 1;
  if crypt(coalesce(p_old, ''), v_hash) <> v_hash then raise exception 'invalid_password'; end if;
  update admin_auth set password_hash = crypt(p_new, gen_salt('bf', 10)), updated_at = now() where id = 1;
  delete from admin_sessions;
end $$;

-- Owner-only: set the admin password from the Supabase SQL editor.
--   select public.admin_set_password('your-strong-password');
create or replace function public.admin_set_password(p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if length(coalesce(p_password, '')) < 10 then raise exception 'weak_password'; end if;
  insert into admin_auth (id, password_hash) values (1, crypt(p_password, gen_salt('bf', 10)))
  on conflict (id) do update set password_hash = excluded.password_hash, updated_at = now();
  delete from admin_sessions;
end $$;

revoke all on function public.designer_get_settings(), public.designer_submit(jsonb), public.designer_get_request(text, text),
  public.admin_session_ok(text), public.admin_login(text), public.admin_logout(text), public.admin_save_settings(text, jsonb),
  public.admin_list_requests(text, int), public.admin_update_request(text, text, jsonb), public.admin_change_password(text, text, text),
  public.admin_set_password(text) from public, anon, authenticated;

grant execute on function public.designer_get_settings(), public.designer_submit(jsonb), public.designer_get_request(text, text),
  public.admin_login(text), public.admin_logout(text), public.admin_save_settings(text, jsonb),
  public.admin_list_requests(text, int), public.admin_update_request(text, text, jsonb), public.admin_change_password(text, text, text)
  to anon;
