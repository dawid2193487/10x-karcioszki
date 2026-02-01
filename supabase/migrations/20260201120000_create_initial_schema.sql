-- =====================================================================
-- migration: create_initial_schema
-- description: creates all core tables for ai flashcards application
-- tables affected: profiles, decks, flashcards, review_sessions, 
--                  review_history, ai_generation_logs, ai_review_actions
-- notes: this migration creates the foundational schema with all
--        constraints, checks, and performance indexes. rls policies
--        are applied in a separate migration.
-- =====================================================================

-- =====================================================================
-- table: profiles
-- description: extended user data linked to supabase auth.users
-- relationship: one-to-one with auth.users
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on profiles table
-- policies will be defined in separate migration
alter table public.profiles enable row level security;

-- add table comment for documentation
comment on table public.profiles is 'extended user profiles linked to auth.users';
comment on column public.profiles.id is 'references auth.users(id), primary key';
comment on column public.profiles.created_at is 'account creation timestamp';
comment on column public.profiles.updated_at is 'last profile update timestamp';

-- =====================================================================
-- table: decks
-- description: flashcard decks owned by users
-- relationship: many-to-one with auth.users, one-to-many with flashcards
-- =====================================================================
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure deck name is between 1 and 100 characters
  constraint decks_name_length_check check (length(name) between 1 and 100)
);

-- enable row level security on decks table
alter table public.decks enable row level security;

-- add table and column comments
comment on table public.decks is 'flashcard decks belonging to users';
comment on column public.decks.id is 'unique deck identifier';
comment on column public.decks.user_id is 'owner of the deck';
comment on column public.decks.name is 'deck name (1-100 characters)';

-- index for listing user decks (dashboard queries)
create index idx_decks_user on public.decks(user_id);

-- =====================================================================
-- table: flashcards
-- description: flashcards belonging to decks with sm-2 algorithm fields
-- relationship: many-to-one with users and decks
-- sm-2 fields: easiness_factor, interval, repetitions, next_review_date
-- =====================================================================
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  front text not null,
  back text not null,
  source varchar(20) not null,
  next_review_date timestamptz default now(),
  easiness_factor decimal(3,2) default 2.5,
  interval integer default 0,
  repetitions integer default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure front and back are between 1 and 1000 characters
  constraint flashcards_front_length_check check (length(front) between 1 and 1000),
  constraint flashcards_back_length_check check (length(back) between 1 and 1000),
  
  -- ensure source is either 'ai' or 'manual'
  constraint flashcards_source_check check (source in ('ai', 'manual')),
  
  -- sm-2 algorithm constraints
  -- easiness factor must be between 1.3 and 2.5
  constraint flashcards_easiness_factor_check check (easiness_factor between 1.3 and 2.5),
  
  -- interval must be non-negative (days until next review)
  constraint flashcards_interval_check check (interval >= 0),
  
  -- repetitions must be non-negative
  constraint flashcards_repetitions_check check (repetitions >= 0)
);

-- enable row level security on flashcards table
alter table public.flashcards enable row level security;

-- add table and column comments
comment on table public.flashcards is 'flashcards with sm-2 spaced repetition algorithm fields';
comment on column public.flashcards.front is 'question/front side of card (1-1000 chars)';
comment on column public.flashcards.back is 'answer/back side of card (1-1000 chars)';
comment on column public.flashcards.source is 'creation source: ai or manual';
comment on column public.flashcards.easiness_factor is 'sm-2 easiness factor (1.3-2.5)';
comment on column public.flashcards.interval is 'days until next review';
comment on column public.flashcards.repetitions is 'consecutive correct reviews';
comment on column public.flashcards.next_review_date is 'next scheduled review date';
comment on column public.flashcards.last_reviewed_at is 'last review timestamp';

-- performance indexes for flashcards
-- index for finding cards due for review and listing by user/deck
-- note: cannot use partial index with now() as it's not immutable
create index idx_flashcards_next_review 
  on public.flashcards(user_id, deck_id, next_review_date);

-- index for listing cards in a deck
create index idx_flashcards_deck on public.flashcards(deck_id);

-- index for user's all flashcards queries
create index idx_flashcards_user on public.flashcards(user_id);

-- =====================================================================
-- table: review_sessions
-- description: study sessions for specific decks
-- relationship: many-to-one with users and decks
-- =====================================================================
create table if not exists public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  cards_reviewed integer default 0,
  created_at timestamptz not null default now(),
  
  -- ensure cards_reviewed is non-negative
  constraint review_sessions_cards_reviewed_check check (cards_reviewed >= 0),
  
  -- ensure ended_at is null or after started_at
  constraint review_sessions_ended_at_check check (ended_at is null or ended_at >= started_at)
);

-- enable row level security on review_sessions table
alter table public.review_sessions enable row level security;

