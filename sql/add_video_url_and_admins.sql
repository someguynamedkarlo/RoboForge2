-- Dodaj video_url stupac u projects tablicu
alter table public.projects
  add column if not exists video_url text default null;

-- Za postavljanje admina (profiles tablica već ima role stupac):
-- update public.profiles set role = 'admin' where id = '<user-uuid-here>';
