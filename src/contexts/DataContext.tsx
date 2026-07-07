import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { DailyEntry, Project, Meeting, Person } from "@/types";
import "@/types/electron";

interface DataContextType {
  entries: Record<string, DailyEntry>;
  updateEntry: (date: string, entry: DailyEntry) => void;
  projects: Project[];
  setProjects: (fn: Project[] | ((prev: Project[]) => Project[])) => void;
  meetings: Meeting[];
  setMeetings: (fn: Meeting[] | ((prev: Meeting[]) => Meeting[])) => void;
  people: Person[];
  setPeople: (fn: Person[] | ((prev: Person[]) => Person[])) => void;
  loading: boolean;
  vaultPath: string;
  changeVault: () => Promise<void>;
  openVault: () => void;
  exportBackup: () => Promise<boolean>;
  importBackup: () => Promise<boolean>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}

function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }

export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [meetings, setMeetingsState] = useState<Meeting[]>([]);
  const [people, setPeopleState] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultPath, setVaultPath] = useState("");

  const loadAllData = useCallback(async () => {
    if (isElectron()) {
      try {
        const api = window.electronAPI!;
        const [loadedEntries, loadedProjects, loadedMeetings, loadedPeople, path] = await Promise.all([
          api.loadAllEntries(),
          api.loadAllProjects(),
          api.loadAllMeetings(),
          api.loadAllPeople(),
          api.getVaultPath(),
        ]);
        setEntries(loadedEntries || {});
        setProjectsState(loadedProjects || []);
        setVaultPath(path || "");
        setMeetingsState(loadedMeetings || []);
        setPeopleState(loadedPeople || []);
      } catch (err) {
        console.error("Failed to load data from vault:", err);
      }
    } else {
      setEntries(lsGet("local-workspace-entries", {}));
      setProjectsState(lsGet("local-workspace-projects", []));
      setMeetingsState(lsGet("local-workspace-meetings", []));
      setPeopleState(lsGet("local-workspace-people", []));
      setVaultPath("localStorage (browser mode)");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  useEffect(() => {
    if (!isElectron()) return;
    const cleanup = window.electronAPI!.onVaultChanged(() => { loadAllData(); });
    return cleanup;
  }, [loadAllData]);

  const updateEntry = useCallback((date: string, entry: DailyEntry) => {
    setEntries((prev) => {
      const next = { ...prev, [date]: entry };
      if (isElectron()) {
        window.electronAPI!.saveEntry(date, entry).catch((err: unknown) =>
          console.error("Failed to save entry:", err)
        );
      } else {
        lsSet("local-workspace-entries", next);
      }
      return next;
    });
  }, []);

  const setProjects = useCallback((fn: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (isElectron()) {
        const api = window.electronAPI!;
        const nextIds = new Set(next.map(p => p.id));
        for (const p of prev) {
          if (!nextIds.has(p.id)) {
            api.deleteProject(p.id).catch((err: unknown) => console.error("Failed to delete project:", err));
          }
        }
        for (const p of next) {
          api.saveProject(p).catch((err: unknown) => console.error("Failed to save project:", err));
        }
      } else {
        lsSet("local-workspace-projects", next);
      }
      return next;
    });
  }, []);

  const setMeetings = useCallback((fn: Meeting[] | ((prev: Meeting[]) => Meeting[])) => {
    setMeetingsState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (isElectron()) {
        const api = window.electronAPI!;
        const nextIds = new Set(next.map(m => m.id));
        for (const m of prev) {
          if (!nextIds.has(m.id)) {
            api.deleteMeeting(m.id).catch((err: unknown) => console.error("Failed to delete meeting:", err));
          }
        }
        for (const m of next) {
          api.saveMeeting(m).catch((err: unknown) => console.error("Failed to save meeting:", err));
        }
      } else {
        lsSet("local-workspace-meetings", next);
      }
      return next;
    });
  }, []);

  const setPeople = useCallback((fn: Person[] | ((prev: Person[]) => Person[])) => {
    setPeopleState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (isElectron()) {
        const api = window.electronAPI!;
        const nextIds = new Set(next.map(p => p.id));
        for (const p of prev) {
          if (!nextIds.has(p.id)) {
            api.deletePerson(p.id).catch((err: unknown) => console.error("Failed to delete person:", err));
          }
        }
        for (const p of next) {
          api.savePerson(p).catch((err: unknown) => console.error("Failed to save person:", err));
        }
      } else {
        lsSet("local-workspace-people", next);
      }
      return next;
    });
  }, []);

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
    if (isElectron()) { window.electronAPI!.openVaultInExplorer(); }
  }, []);

  const exportBackup = useCallback(async () => {
    if (!isElectron()) return false;
    return await window.electronAPI!.exportBackup();
  }, []);

  const importBackup = useCallback(async () => {
    if (!isElectron()) return false;
    const result = await window.electronAPI!.importBackup();
    if (result) await loadAllData();
    return !!result;
  }, [loadAllData]);

  return (
    <DataContext.Provider value={{
      entries, updateEntry,
      projects, setProjects,
      meetings, setMeetings,
      people, setPeople,
      loading,
      vaultPath, changeVault, openVault,
      exportBackup, importBackup,
    }}>
      {children}
    </DataContext.Provider>
  );
}
