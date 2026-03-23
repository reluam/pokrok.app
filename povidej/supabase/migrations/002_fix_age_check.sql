-- Oprava: trigger handle_new_user vkládá age = 0, ale constraint vyžadoval age > 0
-- Změna na age >= 0, aby placeholder před onboardingem prošel

alter table public.profiles
  drop constraint profiles_age_check;

alter table public.profiles
  add constraint profiles_age_check check (age >= 0 and age < 130);
