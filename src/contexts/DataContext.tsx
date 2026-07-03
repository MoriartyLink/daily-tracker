import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { DailyEntry, UserProfile, Project } from "@/types";
import "@/types/electron";

// ── Types ──
interface DataContextType {
  // Entries
  entries: Record<string, DailyEntry>;
  updateEntry: (date: string, entry: DailyEntry) => void;
  // Profile
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  // Projects
  projects: Project[];
  setProjects: (fn: Project[] | ((prev: Project[]) => Project[])) => void;
  // Status
  loading: boolean;
  // Vault
  vaultPath: string;
  changeVault: () => Promise<void>;
  openVault: () => void;
  // Backup
  exportBackup: () => Promise<boolean>;
  importBackup: () => Promise<boolean>;
}

const defaultProfile: UserProfile = { name: "", email: "", avatar: "", goals: [], facts: [] };

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}

// ── Check if running in Electron ──
function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

// ── localStorage helpers (fallback for browser dev) ──
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }

// ── Provider ──
export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultPath, setVaultPath] = useState("");

  // Load all data (used on mount and on vault:changed events)
  const loadAllData = useCallback(async () => {
    if (isElectron()) {
      try {
        const api = window.electronAPI!;
        const [loadedEntries, loadedProfile, loadedProjects, path] = await Promise.all([
          api.loadAllEntries(),
          api.loadProfile(),
          api.loadAllProjects(),
          api.getVaultPath(),
        ]);
        setEntries(loadedEntries || {});
        setProfile(loadedProfile || defaultProfile);
        setProjectsState(loadedProjects || []);
        setVaultPath(path || "");
      } catch (err) {
        console.error("Failed to load data from vault:", err);
      }
    } else {
      // Fallback to localStorage for browser dev
      setEntries(lsGet("daily-tracker-entries", {}));
      setProfile(lsGet("daily-tracker-profile", defaultProfile));
      setProjectsState(lsGet("daily-tracker-projects", []));
      setVaultPath("localStorage (browser mode)");
    }
    setLoading(false);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Listen for vault changes (file watcher) — reload all data
  useEffect(() => {
    if (!isElectron()) return;
    const cleanup = window.electronAPI!.onVaultChanged(() => {
      console.log("Vault changed externally, reloading...");
      loadAllData();
    });
    return cleanup;
  }, [loadAllData]);

  // ── Entry upsert ──
  const updateEntry = useCallback((date: string, entry: DailyEntry) => {
    setEntries((prev) => {
      const next = { ...prev, [date]: entry };
      if (isElectron()) {
        window.electronAPI!.saveEntry(date, entry).catch((err: unknown) =>
          console.error("Failed to save entry:", err)
        );
      } else {
        lsSet("daily-tracker-entries", next);
      }
      return next;
    });
  }, []);

  // ── Profile update ──
  const updateProfileFn = useCallback((p: UserProfile) => {
    setProfile(p);
    if (isElectron()) {
      window.electronAPI!.saveProfile(p).catch((err: unknown) =>
        console.error("Failed to save profile:", err)
      );
    } else {
      lsSet("daily-tracker-profile", p);
    }
  }, []);

  // ── Projects update ──
  const setProjects = useCallback((fn: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;

      if (isElectron()) {
        const api = window.electronAPI!;
        // Delete removed projects
        const nextIds = new Set(next.map((p) => p.id));
        for (const p of prev) {
          if (!nextIds.has(p.id)) {
            api.deleteProject(p.id).catch((err: unknown) =>
              console.error("Failed to delete project:", err)
            );
          }
        }
        // Save all current projects
        for (const project of next) {
          api.saveProject(project).catch((err: unknown) =>
            console.error("Failed to save project:", err)
          );
        }
      } else {
        lsSet("daily-tracker-projects", next);
      }

      return next;
    });
  }, []);

  // ── Vault management ──
  const changeVault = useCallback(async () => {
    if (!isElectron()) return;
    const newPath = await window.electronAPI!.changeVaultPath();
    if (newPath) {
      setVaultPath(newPath);
      setLoading(true);
      await loadAllData();
    }
  }, [loadAllData]);

  const openVault = useCallback(() => {
    if (isElectron()) {
      window.electronAPI!.openVaultInExplorer();
    }
  }, []);

  // ── Backup ──
  const exportBackup = useCallback(async () => {
    if (!isElectron()) return false;
    return await window.electronAPI!.exportBackup();
  }, []);

  const importBackup = useCallback(async () => {
    if (!isElectron()) return false;
    const result = await window.electronAPI!.importBackup();
    if (result) {
      await loadAllData();
    }
    return !!result;
  }, [loadAllData]);

  return (
    <DataContext.Provider value={{
      entries, updateEntry,
      profile, updateProfile: updateProfileFn,
      projects, setProjects,
      loading,
      vaultPath, changeVault, openVault,
      exportBackup, importBackup,
    }}>
      {children}
    </DataContext.Provider>
  );
}
