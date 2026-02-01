-- =====================================================================
-- migration: setup_rls_policies
-- description: creates row level security policies for all tables
-- tables affected: profiles, decks, flashcards, review_sessions,
--                  review_history, ai_generation_logs, ai_review_actions
-- notes: granular policies for each operation (select, insert, update, delete)
--        and each role (anon, authenticated). policies ensure users can only
--        access their own data using auth.uid() function.
-- =====================================================================

-- =====================================================================
-- rls policies: profiles
-- access pattern: users can only access their own profile
-- =====================================================================

-- policy: authenticated users can select their own profile
create policy "authenticated users can select own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- policy: authenticated users can insert their own profile
-- note: typically handled by trigger, but policy allows manual creation if needed
create policy "authenticated users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- policy: authenticated users can update their own profile
create policy "authenticated users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- policy: authenticated users can delete their own profile
-- note: cascade deletes will handle related data
create policy "authenticated users can delete own profile"
  on public.profiles
  for delete
  to authenticated
  using (id = auth.uid());

-- =====================================================================
-- rls policies: decks
-- access pattern: users can only access decks they own
-- =====================================================================

-- policy: authenticated users can select their own decks
create policy "authenticated users can select own decks"
  on public.decks
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own decks
create policy "authenticated users can insert own decks"
  on public.decks
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can update their own decks
create policy "authenticated users can update own decks"
  on public.decks
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own decks
-- note: cascade will delete associated flashcards
create policy "authenticated users can delete own decks"
  on public.decks
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- rls policies: flashcards
-- access pattern: users can only access flashcards they own
-- =====================================================================

-- policy: authenticated users can select their own flashcards
create policy "authenticated users can select own flashcards"
  on public.flashcards
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own flashcards
create policy "authenticated users can insert own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can update their own flashcards
-- note: includes sm-2 algorithm updates (easiness_factor, interval, etc.)
create policy "authenticated users can update own flashcards"
  on public.flashcards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own flashcards
create policy "authenticated users can delete own flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- rls policies: review_sessions
-- access pattern: users can only access their own review sessions
-- =====================================================================

-- policy: authenticated users can select their own review sessions
create policy "authenticated users can select own review sessions"
  on public.review_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own review sessions
create policy "authenticated users can insert own review sessions"
  on public.review_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can update their own review sessions
-- note: allows updating ended_at and cards_reviewed during session
create policy "authenticated users can update own review sessions"
  on public.review_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own review sessions
create policy "authenticated users can delete own review sessions"
  on public.review_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- rls policies: review_history
-- access pattern: users can only access their own review history
-- =====================================================================

-- policy: authenticated users can select their own review history
create policy "authenticated users can select own review history"
  on public.review_history
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own review history
create policy "authenticated users can insert own review history"
  on public.review_history
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can update their own review history
-- note: updates are rare but allowed for corrections
create policy "authenticated users can update own review history"
  on public.review_history
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own review history
create policy "authenticated users can delete own review history"
  on public.review_history
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- rls policies: ai_generation_logs
-- access pattern: users can only access their own ai generation logs
-- =====================================================================

-- policy: authenticated users can select their own ai generation logs
create policy "authenticated users can select own ai generation logs"
  on public.ai_generation_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own ai generation logs
create policy "authenticated users can insert own ai generation logs"
  on public.ai_generation_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can update their own ai generation logs
-- note: updates are rare but allowed for corrections
create policy "authenticated users can update own ai generation logs"
  on public.ai_generation_logs
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own ai generation logs
create policy "authenticated users can delete own ai generation logs"
  on public.ai_generation_logs
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- rls policies: ai_review_actions
-- access pattern: users can only access their own ai review actions
-- =====================================================================

-- policy: authenticated users can select their own ai review actions
create policy "authenticated users can select own ai review actions"
  on public.ai_review_actions
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: authenticated users can insert their own ai review actions
create policy "authenticated users can insert own ai review actions"
  on public.ai_review_actions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: authenticated users can update their own ai review actions
-- note: allows corrections to action_type or edited fields
create policy "authenticated users can update own ai review actions"
  on public.ai_review_actions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: authenticated users can delete their own ai review actions
create policy "authenticated users can delete own ai review actions"
  on public.ai_review_actions
  for delete
  to authenticated
  using (user_id = auth.uid());
