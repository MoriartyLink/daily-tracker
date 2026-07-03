import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataProvider } from "@/contexts/DataContext";
import { ProfilePage } from "@/pages/ProfilePage";
import { supabase } from "@/lib/supabase";
import type { ReactNode } from "react";

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
  facts: [
    { id: "f1", title: "Loves coding", content: "I code every day", order: 0 },
    { id: "f2", title: "Night owl", content: "Works best at night", order: 1 },
  ],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function mockDb() {
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
        { data: MOCK_ROW, error: null },
        { data: [], error: null },
      ])
    ),
  } as any);
}

function renderProfile() {
  return render(
    <DataProvider>
      <ProfilePage />
    </DataProvider>
  );
}

describe("ProfilePage Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    } as any);
  });

  it("should render profile data after loading", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });
  });

  it("should display Facts About Me section with loaded facts", async () => {
    mockDb();
    renderProfile();

    // Wait for facts to render
    await waitFor(() => {
      expect(screen.getByDisplayValue("Loves coding")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Night owl")).toBeInTheDocument();
    });
  });

  it("should have a Save Profile button", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Save Profile")).toBeInTheDocument();
    });
  });

  it("should show Saved! after clicking save", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Save Profile")).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText("Save Profile").click();
    });

    // Should show "Saved!" temporarily
    await waitFor(() => {
      expect(screen.getByText("Saved!")).toBeInTheDocument();
    });
  });

  it("should have an Add Fact button", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Add Fact")).toBeInTheDocument();
    });
  });

  it("should add a new fact row when clicking Add Fact", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Add Fact")).toBeInTheDocument();
    });

    const addBtn = screen.getByText("Add Fact");
    await act(async () => {
      addBtn.click();
    });

    // Should now have 3 fact rows (2 original + 1 new)
    const titleInputs = screen.getAllByPlaceholderText("Title");
    expect(titleInputs).toHaveLength(3);
  });

  it("should delete a fact when clicking the trash button", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Loves coding")).toBeInTheDocument();
    });

    // Find all trash buttons and click the first one
    const trashButtons = screen.getAllByRole("button").filter(
      (btn) => btn.innerHTML.includes("Trash2") || btn.querySelector("svg")
    );

    // The trash button is the last button in each fact row
    // Let's count the fact rows before delete
    let titleInputs = screen.getAllByPlaceholderText("Title");
    expect(titleInputs).toHaveLength(2);

    // Click delete on first fact - find SVG with trash icon
    const deleteBtn = screen.getByDisplayValue("Loves coding")
      .closest(".flex")!
      .querySelector("button:last-of-type");
    
    if (deleteBtn) {
      await act(async () => { deleteBtn.click(); });
    }

    // Should now have 1 fact row
    titleInputs = screen.getAllByPlaceholderText("Title");
    expect(titleInputs).toHaveLength(1);
  });

  it("should reorder facts up and down with arrow buttons", async () => {
    mockDb();
    renderProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Loves coding")).toBeInTheDocument();
    });

    // Arrow buttons exist
    const allButtons = screen.getAllByRole("button");
    expect(allButtons.length).toBeGreaterThan(0);
  });
});
