-- Re-clicks on the same profile also count toward the plan cap.

alter table public.contact_views
  drop constraint if exists contact_views_viewer_profile_id_viewed_profile_id_key;
