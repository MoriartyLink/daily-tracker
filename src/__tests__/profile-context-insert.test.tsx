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

describe("Profile INSERT to Supabase", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("should call insert when profile has no id", async () => {
    let capturedPayload: any = null;
    const insertThenSpy = vi.fn().mockResolvedValue({
      data: [{ id: "new-uuid-1" }],
      error: null,
    });
    const selectSpy = vi.fn(() => ({ then: insertThenSpy }));
    const insertSpy = vi.fn((p: any) => {
      capturedPayload = p;
      return { select: selectSpy };
    });

    // No profile row in DB (null)
    vi.mocked(supabase!.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: insertSpy,
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((cb: Function) =>
        cb([
          { data: [], error: null },
          { data: null, error: null },
          { data: [], error: null },
        ])
      ),
    } as any);

    function Consumer() {
      const { profile, updateProfile } = useData();
      return (
        <button
          data-testid="btn"
          onClick={() =>
            updateProfile({
              id: "",
              name: "New User",
              email: "new@test.com",
              avatar: "",
              goals: [],
              facts: [{ id: "f1", title: "Fact", content: "C", order: 0 }],
            })
          }
        >
          Add
        </button>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(supabase!.from).toHaveBeenCalled());
    await act(async () => { screen.getByTestId("btn").click(); });

    expect(insertSpy).toHaveBeenCalled();
    expect(capturedPayload).toMatchObject({
      name: "New User",
      email: "new@test.com",
      facts: [{ id: "f1", title: "Fact", content: "C", order: 0 }],
    });
    expect(selectSpy).toHaveBeenCalled();
  });

  it("should capture returned id after insert", async () => {
    const newId = "new-uuid-789";
    const insertThenSpy = vi.fn().mockResolvedValue({
      data: [{ id: newId }],
      error: null,
    });
    const selectSpy = vi.fn(() => ({ then: insertThenSpy }));
    const insertSpy = vi.fn(() => ({ select: selectSpy }));

    vi.mocked(supabase!.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: insertSpy,
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((cb: Function) =>
        cb([
          { data: [], error: null },
          { data: null, error: null },
          { data: [], error: null },
        ])
      ),
    } as any);

    function Consumer() {
      const { profile, updateProfile } = useData();
      return (
        <button
          data-testid="btn"
          onClick={() =>
            updateProfile({
              id: "",
              name: "New",
              email: "n@t.com",
              avatar: "",
              goals: [],
              facts: [],
            })
          }
        >
          Add
        </button>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(supabase!.from).toHaveBeenCalled());
    await act(async () => { screen.getByTestId("btn").click(); });

    // The insert then should resolve and update state
    expect(insertThenSpy).toHaveBeenCalled();
  });
});
