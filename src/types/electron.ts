import type { DailyEntry, Project, Meeting, Person } from "./index";

export interface VaultSearchResult {
  type: "journal" | "project" | "meeting" | "person";
  id: string;
  title: string;
  snippet: string;
}

export interface ElectronAPI {
  // Vault
  getVaultPath: () => Promise<string>;
  changeVaultPath: () => Promise<string | null>;
  openVaultInExplorer: () => Promise<void>;

  // Journal entries
  loadAllEntries: () => Promise<Record<string, DailyEntry>>;
  saveEntry: (date: string, entry: DailyEntry) => Promise<boolean>;

  // Projects
  loadAllProjects: () => Promise<Project[]>;
  saveProject: (project: Project) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;

  // Meetings
  loadAllMeetings: () => Promise<Meeting[]>;
  saveMeeting: (meeting: Meeting) => Promise<boolean>;
  deleteMeeting: (meetingId: string) => Promise<boolean>;

  // People
  loadAllPeople: () => Promise<Person[]>;
  savePerson: (person: Person) => Promise<boolean>;
  deletePerson: (personId: string) => Promise<boolean>;

  // Search
  searchVault: (query: string) => Promise<VaultSearchResult[]>;

  // Data management
  exportBackup: () => Promise<boolean>;
  importBackup: () => Promise<boolean | null>;

  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // Event listeners (return cleanup function)
  onVaultChanged: (callback: () => void) => () => void;
  onMenuNewEntry: (callback: () => void) => () => void;
  onMenuChangeVault: (callback: () => void) => () => void;
  onMenuExportBackup: (callback: () => void) => () => void;
  onMenuImportBackup: (callback: () => void) => () => void;
  onMenuToggleSidebar: (callback: () => void) => () => void;
  onMenuNavigate: (callback: (path: string) => void) => () => void;

  // Platform info
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
