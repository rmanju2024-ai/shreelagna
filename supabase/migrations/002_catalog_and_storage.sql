-- Catalog, Google email verification, storage for photos.
-- Run in Supabase SQL editor after 001_init.sql.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email, display_name, last_login_at, email_otp_verified_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    now(),
    new.email_confirmed_at
  )
  on conflict (id) do update
    set last_login_at = now(),
        email_otp_verified_at = coalesce(public.app_users.email_otp_verified_at, excluded.email_otp_verified_at);
  return new;
end;
$$;

insert into public.communities (religion_id, native_state, slug, name)
select r.id, v.native_state, v.slug, v.name
from public.religions r
join (
  values
    ('hindu', 'Karnataka', 'vokkaliga', 'Vokkaliga'),
    ('hindu', 'Karnataka', 'lingayat', 'Lingayat'),
    ('hindu', 'Karnataka', 'smartha-brahmin', 'Smartha Brahmin'),
    ('hindu', 'Karnataka', 'iyengar-ka', 'Iyengar'),
    ('hindu', 'Karnataka', 'bunt', 'Bunt'),
    ('hindu', 'Tamil Nadu', 'iyer', 'Iyer'),
    ('hindu', 'Tamil Nadu', 'iyengar-tn', 'Iyengar'),
    ('hindu', 'Tamil Nadu', 'mudaliar', 'Mudaliar'),
    ('hindu', 'Tamil Nadu', 'chettiar', 'Chettiar'),
    ('hindu', 'Tamil Nadu', 'gounder', 'Gounder'),
    ('hindu', 'Tamil Nadu', 'nadar', 'Nadar'),
    ('hindu', 'Kerala', 'nair', 'Nair'),
    ('hindu', 'Kerala', 'ezhava', 'Ezhava'),
    ('hindu', 'Kerala', 'namboothiri', 'Namboothiri'),
    ('hindu', 'Andhra Pradesh', 'reddy', 'Reddy'),
    ('hindu', 'Andhra Pradesh', 'kamma', 'Kamma'),
    ('hindu', 'Andhra Pradesh', 'kapu', 'Kapu'),
    ('hindu', 'Telangana', 'velama', 'Velama'),
    ('hindu', 'Other', 'other-hindu', 'Other Hindu'),
    ('jain', 'Other', 'jain', 'Jain'),
    ('christian', 'Kerala', 'syrian-christian', 'Syrian Christian'),
    ('christian', 'Other', 'christian', 'Christian'),
    ('muslim', 'Other', 'muslim', 'Muslim'),
    ('sikh', 'Other', 'sikh', 'Sikh'),
    ('buddhist', 'Other', 'buddhist', 'Buddhist'),
    ('other', 'Other', 'prefer-described', 'Other community')
) as v(religion_slug, native_state, slug, name)
  on r.slug = v.religion_slug
on conflict (religion_id, slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do nothing;

drop policy if exists profile_media_public_read on storage.objects;
create policy profile_media_public_read
  on storage.objects for select
  using (bucket_id = 'profile-media');

drop policy if exists profile_media_auth_insert on storage.objects;
create policy profile_media_auth_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists profile_media_auth_delete on storage.objects;
create policy profile_media_auth_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
