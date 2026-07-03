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
  facts: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function mockDb(eqSpy: any, updateSpy: any, _updateThenSpy?: any) {
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

describe("Profile UPDATE to Supabase", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("should call .eq('id', profileId) on update", async () => {
    const eqSpy = vi.fn().mockReturnThis();
    const updateThenSpy = vi.fn();
    const updateSpy = vi.fn(() => ({ eq: eqSpy, then: updateThenSpy }));
    mockDb(eqSpy, updateSpy, updateThenSpy);

    function Consumer() {
      const { profile, updateProfile } = useData();
      return (
        <div>
          <span data-testid="name">{profile.name}</span>
          <button data-testid="btn" onClick={() => updateProfile({ ...profile, name: "Updated" })}>
            Save
          </button>
        </div>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(screen.getByTestId("name")).toHaveTextContent("Test User"));
    await act(async () => { screen.getByTestId("btn").click(); });

    expect(updateSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith("id", "550e8400-e29b-41d4-a716-446655440000");
  });

  it("should include updated_at and all fields in update payload", async () => {
    let captured: any = null;
    const eqSpy = vi.fn().mockReturnThis();
    const updateThenSpy = vi.fn();
    const updateSpy = vi.fn((p: any) => {
      captured = p;
      return { eq: eqSpy, then: updateThenSpy };
    });
    mockDb(eqSpy, updateSpy, updateThenSpy);

    function Consumer() {
      const { profile, updateProfile } = useData();
      return (
        <button
          data-testid="btn"
          onClick={() =>
            updateProfile({
              ...profile,
              name: "New Name",
              facts: [{ id: "f1", title: "Fact", content: "Desc", order: 0 }],
            })
          }
        >
          Save
        </button>
      );
    }

    render(<DataProvider><Consumer /></DataProvider>);
    await waitFor(() => expect(supabase!.from).toHaveBeenCalled());
    await act(async () => { screen.getByTestId("btn").click(); });

    expect(captured).toMatchObject({
      name: "New Name",
      facts: [{ id: "f1", title: "Fact", content: "Desc", order: 0 }],
    });
    expect(captured).toHaveProperty("updated_at");
    expect(typeof captured.updated_at).toBe("string");
    expect(captured).not.toHaveProperty("id"); // id should not be in update payload
  });
});
