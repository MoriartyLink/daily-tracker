import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Brain,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DailyEntry, Task, MentalRating, PhysicalStatus } from "@/types";

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function createEmptyEntry(date: string): DailyEntry {
  return {
    id: crypto.randomUUID(),
    date,
    tasks: [],
    mentalStatus: { morning: 4, afternoon: 4, night: 4 },
    physicalStatus: "good",
    physicalNote: "",
    journal: "",
  };
}

function createEmptyTask(): Task {
  return {
    id: crypto.randomUUID(),
    task: "",
    outcome: "",
    system: "",
    mission: "",
    completed: false,
  };
}

export function JournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = getDateString(currentDate);
  const [entries, setEntries] = useLocalStorage<Record<string, DailyEntry>>(
    "daily-tracker-entries",
    {}
  );

  const entry = entries[dateKey] || createEmptyEntry(dateKey);

  const updateEntry = useCallback(
    (updates: Partial<DailyEntry>) => {
      setEntries((prev) => ({
        ...prev,
        [dateKey]: { ...entry, ...updates },
      }));
    },
    [dateKey, entry, setEntries]
  );

  const addTask = () => {
    updateEntry({ tasks: [...entry.tasks, createEmptyTask()] });
  };

  const updateTask = (taskId: string, field: keyof Task, value: string | boolean) => {
    updateEntry({
      tasks: entry.tasks.map((t) =>
        t.id === taskId ? { ...t, [field]: value } : t
      ),
    });
  };

  const removeTask = (taskId: string) => {
    updateEntry({ tasks: entry.tasks.filter((t) => t.id !== taskId) });
  };

  const goToPrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isToday = getDateString(currentDate) === getDateString(new Date());

  return (
    <div className="fade-in space-y-5">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Journal</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Record your day, track your progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={isToday ? "default" : "outline"}
            size="sm"
            onClick={goToToday}
            className="min-w-[140px] gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(currentDate)}
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tasks Section */}
      <Card className="glow-blue-subtle">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              Tasks
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addTask} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="task-table">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Task</th>
                  <th style={{ width: "25%" }}>Outcome</th>
                  <th style={{ width: "20%" }}>System</th>
                  <th style={{ width: "20%" }}>Mission</th>
                  <th style={{ width: "5%" }}></th>
                </tr>
              </thead>
              <tbody>
                {entry.tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <p className="text-zinc-600 text-sm">No tasks yet. Click "Add Task" to get started.</p>
                    </td>
                  </tr>
                ) : (
                  entry.tasks.map((task) => (
                    <tr key={task.id} className="group">
                      <td>
                        <input
                          placeholder="What needs to be done?"
                          value={task.task}
                          onChange={(e) => updateTask(task.id, "task", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          placeholder="Expected outcome"
                          value={task.outcome}
                          onChange={(e) => updateTask(task.id, "outcome", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          placeholder="System/process"
                          value={task.system}
                          onChange={(e) => updateTask(task.id, "system", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          placeholder="Mission alignment"
                          value={task.mission}
                          onChange={(e) => updateTask(task.id, "mission", e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mental & Physical Status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Mental Status */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              Mental Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["morning", "afternoon", "night"] as const).map((period) => (
              <div key={period} className="flex items-center gap-4">
                <span className="text-sm text-zinc-400 w-24 capitalize font-medium">
                  {period === "afternoon" ? "After Noon" : period}
                </span>
                <span className="text-xs text-red-400/70 font-medium w-8">Bad</span>
                <div className="mental-rating flex-1 justify-center">
                  {([1, 2, 3, 4, 5, 6, 7] as MentalRating[]).map((val) => (
                    <button
                      key={val}
                      className={`mental-dot ${entry.mentalStatus[period] >= val ? "active" : ""}`}
                      onClick={() =>
                        updateEntry({
                          mentalStatus: { ...entry.mentalStatus, [period]: val },
                        })
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-emerald-400/70 font-medium w-10">Good</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Physical Status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-emerald-400" />
              </div>
              Physical
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={entry.physicalStatus}
              onValueChange={(val: string) =>
                updateEntry({ physicalStatus: val as PhysicalStatus })
              }
              className="space-y-2.5"
            >
              {(
                [
                  { value: "good", label: "Good", color: "text-emerald-400" },
                  { value: "sick", label: "Sick", color: "text-amber-400" },
                  { value: "critical", label: "Critical", color: "text-red-400" },
                ] as const
              ).map((item) => (
                <div key={item.value} className="flex items-center gap-2.5">
                  <RadioGroupItem value={item.value} id={`physical-${item.value}`} />
                  <Label
                    htmlFor={`physical-${item.value}`}
                    className={`cursor-pointer text-sm ${item.color}`}
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Separator className="my-2" />
            <div>
              <Label className="text-xs text-zinc-500">Note</Label>
              <Input
                placeholder="Any notes about your physical state..."
                value={entry.physicalNote}
                onChange={(e) => updateEntry({ physicalNote: e.target.value })}
                className="mt-1.5 h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpenIcon className="w-4 h-4 text-blue-400" />
            </div>
            Journal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write about your day... What happened? What did you learn? How do you feel?"
            value={entry.journal}
            onChange={(e) => updateEntry({ journal: e.target.value })}
            className="min-h-[200px] text-sm leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
