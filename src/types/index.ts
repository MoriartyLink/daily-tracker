export interface Task {
  id: string;
  task: string;
  outcome: string;
  system: string;
  mission: string;
  completed: boolean;
}

export type MentalRating = 1 | 2 | 3 | 4 | 5;

export interface MentalStatus {
  morning: MentalRating;
  afternoon: MentalRating;
  night: MentalRating;
}

export type PhysicalStatus = "good" | "sick" | "critical";

export interface DailyEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  tasks: Task[];
  mentalStatus: MentalStatus;
  physicalStatus: PhysicalStatus;
  physicalNote: string;
  mentalNote: string;
  journal: string;
  // Reflective questions
  bestThing: string;
  proudThings: string;
  lessonLearned: string;
  lessonChange: string;
  excitedAbout: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  goals: Goal[];
  facts: Fact[];
}

export interface Fact {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number; // 0-100
}

export type TimeRange = "weekly" | "monthly";

// Project & Kanban types
export type KanbanColumnId = "backlog" | "todo" | "in-progress" | "done" | "blocked";

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  columnId: KanbanColumnId;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  dueDate: string;
  createdAt: string;
  completedAt: string;
  order: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string; // hex color for accent
  milestones: Milestone[];
  cards: KanbanCard[];
  createdAt: string;
  archived: boolean;
}

export const KANBAN_COLUMNS: { id: KanbanColumnId; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "#71717a" },
  { id: "todo", title: "To Do", color: "#3b82f6" },
  { id: "in-progress", title: "In Progress", color: "#f59e0b" },
  { id: "blocked", title: "Blocked", color: "#ef4444" },
  { id: "done", title: "Done", color: "#10b981" },
];

export const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#ef4444", "#6366f1",
];
