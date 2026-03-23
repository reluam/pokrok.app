-- Oprava: age je již text, jen updatujeme constraint a trigger

alter table public.profiles drop constraint if exists profiles_age_check;

alter table public.profiles
  add constraint profiles_age_check
  check (age in ('', '0–18', '19–30', '31–45', '46–60', '60+'));

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, age, gender)
  values (new.id, '', '', 'other');
  return new;
end;
$$ language plpgsql security definer;
