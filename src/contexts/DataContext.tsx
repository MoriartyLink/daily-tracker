import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { DailyEntry, UserProfile, Project, Meeting, Person, BacklogItem } from "@/types";
import "@/types/electron";

interface DataContextType {
  entries: Record<string, DailyEntry>;
  updateEntry: (date: string, entry: DailyEntry) => void;
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  projects: Project[];
  setProjects: (fn: Project[] | ((prev: Project[]) => Project[])) => void;
  meetings: Meeting[];
  setMeetings: (fn: Meeting[] | ((prev: Meeting[]) => Meeting[])) => void;
  people: Person[];
  setPeople: (fn: Person[] | ((prev: Person[]) => Person[])) => void;
  backlogItems: BacklogItem[];
  setBacklogItems: (fn: BacklogItem[] | ((prev: BacklogItem[]) => BacklogItem[])) => void;
  loading: boolean;
  vaultPath: string;
  changeVault: () => Promise<void>;
  openVault: () => void;
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
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [meetings, setMeetingsState] = useState<Meeting[]>([]);
  const [people, setPeopleState] = useState<Person[]>([]);
  const [backlogItems, setBacklogItemsState] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultPath, setVaultPath] = useState("");

  const loadAllData = useCallback(async () => {
    if (isElectron()) {
      try {
        const api = window.electronAPI!;
        const [loadedEntries, loadedProfile, loadedProjects, loadedMeetings, loadedPeople, loadedBacklog, path] = await Promise.all([
          api.loadAllEntries(),
          api.loadProfile(),
          api.loadAllProjects(),
          api.loadAllMeetings(),
          api.loadAllPeople(),
          api.loadAllBacklogItems(),
          api.getVaultPath(),
        ]);
        setEntries(loadedEntries || {});
        setProfile(loadedProfile || defaultProfile);
        setProjectsState(loadedProjects || []);
        setVaultPath(path || "");
        setMeetingsState(loadedMeetings || []);
        setPeopleState(loadedPeople || []);
        setBacklogItemsState(loadedBacklog || []);
      } catch (err) {
        console.error("Failed to load data from vault:", err);
      }
    } else {
      setEntries(lsGet("daily-tracker-entries", {}));
      setProfile(lsGet("daily-tracker-profile", defaultProfile));
      setProjectsState(lsGet("daily-tracker-projects", []));
      setMeetingsState(lsGet("daily-tracker-meetings", []));
      setPeopleState(lsGet("daily-tracker-people", []));
      setBacklogItemsState(lsGet("daily-tracker-backlog", []));
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
        lsSet("daily-tracker-entries", next);
      }
      return next;
    });
  }, []);

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

  const setProjects = useCallback((fn: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (isElectron()) {
        const api = window.electronAPI!;
        const nextIds = new Set(next.map((p) => p.id));
        for (const p of prev) {
          if (!nextIds.has(p.id)) {
            api.deleteProject(p.id).catch((err: unknown) => console.error("Failed to delete project:", err));
          }
        }
        for (const project of next) {
          api.saveProject(project).catch((err: unknown) => console.error("Failed to save project:", err));
        }
      } else {
        lsSet("daily-tracker-projects", next);
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
        lsSet("daily-tracker-meetings", next);
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
        lsSet("daily-tracker-people", next);
      }
      return next;
    });
  }, []);

  const setBacklogItems = useCallback((fn: BacklogItem[] | ((prev: BacklogItem[]) => BacklogItem[])) => {
    setBacklogItemsState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (isElectron()) {
        const api = window.electronAPI!;
        const nextIds = new Set(next.map(i => i.id));
        for (const i of prev) {
          if (!nextIds.has(i.id)) {
            api.deleteBacklogItem(i.id).catch((err: unknown) => console.error("Failed to delete backlog item:", err));
          }
        }
        for (const i of next) {
          api.saveBacklogItem(i).catch((err: unknown) => console.error("Failed to save backlog item:", err));
        }
      } else {
        lsSet("daily-tracker-backlog", next);
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
      profile, updateProfile: updateProfileFn,
      projects, setProjects,
      meetings, setMeetings,
      people, setPeople,
      backlogItems, setBacklogItems,
      loading,
      vaultPath, changeVault, openVault,
      exportBackup, importBackup,
    }}>
      {children}
    </DataContext.Provider>
  );
}
