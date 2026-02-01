# AI Flashcards

An intelligent web application for creating and studying educational flashcards powered by AI. Transform your learning materials into high-quality flashcards in seconds using Google Gemini, with full control over the final content.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AI Flashcards solves the time-consuming problem of manually creating high-quality educational flashcards. The application combines three key elements:

- **AI-Powered Generator**: Transform raw educational text into question-and-answer flashcards using Google Gemini AI
- **Manual Editor**: Create and modify flashcards with a simple, intuitive interface
- **Spaced Repetition System**: Learn effectively using the proven SM-2 algorithm

### Key Features

- 🤖 **AI Generation**: Convert 100-5000 characters of text into flashcards (~1 card per 250 characters)
- ✏️ **Review & Edit**: Review AI-generated flashcards before saving with inline editing
- 📚 **Deck Management**: Organize flashcards into decks (talias) by topic
- 🧠 **Smart Learning**: Spaced repetition algorithm optimizes review timing
- ⌨️ **Keyboard Shortcuts**: Efficient workflow with comprehensive keyboard support
- 🔒 **User Authentication**: Secure email/password authentication via Supabase
- 📊 **Learning Analytics**: Track your progress and retention

### Target Users

- Students studying new subjects
- Self-learners acquiring new knowledge
- Anyone wanting to efficiently absorb and retain information

## Tech Stack

### Frontend
- **Astro 5** - Static site generator with partial hydration
- **React 19** - UI components for interactive features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Accessible component library

### Backend
- **Supabase** - Backend-as-a-Service (authentication, database, real-time)

### AI
- **Google Gemini API** - AI-powered flashcard generation

## Getting Started Locally

### Prerequisites

- **Node.js**: v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm**: v9+ (comes with Node.js)
- **Supabase Account**: [Sign up](https://supabase.com) for free
- **Google Gemini API Key**: [Get API access](https://ai.google.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/10x-karcioszki.git
   cd 10x-karcioszki
   ```

2. **Install Node.js version**
   ```bash
   nvm install
   nvm use
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # Google Gemini
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Set up Supabase database**
   
   Run the SQL migrations in your Supabase project (migrations coming soon).

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:4321`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build production-ready static site |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Check code for linting errors |
| `npm run lint:fix` | Auto-fix linting errors |
| `npm run format` | Format code with Prettier |

## Project Scope

### ✅ Included in MVP

**User Management**
- Email/password authentication
- User data separation and security

**Deck Management**
- Create, edit, and delete decks
- View flashcard counts and pending reviews

**AI Flashcard Generation**
- Input text validation (100-5000 characters)
- Backend AI generation via Google Gemini
- Character counter with real-time feedback
- Configurable AI prompts

**Flashcard Review & Editing**
- Review all generated flashcards before saving
- Accept, edit, or reject individual flashcards
- Inline editing capabilities
- Keyboard shortcuts for efficient workflow
- Select target deck during review

**Manual Flashcard Management**
- Create flashcards manually
- Inline editing in deck view
- Auto-save functionality
- Delete individual flashcards

**Learning System**
- Spaced repetition algorithm (SM-2)
- Study sessions per deck
- Difficulty ratings (Again, Hard, Good, Easy)
- Progress tracking and session summaries
- Learning history per flashcard

**Keyboard Shortcuts**
- Learning session: Space (reveal), 1-4 (rate difficulty)
- Review mode: Enter (accept), E (edit), Delete (reject), Tab (next)
- Help: ? (show all shortcuts)

**Security & Validation**
- Zod schema validation
- Rate limiting on AI endpoints
- Environment variable protection
- XSS and SQL injection prevention

**Analytics**
- Track flashcard source (AI vs manual)
- Log review actions (accept/edit/reject)
- Timestamp tracking for creation and edits

### ❌ Not Included in MVP

- Advanced spaced repetition algorithms (SuperMemo, Anki-level)
- File import (PDF, DOCX, PPT)
- Flashcard sharing between users
- Public flashcard libraries
- Educational platform integrations
- Native mobile apps (iOS, Android)
- Rich media support (images, audio, video)
- Text formatting (bold, italic, highlights)
- Advanced flashcard types (cloze deletion, multiple choice)
- Gamification features
- Team collaboration
- Export to Anki or other platforms
- Offline mode
- Advanced statistics and charts
- Usage limits and payment systems
- Tags and advanced categorization
- Full-text search
- Nested decks
- Public API
- Multi-language interface

### Technical Limitations

- Text input: 100-5000 characters
- Flashcard format: Plain text only
- Organization: 2-level structure (Decks → Flashcards)
- Each flashcard belongs to one deck only
- AI Provider: Google Gemini only
- Platform: Web only (no native apps)

## Project Status

🚧 **In Active Development** - MVP Phase

### Current Progress

- [x] Project setup and tech stack configuration
- [ ] User authentication system
- [ ] Deck management
- [ ] AI flashcard generation
- [ ] Flashcard review interface
- [ ] Manual flashcard CRUD
- [ ] Spaced repetition algorithm
- [ ] Learning session interface
- [ ] Keyboard shortcuts
- [ ] Analytics and tracking

### Success Metrics (MVP Goals)

- **AI Acceptance Rate**: ≥75% of generated flashcards accepted or edited
- **AI Usage Rate**: ≥75% of flashcards created using AI
- **7-day Retention**: ≥40% of users return within 7 days

## License

MIT License - see [LICENSE](LICENSE) file for details

---

**Built with ❤️ for efficient learning**
