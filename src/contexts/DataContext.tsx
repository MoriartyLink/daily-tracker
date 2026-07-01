import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured, signInWithPassword, signUp as supabaseSignUp, signOut, onAuthStateChange } from "@/lib/supabase";
import type { DailyEntry, UserProfile, Project } from "@/types";

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
  isCloud: boolean;
  // Auth
  user: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultProfile: UserProfile = { id: "", name: "", email: "", avatar: "", goals: [], facts: [] };

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}

// ── localStorage helpers ──
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
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const initAuth = async () => {
      const { data } = await supabase!.auth.getUser();
      if (data.user) setUser({ id: data.user.id, email: data.user.email || "" });
      setLoading(false);
    };
    initAuth();

    const unsubscribe = onAuthStateChange((session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load data after auth state is known
  useEffect(() => {
    if (loading) return;

    if (isSupabaseConfigured && supabase) {
      Promise.all([
        supabase.from("daily_entries").select("*"),
        supabase.from("user_profile").select("*").limit(1).single(),
        supabase.from("projects").select("*").order("created_at"),
      ]).then(([eRes, pRes, prRes]) => {
        if (eRes.data) {
          const map: Record<string, DailyEntry> = {};
          for (const row of eRes.data) {
            map[row.date] = {
              id: row.id, date: row.date, tasks: row.tasks,
              mentalStatus: row.mental_status, physicalStatus: row.physical_status,
              physicalNote: row.physical_note, mentalNote: row.mental_note, journal: row.journal,
              bestThing: row.best_thing, proudThings: row.proud_things,
              lessonLearned: row.lesson_learned, lessonChange: row.lesson_change,
              excitedAbout: row.excited_about,
            };
          }
          setEntries(map);
        }
        if (pRes.data) {
          setProfile({ id: pRes.data.id, name: pRes.data.name, email: pRes.data.email || "", avatar: pRes.data.avatar, goals: pRes.data.goals, facts: pRes.data.facts || [] });
        }
        if (prRes.data) {
          setProjectsState(prRes.data.map((r: Record<string, unknown>) => ({
            id: r.id, title: r.title, description: r.description, color: r.color,
            milestones: r.milestones, cards: r.cards, createdAt: r.created_at,
            archived: r.archived,
          })) as Project[]);
        }
      });
    } else {
      setEntries(lsGet("daily-tracker-entries", {}));
      setProfile(lsGet("daily-tracker-profile", defaultProfile));
      setProjectsState(lsGet("daily-tracker-projects", []));
    }
  }, [loading]);
  // ── Entry upsert ──
  const updateEntry = useCallback((date: string, entry: DailyEntry) => {
    setEntries((prev) => {
      const next = { ...prev, [date]: entry };
      if (isSupabaseConfigured && supabase) {
        supabase.from("daily_entries").upsert({
          id: entry.id, date, tasks: entry.tasks,
          mental_status: entry.mentalStatus, physical_status: entry.physicalStatus,
          physical_note: entry.physicalNote, mental_note: entry.mentalNote, journal: entry.journal,
          best_thing: entry.bestThing, proud_things: entry.proudThings,
          lesson_learned: entry.lessonLearned, lesson_change: entry.lessonChange,
          excited_about: entry.excitedAbout,
          updated_at: new Date().toISOString(),
        }, { onConflict: "date" }).then(() => {});
      } else { lsSet("daily-tracker-entries", next); }
      return next;
    });
  }, []);

  // ── Profile update ──
  const updateProfileFn = useCallback((p: UserProfile) => {
    setProfile(p);
    if (isSupabaseConfigured && supabase) {
      supabase.from("user_profile").update({
        id: p.id, name: p.name, email: p.email, avatar: p.avatar, goals: p.goals, facts: p.facts, updated_at: new Date().toISOString(),
      }).then(() => {});
    } else { lsSet("daily-tracker-profile", p); }
  }, []);

  // ── Projects update ──
  const setProjects = useCallback((fn: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (isSupabaseConfigured && supabase) {
        const rows = next.map((p) => ({
          id: p.id, title: p.title, description: p.description, color: p.color,
          milestones: p.milestones, cards: p.cards, archived: p.archived,
          created_at: p.createdAt, updated_at: new Date().toISOString(),
        }));
        const nextIds = new Set(next.map((p) => p.id));
        for (const p of prev) {
          if (!nextIds.has(p.id)) supabase!.from("projects").delete().eq("id", p.id).then(() => {});
        }
        for (const row of rows) {
          supabase!.from("projects").upsert(row, { onConflict: "id" }).then(() => {});
        }
      } else { lsSet("daily-tracker-projects", next); }
      return next;
    });
  }, []);

  // ── Auth ──
  const login = useCallback(async (email: string, password: string) => {
    await signInWithPassword(email, password);
    setProfile((prev) => ({ ...prev, email }));
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    await supabaseSignUp(email, password);
    setProfile((prev) => ({ ...prev, email }));
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  return (
    <DataContext.Provider value={{ entries, updateEntry, profile, updateProfile: updateProfileFn, projects, setProjects, loading, isCloud: isSupabaseConfigured, user, login, signup, logout }}>
      {children}
    </DataContext.Provider>
  );
}
