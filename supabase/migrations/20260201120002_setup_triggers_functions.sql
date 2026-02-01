-- =====================================================================
-- migration: setup_triggers_functions
-- description: creates database functions and triggers for automation
-- features: automatic updated_at timestamp, automatic profile creation
-- tables affected: profiles, decks, flashcards, auth.users
-- =====================================================================

-- =====================================================================
-- function: update_updated_at_column
-- description: automatically updates updated_at column to current timestamp
-- usage: attached as before update trigger on tables with updated_at column
-- =====================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  -- set updated_at to current timestamp whenever row is updated
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- add function comment for documentation
comment on function public.update_updated_at_column() is 
  'trigger function to automatically update updated_at column on row updates';

-- =====================================================================
-- trigger: update_profiles_updated_at
-- description: updates profiles.updated_at on every update
-- =====================================================================
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

-- =====================================================================
-- trigger: update_decks_updated_at
-- description: updates decks.updated_at on every update
-- =====================================================================
create trigger update_decks_updated_at
  before update on public.decks
  for each row
  execute function public.update_updated_at_column();

-- =====================================================================
-- trigger: update_flashcards_updated_at
-- description: updates flashcards.updated_at on every update
-- note: fires on all updates including sm-2 algorithm adjustments
-- =====================================================================
create trigger update_flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();

-- =====================================================================
-- function: handle_new_user
-- description: automatically creates profile when new user signs up
-- usage: attached as after insert trigger on auth.users
-- security: uses security definer to bypass rls during profile creation
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- create profile entry for new user
  -- this ensures every user in auth.users has corresponding profile
  insert into public.profiles (id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- add function comment for documentation
comment on function public.handle_new_user() is 
  'trigger function to automatically create profile on user signup';

-- =====================================================================
-- trigger: on_auth_user_created
-- description: creates profile when user signs up via supabase auth
-- note: security definer allows trigger to bypass rls policies
-- =====================================================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
