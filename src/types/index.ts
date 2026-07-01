export interface Task {
  id: string;
  task: string;
  outcome: string;
  system: string;
  mission: string;
  completed: boolean;
}

export type MentalRating = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
  journal: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  goals: Goal[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number; // 0-100
}

export type TimeRange = "weekly" | "monthly";
