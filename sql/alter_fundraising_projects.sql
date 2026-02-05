alter table public.fundraising_projects
  add column if not exists payment_info text not null default '',
  add column if not exists image_urls text[] default '{}',
  alter column donation_link drop not null;
