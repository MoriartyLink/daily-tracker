import type { DailyEntry, UserProfile, Project } from "./index";

export interface VaultSearchResult {
  type: "journal" | "project" | "profile";
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

  // Profile
  loadProfile: () => Promise<UserProfile>;
  saveProfile: (profile: UserProfile) => Promise<boolean>;

  // Projects
  loadAllProjects: () => Promise<Project[]>;
  saveProject: (project: Project) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;

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
