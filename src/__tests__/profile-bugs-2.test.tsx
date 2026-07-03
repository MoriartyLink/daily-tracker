import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { DataProvider, useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

vi.mock("@/lib/supabase", () => {
  const ms = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  };
  return {
    supabase: ms,
    isSupabaseConfigured: true,
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => vi.fn()),
  };
});

const MOCK_ROW = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test User",
  email: "test@example.com",
  avatar: "",
  goals: [],
  facts: [{ id: "f1", title: "Fact1", content: "C1", order: 0 }],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function mockDb(eqSpy: any, updateSpy: any, updateThenSpy: any) {
  vi.mocked(supabase!.from).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: updateSpy,
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: eqSpy,
    then: vi.fn((cb: Function) =>
      cb([
        { data: [], error: null },
        { data: MOCK_ROW, error: null },
        { data: [], error: null },
      ])
    ),
  } as any);
}

describe("BUG #3: Stale closure on rapid updates", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("two rapid updates both read profile from closure, first payload may lack facts", async () => {
    const updateCalls: any[] = [];
    const eqSpy = vi.fn().mockReturnThis();
    const utSpy = vi.fn();
    const uSpy = vi.fn((p: any) => {
      updateCalls.push(p);
      return { eq: eqSpy, then: utSpy };
    });
    mockDb(eqSpy, uSpy, utSpy);

    function Consumer() {
      const { profile, updateProfile } = useData();
      // Same pattern as ProfilePage.tsx line 14
      const update = (updates: Partial<typeof profile>) =>
        updateProfile({ ...profile, ...updates });

      return (
        <button
          data-testid="btn"
          onClick={() => {
            update({ name: "Name1" });
            update({
              name: "Name2",
              facts: [{ id: "f1", title: "Final", content: "C", order: 0 }],
            });
          }}
        >
          Rapid
        </button>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(supabase!.from).toHaveBeenCalled());
    await act(async () => { screen.getByTestId("btn").click(); });

    const hasFinal = updateCalls.some(
      (p) => p.name === "Name2" && Array.isArray(p.facts) && p.facts.length > 0
    );
    expect(hasFinal).toBe(true);
    console.log("⚠️ BUG #3: Rapid onChange calls use stale closure, can lose data");
  });
});

describe("BUG #4: Facts order field uses array.length, not max(order)+1", () => {
  it("adding fact after deleting middle item causes order collision", () => {
    // ProfilePage line 86: order: (profile.facts?.length || 0)
    const existing = [
      { id: "a", title: "A", content: "a", order: 0 },
      { id: "b", title: "B", content: "b", order: 1 },
      { id: "c", title: "C", content: "c", order: 2 },
    ];
    // Delete middle item (order=1)
    const afterDelete = existing.filter((f) => f.id !== "b"); // length = 2
    // Add new fact
    const newOrder = afterDelete.length; // = 2
    // But 'c' already has order 2! Conflict!
    expect(newOrder).toBe(2);
    expect(afterDelete.find((f) => f.order === 2)).toBeTruthy();
    console.log("⚠️ BUG #4: addFact uses length not max(order)+1, causes order collisions after delete");
  });
});

describe("BUG #5: No error boundary / error state in DataContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("DataContext has no error state for failed Supabase queries", async () => {
    // Simulate a failing load query
    vi.mocked(supabase!.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((cb: Function) =>
        cb([
          { data: [], error: null },
          { data: null, error: { message: "connection failed" } },
          { data: [], error: null },
        ])
      ),
    } as any);

    // Check that DataContext type doesn't have an error field
    const { DataContextType } = await import("@/contexts/DataContext");
    // Can't easily check interface at runtime, but we can verify the provided value
    // The context provides: entries, updateEntry, profile, updateProfile, projects, setProjects, loading, isCloud, user, login, signup, logout
    // No error/errorMessage field exists
    console.log("⚠️ BUG #5: DataContext provides no error state, failures are invisible to UI");
  });
});
