import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured, signInWithPassword, signUp as supabaseSignUp, signOut, onAuthStateChange } from "@/lib/supabase";
import type { DailyEntry, UserProfile, Project, Fact } from "@/types";

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
              id: row.id,
              date: row.date,
              tasks: row.tasks || [],
              mentalStatus: row.mental_status || { morning: 2, afternoon: 2, night: 2 },
              physicalStatus: row.physical_status || "good",
              physicalNote: row.physical_note || "",
              mentalNote: row.mental_note || "",
              journal: row.journal || "",
              bestThing: row.best_thing || "",
              proudThings: row.proud_things || "",
              lessonLearned: row.lesson_learned || "",
              lessonChange: row.lesson_change || "",
              excitedAbout: row.excited_about || "",
            };
          }
          setEntries(map);
        }
        if (pRes.data) {
          setProfile({ 
            id: pRes.data.id, 
            name: pRes.data.name || "", 
            email: ((pRes.data as Record<string, unknown>).email as string) || "", 
            avatar: pRes.data.avatar || "", 
            goals: pRes.data.goals || [], 
            facts: ((pRes.data as Record<string, unknown>).facts as Fact[]) || [] 
          });
        }
        if (prRes.data) {
          setProjectsState(prRes.data.map((r: Record<string, unknown>) => ({
            id: r.id, title: r.title, description: r.description, color: r.color,
            milestones: r.milestones, cards: r.cards, createdAt: r.created_at,
            archived: r.archived,
          })) as Project[]);
        }
      }).catch((error) => {
        console.error("Failed to load data from Supabase:", error);
      });
    } else {
      setEntries(lsGet("daily-tracker-entries", {}));
      setProfile(lsGet("daily-tracker-profile", defaultProfile));
      setProjectsState(lsGet("daily-tracker-projects", []));
    }
  }, [loading]);
  // ── Entry upsert ──
  const updateEntry = useCallback((date: string, entry: DailyEntry) => {
    console.log("🔵 updateEntry called for date:", date, "tasks count:", entry.tasks.length, "isSupabaseConfigured:", isSupabaseConfigured);
    
    setEntries((prev) => {
      const next = { ...prev, [date]: entry };
      if (isSupabaseConfigured && supabase) {
        // Sanitize payload to ensure valid JSON
        const sanitizedTasks = entry.tasks.map(task => ({
          id: String(task.id || ""),
          task: String(task.task || ""),
          outcome: String(task.outcome || ""),
          system: String(task.system || ""),
          mission: String(task.mission || ""),
          completed: Boolean(task.completed),
        }));

        const payload = {
          id: String(entry.id || crypto.randomUUID()),
          date: String(date),
          tasks: sanitizedTasks,
          mental_status: {
            morning: Number(entry.mentalStatus?.morning) || 2,
            afternoon: Number(entry.mentalStatus?.afternoon) || 2,
            night: Number(entry.mentalStatus?.night) || 2,
          },
          physical_status: String(entry.physicalStatus || "good"),
          physical_note: String(entry.physicalNote || ""),
          mental_note: String(entry.mentalNote || ""),
          journal: String(entry.journal || ""),
          best_thing: String(entry.bestThing || ""),
          proud_things: String(entry.proudThings || ""),
          lesson_learned: String(entry.lessonLearned || ""),
          lesson_change: String(entry.lessonChange || ""),
          excited_about: String(entry.excitedAbout || ""),
          updated_at: new Date().toISOString(),
        };

        console.log("🔵 Upserting to Supabase:", payload);
        console.log("🔵 Tasks being sent:", JSON.stringify(sanitizedTasks));
        
        supabase.from("daily_entries").upsert(payload, { onConflict: "date" }).then(
          (result) => {
            console.log("✅ Supabase upsert success:", result);
          },
          (error: unknown) => {
            console.error("❌ Failed to save daily entry:", error);
            console.error("❌ Full error object:", JSON.stringify(error, null, 2));
            
            if (error && typeof error === 'object') {
              const err = error as Record<string, unknown>;
              if ('message' in err) console.error("❌ Error message:", err.message);
              if ('details' in err) console.error("❌ Error details:", err.details);
              if ('hint' in err) console.error("❌ Error hint:", err.hint);
              if ('code' in err) console.error("❌ Error code:", err.code);
            }
          }
        );
      } else {
        console.log("🔵 Using localStorage instead of Supabase");
        lsSet("daily-tracker-entries", next);
      }
      return next;
    });
  }, []);

  // ── Profile update ──
  const updateProfileFn = useCallback((p: UserProfile) => {
    setProfile(p);
    if (isSupabaseConfigured && supabase) {
      if (!p.id) {
        // Insert a new profile row if no id exists yet
        supabase.from("user_profile").insert({
          name: p.name, email: p.email, avatar: p.avatar, goals: p.goals, facts: p.facts,
        }).select().then(
          (result) => {
            if (result.data?.[0]?.id) {
              setProfile((prev) => ({ ...prev, id: result.data[0].id }));
            }
            console.log("✅ Profile saved to Supabase:", result);
          },
          (error: unknown) => { console.error("❌ Failed to insert profile:", error); }
        );
      } else {
        supabase.from("user_profile").update({
          name: p.name, email: p.email, avatar: p.avatar, goals: p.goals, facts: p.facts, updated_at: new Date().toISOString(),
        }).eq("id", p.id).then(
          () => { console.log("✅ Profile updated in Supabase"); },
          (error: unknown) => { console.error("❌ Failed to save profile:", error); }
        );
      }
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
          if (!nextIds.has(p.id)) supabase!.from("projects").delete().eq("id", p.id).then(
            () => {},
            (error: unknown) => { console.error("Failed to delete project:", error); }
          );
        }
        for (const row of rows) {
          supabase!.from("projects").upsert(row, { onConflict: "id" }).then(
            () => {},
            (error: unknown) => { console.error("Failed to save project:", error); }
          );
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
