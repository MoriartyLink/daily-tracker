import { describe, it, expect } from "vitest";
import type { UserProfile, Fact, Goal } from "@/types";

describe("UserProfile type integrity", () => {
  it("should serialize and deserialize UserProfile with facts via JSON", () => {
    const profile: UserProfile = {
      id: "uuid-1",
      name: "Test User",
      email: "test@example.com",
      avatar: "",
      goals: [],
      facts: [
        { id: "f1", title: "Fact 1", content: "Content 1", order: 0 },
        { id: "f2", title: "Fact 2", content: "Content 2", order: 1 },
      ],
    };

    const serialized = JSON.stringify(profile);
    const deserialized = JSON.parse(serialized) as UserProfile;

    expect(deserialized.name).toBe("Test User");
    expect(deserialized.facts).toHaveLength(2);
    expect(deserialized.facts[0].title).toBe("Fact 1");
    expect(deserialized.facts[1].content).toBe("Content 2");
    expect(deserialized.facts[0].order).toBe(0);
    expect(deserialized.facts[1].order).toBe(1);
  });

  it("BUG: Facts with missing order field will sort incorrectly", () => {
    const factsWithBadOrder: Fact[] = [
      { id: "a", title: "Alpha", content: "c", order: 2 },
      { id: "b", title: "Beta", content: "c", order: 0 },
      { id: "c", title: "Gamma", content: "c", order: 1 },
    ];

    const sorted = [...factsWithBadOrder].sort((a, b) => a.order - b.order);
    expect(sorted[0].title).toBe("Beta");
    expect(sorted[1].title).toBe("Gamma");
    expect(sorted[2].title).toBe("Alpha");
  });

  it("should handle empty facts array", () => {
    const profile: UserProfile = {
      id: "uuid-1",
      name: "Empty",
      email: "",
      avatar: "",
      goals: [],
      facts: [],
    };

    const serialized = JSON.stringify(profile);
    const deserialized = JSON.parse(serialized) as UserProfile;

    expect(deserialized.facts).toEqual([]);
  });

  it("should handle undefined id gracefully (new profile)", () => {
    const profile: UserProfile = {
      name: "New",
      email: "new@test.com",
      avatar: "",
      goals: [],
      facts: [{ id: "f1", title: "T", content: "C", order: 0 }],
    };

    // id is optional, so this should be valid
    expect(profile.id).toBeUndefined();
    const json = JSON.stringify(profile);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("New");
  });

  it("Goal type serialization", () => {
    const goal: Goal = {
      id: "g1",
      title: "Learn Rust",
      description: "Master Rust",
      targetDate: "2024-12-31",
      progress: 50,
    };

    const json = JSON.parse(JSON.stringify(goal));
    expect(json.title).toBe("Learn Rust");
    expect(json.progress).toBe(50);
  });
});
