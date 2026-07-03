import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DataProvider, useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

// ── Mock supabase ──
vi.mock("@/lib/supabase", () => {
  const mockSupabase = {
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
    supabase: mockSupabase,
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
  facts: [{ id: "f1", title: "Loves coding", content: "I code every day", order: 0 }],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function mockDb(profileRow: any) {
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
        { data: profileRow, error: null },
        { data: [], error: null },
      ])
    ),
  } as any);
}

function renderWithProvider() {
  let ctxProfile: UserProfile | undefined;
  function Consumer() {
    const { profile } = useData();
    ctxProfile = profile;
    return <div data-testid="name">{profile.name}</div>;
  }
  const view = render(<DataProvider><Consumer /></DataProvider>);
  return { view, getProfile: () => ctxProfile };
}

describe("Profile Loading from Supabase", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("should load profile with id, name, email, facts from Supabase", async () => {
    mockDb(MOCK_ROW);
    const { getProfile } = renderWithProvider();

    await waitFor(() => expect(screen.getByTestId("name")).toHaveTextContent("Test User"));

    const p = getProfile();
    expect(p?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(p?.name).toBe("Test User");
    expect(p?.email).toBe("test@example.com");
    expect(p?.facts).toHaveLength(1);
    expect(p?.facts![0].title).toBe("Loves coding");
  });

  it("should handle null profile row (no profile in DB yet)", async () => {
    mockDb(null);
    const { getProfile } = renderWithProvider();

    await waitFor(() => expect(screen.getByTestId("name")).toBeInTheDocument());

    const p = getProfile();
    expect(p?.id).toBe("");
    expect(p?.name).toBe("");
    expect(p?.facts).toEqual([]);
  });

  it("should load facts as empty array when DB has null/undefined facts", async () => {
    mockDb({ ...MOCK_ROW, facts: null });
    const { getProfile } = renderWithProvider();

    await waitFor(() => expect(screen.getByTestId("name")).toHaveTextContent("Test User"));

    const p = getProfile();
    expect(p?.facts).toEqual([]);
  });
});
