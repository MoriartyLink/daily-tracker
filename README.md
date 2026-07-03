# Daily Tracker

A local-first desktop app for daily journaling, task tracking, project management, and personal insights — all stored as plain `.md` files in a local vault.

> **Your data is yours.** Every entry is a markdown file on your disk. Open them in Obsidian, VS Code, or any text editor.

## Features

- **Journal** — Daily entries with tasks, mood tracking (mental/physical), and reflections
- **Projects** — Kanban boards with milestones, cards, priorities, and tags
- **Insights** — Weekly/monthly charts for mood trends, task completion, and productivity
- **Profile** — Personal goals with progress tracking and fun facts
- **Local Vault** — All data stored as `.md` files with YAML frontmatter (Obsidian-compatible)
- **Vault Picker** — Choose any directory as your vault, switch between vaults
- **Backup** — Export/import full vault as JSON
- **Offline** — No internet required, everything runs locally

## Tech Stack

- **Desktop:** Electron
- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS v4
- **Charts:** Recharts
- **Storage:** Local filesystem (`.md` files with YAML frontmatter)
- **Build:** electron-builder (AppImage, .deb, .dmg, NSIS)
- **Testing:** Vitest + React Testing Library

## Vault Structure

```
~/DailyTracker/                   ← Default vault (configurable)
├── journal/
│   ├── 2026-07-01.md             ← Daily entries
│   ├── 2026-07-02.md
│   └── 2026-07-03.md
├── projects/
│   ├── project-abc123.md         ← Kanban project data
│   └── project-def456.md
└── profile.md                    ← User profile, goals, facts
```

Each `.md` file uses YAML frontmatter for structured data and a markdown body for freeform content. Files are human-readable and can be edited in any markdown editor.

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/MoriartyLink/daily-tracker.git
cd daily-tracker
npm install
```

### 2. Run in development mode

```bash
# Run Electron + Vite dev server together
npm run dev:electron
```

This starts Vite on `http://localhost:5173` and opens the Electron window pointed at it.

> **Browser-only dev:** Run `npm run dev` to work in the browser with localStorage fallback (no Electron features).

### 3. Run tests

```bash
npm test
```

### 4. Build for distribution

```bash
npm run build:electron
```

Output goes to `release/` — produces platform-specific packages:
- **Linux:** AppImage + `.deb`
- **macOS:** `.dmg`
- **Windows:** NSIS installer

## Architecture

```
electron/
  main.cjs             # Electron main process — vault I/O, IPC handlers, window management
  preload.cjs          # Context bridge — exposes electronAPI to renderer

src/
  components/          # Reusable UI components (shadcn/ui)
  contexts/            # React contexts
    DataContext.tsx     # Central data layer — Electron IPC ↔ localStorage fallback
    SidebarContext.tsx  # Sidebar collapse state
  hooks/               # Custom hooks
  lib/                 # Utilities (cn helper)
  pages/               # Route pages (Journal, Insights, Projects, Profile)
  types/               # TypeScript interfaces + ElectronAPI type

data/                  # Local development vault (gitignored)
```

### Data Flow

```
[React UI] ←→ [DataContext] ←→ [electronAPI (preload)] ←→ [IPC] ←→ [main.cjs] ←→ [Filesystem .md]
```

- **In Electron:** Data flows through IPC to the main process which reads/writes `.md` files
- **In browser:** Falls back to `localStorage` for development convenience

### IPC Channels

| Channel | Direction | Description |
|---------|-----------|-------------|
| `vault:getPath` | main → renderer | Get current vault path |
| `vault:changePath` | renderer → main | Open folder picker, switch vault |
| `vault:openInExplorer` | renderer → main | Open vault folder in file manager |
| `entries:loadAll` | main → renderer | Load all journal entries |
| `entries:save` | renderer → main | Save a journal entry |
| `profile:load` | main → renderer | Load user profile |
| `profile:save` | renderer → main | Save user profile |
| `projects:loadAll` | main → renderer | Load all projects |
| `projects:save` | renderer → main | Save a project |
| `projects:delete` | renderer → main | Delete a project file |
| `data:exportBackup` | renderer → main | Export full vault as JSON |
| `data:importBackup` | renderer → main | Import JSON backup into vault |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Search vault (planned) |
| `Ctrl+,` | Open settings/profile (planned) |

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Dev commands

```bash
npm run dev           # Vite only (browser mode)
npm run dev:electron  # Vite + Electron (full desktop mode)
npm run build         # Build frontend
npm run build:electron # Build frontend + package Electron app
npm run test          # Run tests
npm run lint          # Lint with oxlint
```

## License

MIT