-- add table and column comments
comment on table public.review_sessions is 'user study sessions for specific decks';
comment on column public.review_sessions.started_at is 'session start time';
comment on column public.review_sessions.ended_at is 'session end time (null until completed)';
comment on column public.review_sessions.cards_reviewed is 'number of cards reviewed in session';

-- index for listing user sessions by deck
create index idx_review_sessions_user_deck 
  on public.review_sessions(user_id, deck_id, started_at desc);

-- =====================================================================
-- table: review_history
-- description: individual flashcard reviews within study sessions
-- relationship: many-to-one with users, flashcards, and sessions
-- rating scale: 1=again, 2=hard, 3=good, 4=easy
-- =====================================================================
create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  session_id uuid references public.review_sessions(id) on delete set null,
  rating integer not null,
  response_time_ms integer,
  reviewed_at timestamptz not null default now(),
  
  -- ensure rating is between 1 and 4
  -- 1=again, 2=hard, 3=good, 4=easy
  constraint review_history_rating_check check (rating between 1 and 4),
  
  -- ensure response_time_ms is null or non-negative
  constraint review_history_response_time_check check (response_time_ms is null or response_time_ms >= 0)
);

-- enable row level security on review_history table
alter table public.review_history enable row level security;

-- add table and column comments
comment on table public.review_history is 'individual flashcard reviews within study sessions';
comment on column public.review_history.rating is 'difficulty rating: 1=again, 2=hard, 3=good, 4=easy';
comment on column public.review_history.response_time_ms is 'time taken to review in milliseconds';
comment on column public.review_history.reviewed_at is 'review timestamp';

-- performance indexes for review_history
-- index for analytics and user progress queries
create index idx_review_history_user_card 
  on public.review_history(user_id, flashcard_id, reviewed_at desc);

-- index for session-based queries
create index idx_review_history_session on public.review_history(session_id);

-- =====================================================================
-- table: ai_generation_logs
-- description: logs of ai flashcard generation for analytics and kpis
-- relationship: many-to-one with users
-- constraints: input must be 100-5000 characters per prd requirements
-- =====================================================================
create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  input_length integer not null,
  generated_count integer not null,
  created_at timestamptz not null default now(),
  
  -- enforce prd requirement: input text between 100-5000 characters
  constraint ai_generation_logs_input_length_check check (input_length between 100 and 5000),
  
  -- ensure generated_count is non-negative
  constraint ai_generation_logs_generated_count_check check (generated_count >= 0)
);

-- enable row level security on ai_generation_logs table
alter table public.ai_generation_logs enable row level security;

-- add table and column comments
comment on table public.ai_generation_logs is 'logs of ai flashcard generation for analytics';
comment on column public.ai_generation_logs.input_text is 'source text provided to ai';
comment on column public.ai_generation_logs.input_length is 'length of input in characters (100-5000)';
comment on column public.ai_generation_logs.generated_count is 'number of flashcards generated';

-- index for analytics queries
create index idx_ai_generation_logs_user 
  on public.ai_generation_logs(user_id, created_at desc);

-- =====================================================================
-- table: ai_review_actions
-- description: user actions during review of ai-generated flashcards
-- relationship: many-to-one with users, ai_generation_logs, and flashcards
-- action_types: accepted, edited, rejected
-- =====================================================================
create table if not exists public.ai_review_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_log_id uuid not null references public.ai_generation_logs(id) on delete cascade,
  flashcard_id uuid references public.flashcards(id) on delete set null,
  action_type varchar(20) not null,
  original_front text not null,
  original_back text not null,
  edited_front text,
  edited_back text,
  created_at timestamptz not null default now(),
  
  -- ensure action_type is one of: accepted, edited, rejected
  constraint ai_review_actions_action_type_check check (action_type in ('accepted', 'edited', 'rejected')),
  
  -- ensure edited fields are populated only when action_type is 'edited'
  -- and both must be non-null if action_type is 'edited'
  constraint ai_review_actions_edited_fields_check check (
    (action_type = 'edited' and edited_front is not null and edited_back is not null) or
    (action_type != 'edited' and edited_front is null and edited_back is null)
  )
);

-- enable row level security on ai_review_actions table
alter table public.ai_review_actions enable row level security;

-- add table and column comments
comment on table public.ai_review_actions is 'user actions during review of ai-generated flashcards';
comment on column public.ai_review_actions.action_type is 'user action: accepted, edited, or rejected';
comment on column public.ai_review_actions.original_front is 'original ai-generated front';
comment on column public.ai_review_actions.original_back is 'original ai-generated back';
comment on column public.ai_review_actions.edited_front is 'edited front (only if action_type=edited)';
comment on column public.ai_review_actions.edited_back is 'edited back (only if action_type=edited)';
comment on column public.ai_review_actions.flashcard_id is 'created flashcard (null if rejected)';

-- index for kpi calculations
create index idx_ai_review_actions_log 
  on public.ai_review_actions(generation_log_id);
