import { useState, useCallback } from "react";
import { Plus, Trash2, Calendar, Brain, Heart, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import type { DailyEntry, Task, MentalRating, PhysicalStatus } from "@/types";

function getDateString(d: Date) { return d.toISOString().split("T")[0]; }
function formatDate(d: Date) { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

function createEmptyEntry(date: string): DailyEntry {
  return { id: crypto.randomUUID(), date, tasks: [], mentalStatus: { morning: 2, afternoon: 2, night: 2 }, physicalStatus: "good", physicalNote: "", journal: "" };
}
function createEmptyTask(): Task {
  return { id: crypto.randomUUID(), task: "", outcome: "", system: "", mission: "", completed: false };
}

export function JournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = getDateString(currentDate);
  const { entries, updateEntry } = useData();
  const entry = entries[dateKey] || createEmptyEntry(dateKey);

  const save = useCallback((updates: Partial<DailyEntry>) => {
    updateEntry(dateKey, { ...entry, ...updates });
  }, [dateKey, entry, updateEntry]);

  const addTask = () => save({ tasks: [...entry.tasks, createEmptyTask()] });
  const updateTask = (id: string, field: keyof Task, value: string | boolean) => {
    save({ tasks: entry.tasks.map((t) => t.id === id ? { ...t, [field]: value } : t) });
  };
  const removeTask = (id: string) => save({ tasks: entry.tasks.filter((t) => t.id !== id) });

  const goToPrevDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); };
  const goToNextDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); };
  const goToToday = () => setCurrentDate(new Date());
  const isToday = dateKey === getDateString(new Date());

  return (
    <div className="fade-in space-y-5">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Journal</h2>
          <p className="text-sm text-slate-400 mt-0.5">Record your day, track your progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrevDay}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant={isToday ? "default" : "outline"} size="sm" onClick={goToToday} className="min-w-[140px] gap-2">
            <Calendar className="w-3.5 h-3.5" />{formatDate(currentDate)}
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextDay}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Tasks */}
      <Card className="glow-blue-subtle">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-blue-400" /></div>
              <span className="text-slate-100">Tasks</span>
            </CardTitle>
            <Button size="sm" onClick={addTask} className="h-8 gap-1.5"><Plus className="w-3.5 h-3.5" />Add Task</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="task-table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th>Task</th>
                  <th>Expected Outcome</th>
                  <th>System</th>
                  <th>Mission</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {entry.tasks.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No tasks yet. Click "Add Task" to start.</td></tr>
                )}
                {entry.tasks.map((t) => (
                  <tr key={t.id} className={`group ${t.completed ? "opacity-50" : ""}`}>
                    <td className="text-center">
                      <button onClick={() => updateTask(t.id, "completed", !t.completed)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${t.completed ? "bg-blue-500 border-blue-500" : "border-slate-600 hover:border-blue-400"}`}>
                        {t.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </td>
                    <td><Input placeholder="Task description" value={t.task} onChange={(e) => updateTask(t.id, "task", e.target.value)} className="bg-transparent border-none text-slate-200 focus-visible:ring-1" /></td>
                    <td><Input placeholder="Expected outcome" value={t.outcome} onChange={(e) => updateTask(t.id, "outcome", e.target.value)} className="bg-transparent border-none text-slate-200 focus-visible:ring-1" /></td>
                    <td><Input placeholder="System to follow" value={t.system} onChange={(e) => updateTask(t.id, "system", e.target.value)} className="bg-transparent border-none text-slate-200 focus-visible:ring-1" /></td>
                    <td><Input placeholder="Mission/purpose" value={t.mission} onChange={(e) => updateTask(t.id, "mission", e.target.value)} className="bg-transparent border-none text-slate-200 focus-visible:ring-1" /></td>
                    <td className="text-center">
                      <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mental Status */}
        <Card className="glow-blue-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center"><Brain className="w-4 h-4 text-purple-400" /></div>
              <span className="text-slate-100">Mental Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["morning", "afternoon", "night"] as const).map((period) => (
              <div key={period} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-20 capitalize font-medium">{period === "afternoon" ? "After Noon" : period}</span>
                <span className="text-xs text-red-400/80 font-medium w-10">Low</span>
                <div className="mental-rating flex-1 justify-center">
                  {([1, 2, 3] as MentalRating[]).map((val) => (
                    <button key={val} className={`mental-dot ${entry.mentalStatus[period] >= val ? "active" : ""}`}
                      onClick={() => save({ mentalStatus: { ...entry.mentalStatus, [period]: val } })} />
                  ))}
                </div>
                <span className="text-xs text-emerald-400/80 font-medium w-10">High</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Physical Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Heart className="w-4 h-4 text-emerald-400" /></div>
              <span className="text-slate-100">Physical</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={entry.physicalStatus} onValueChange={(v: string) => save({ physicalStatus: v as PhysicalStatus })} className="space-y-2.5">
              {([{ value: "good", label: "Good", color: "text-emerald-400" }, { value: "sick", label: "Sick", color: "text-amber-400" }, { value: "critical", label: "Critical", color: "text-red-400" }] as const).map((item) => (
                <div key={item.value} className="flex items-center gap-2.5">
                  <RadioGroupItem value={item.value} id={`physical-${item.value}`} />
                  <Label htmlFor={`physical-${item.value}`} className={`cursor-pointer text-sm ${item.color}`}>{item.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <Separator className="my-2 bg-slate-700/50" />
            <div>
              <Label className="text-xs text-slate-400">Note</Label>
              <Input placeholder="Any notes about your physical state..." value={entry.physicalNote} onChange={(e) => save({ physicalNote: e.target.value })} className="mt-1.5 h-9 text-xs bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <span className="text-slate-100">Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Tasks</span>
                <span className="text-sm font-bold text-blue-400">{entry.tasks.length}</span>
              </div>
              <Separator className="bg-slate-700/50" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Completed</span>
                <span className="text-sm font-bold text-emerald-400">{entry.tasks.filter((t) => t.completed).length}</span>
              </div>
              <Separator className="bg-slate-700/50" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Completion</span>
                <span className="text-sm font-bold text-purple-400">{entry.tasks.length > 0 ? Math.round((entry.tasks.filter((t) => t.completed).length / entry.tasks.length) * 100) : 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <span className="text-slate-100">Journal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Write about your day... What happened? What did you learn? How do you feel?" value={entry.journal} onChange={(e) => save({ journal: e.target.value })} className="min-h-[200px] text-sm leading-relaxed bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500" />
        </CardContent>
      </Card>
    </div>
  );
}
