# Daily Tracker

Local-first desktop app for daily journaling, task tracking, projects, and insights. All data stored as plain `.md` files.

## Features

- **Journal** — Daily entries with tasks, physical status, and mental reflection prompts
- **Projects** — Kanban boards with milestones, priorities, and tags
- **Insights** — Weekly and monthly charts for reflection depth, task completion, and physical health
- **Meeting** — Meeting management with agenda, minutes, transcription, and participants
- **People** — Contact management with relationships, goals, and a brainstorming whiteboard
- **Backlog** — Brain dump compiler with Cynefin framework classification
- **Search** — Full-text search across journals, projects, and profile
- **Profile** — Personal info, facts, and data management (import/export)
- **Local Vault** — All data stored as `.md` files with YAML frontmatter, compatible with Obsidian

## Tech Stack

- **Desktop:** Electron
- **Frontend:** React 19 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS v4
- **Charts:** Recharts
- **Storage:** Local filesystem (`.md` files with YAML frontmatter)
- **Build:** electron-builder (AppImage, .deb, .dmg, NSIS)
- **Testing:** Vitest + React Testing Library

## Quick Start

```bash
# Install
git clone https://github.com/MoriartyLink/daily-tracker.git
cd daily-tracker
npm install

# Development (browser mode with localStorage fallback)
npm run dev

# Development (Electron desktop mode)
npm run dev:electron

# Tests
npm test

# Build for distribution
npm run build:electron
```

## Vault Structure

```
vault/
├── journal/
│   ├── YYYY-MM-DD.md    # Daily entries
├── projects/
│   ├── project-id.md    # Kanban project data
└── profile.md           # User profile, facts
```

Each `.md` file uses YAML frontmatter for structured data and a markdown body for freeform content. Files are human-readable and editable in any text editor.

## Data Flow

```
[React UI] → [DataContext] → [electronAPI] → [IPC] → [main process] → [filesystem .md]
```

- **Electron mode:** Data flows through IPC to the main process which reads/writes `.md` files.
- **Browser mode:** Falls back to `localStorage` for development.

## Architecture

```
electron/
  main.cjs            # Electron main process — vault I/O, IPC, window management
  preload.cjs         # Context bridge — exposes electronAPI to renderer

src/
  components/ui/      # shadcn/ui components
  contexts/
    DataContext.tsx    # Central state — Electron IPC + localStorage fallback
    SidebarContext.tsx # Sidebar collapse state
  pages/
    JournalPage.tsx    # Daily journal entries
    BacklogPage.tsx    # Brain dump with Cynefin classification
    MeetingPage.tsx    # Meeting management
    PeoplePage.tsx     # People relationships and whiteboard
    ProjectPage.tsx    # Kanban project boards
    InsightsPage.tsx   # Weekly/monthly charts
    ProfilePage.tsx    # Profile, facts, data management
    SearchPage.tsx     # Vault-wide search
  types/               # TypeScript interfaces
```

## License

MIT
