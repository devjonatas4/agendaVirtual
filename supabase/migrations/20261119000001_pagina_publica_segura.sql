drop policy if exists "Anyone reads public profile" on public.public_profile;

create policy "Anyone reads the published link page" on public.public_profile
  for select to anon, authenticated
  using (id = 1);

revoke select on public.public_profile from anon;
grant select (id, artist_name, tagline, whatsapp, booking_message, instagram, youtube, spotify)
  on public.public_profile to anon;