import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { DataProvider, useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";

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

describe("BUG #1: Missing .eq() filter on update (FIXED)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("update() must call .eq('id', profileId) to persist to DB", async () => {
    const eqSpy = vi.fn().mockReturnThis();
    const utSpy = vi.fn();
    const uSpy = vi.fn(() => ({ eq: eqSpy, then: utSpy }));
    mockDb(eqSpy, uSpy, utSpy);

    function Consumer() {
      const { profile, updateProfile } = useData();
      return (
        <button
          data-testid="btn"
          onClick={() => updateProfile({ ...profile, name: "X" })}
        >
          Save
        </button>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(supabase!.from).toHaveBeenCalled());
    await act(async () => { screen.getByTestId("btn").click(); });

    expect(eqSpy).toHaveBeenCalledWith("id", "550e8400-e29b-41d4-a716-446655440000");
    console.log("✅ BUG #1 FIXED: .eq('id', ...) is present on update");
  });
});

describe("BUG #2: UI shows 'Saved!' even when Supabase fails", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("Supabase error is logged but UI has no failure feedback", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const eqSpy = vi.fn().mockReturnThis();
    const utSpy = vi.fn((ok?: Function, fail?: Function) => {
      if (fail) setTimeout(() => fail(new Error("DB timeout")), 0);
    });
    const uSpy = vi.fn(() => ({ eq: eqSpy, then: utSpy }));
    mockDb(eqSpy, uSpy, utSpy);

    function Consumer() {
      const { profile, updateProfile } = useData();
      return (
        <button
          data-testid="btn"
          onClick={() => updateProfile({ ...profile, name: "Fail" })}
        >
          Save
        </button>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(supabase!.from).toHaveBeenCalled());
    await act(async () => { screen.getByTestId("btn").click(); });

    await vi.waitFor(
      () => expect(consoleSpy).toHaveBeenCalledWith(
        "❌ Failed to save profile:", expect.any(Error)
      ),
      { timeout: 2000 }
    );
    console.log("⚠️ BUG #2: UI has no error feedback mechanism");
    consoleSpy.mockRestore();
  });
});
