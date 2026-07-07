# Daily Tracker

Local-first desktop app for daily journaling, task tracking, projects, and insights. All data stored as plain `.md` files.

## Features

- **Journal** — Daily entries with tasks, physical status, and mental reflection prompts
- **Projects** — Kanban boards with milestones, priorities, tags, and a 24h auto-archive of completed cards into History
- **Meeting** — Meeting management with agenda, minutes, transcription, and participants
- **People** — Contact management with relationships, goals, and a brainstorming whiteboard
- **Search** — Full-text search across journals, projects, meetings, and people
- **History** — Timeline of completed tasks and milestones across all projects
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
├── meetings/
│   ├── meeting-id.md    # Meeting data
├── people/
│   ├── person-id.md     # People data
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
    MeetingPage.tsx    # Meeting management
    PeoplePage.tsx     # People relationships and whiteboard
    ProjectPage.tsx    # Kanban project boards
    SearchPage.tsx     # Vault-wide search
    HistoryPage.tsx    # Completed tasks & milestones timeline
  types/               # TypeScript interfaces
```

## Building & Packaging

```bash
npm run build:electron   # tsc + vite build, then electron-builder (AppImage + deb on Linux)
```

- The packaged app needs the Vite output in `dist/`. Because `dist` is listed in `.gitignore`, `electron-builder.yml` explicitly lists it under `files:` — otherwise the renderer loads a blank window (no `index.html`).
- The `.deb` target requires an `author` email in `package.json` (used as the package maintainer).
- **Linux / Manjaro (GNOME/Wayland):** Electron can hit a `GTK 2/3 symbols detected … GTK 4` crash. Launch with `GDK_BACKEND=x11` and the `--gtk-version=3` flag (already set in the installed `.desktop` entry).

## License

MIT
