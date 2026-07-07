import { useMemo, useState, useCallback } from "react";
import { Download, FileText, FolderKanban, Filter, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { HistoryEntry } from "@/types";

function getShortDate(s: string) { return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function getMonthKey(d: Date) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  return { start, end: now };
}
function getMonthRange(monthKey: string): { start: Date; end: Date } {
  const parts = monthKey.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
}

export function HistoryPage() {
  const { entries, projects } = useData();
  const [view, setView] = useLocalStorage<"weekly" | "monthly">("history-view", "weekly");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterMission, setFilterMission] = useState("");
  const [monthKey, _setMonthKey] = useState(() => getMonthKey(new Date()));

  const range = view === "weekly" ? getWeekRange() : getMonthRange(monthKey);
  const dates = useMemo(() => {
    const result: string[] = [];
    const cur = new Date(range.start);
    while (cur <= range.end) {
      result.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [range]);

  const historyItems = useMemo(() => {
    const items: Array<HistoryEntry & { source: string; system?: string; mission?: string; outcome?: string }> = [];
    const startStr = range.start.toISOString().split("T")[0];
    const endStr = range.end.toISOString().split("T")[0];
    for (const date of dates) {
      const entry = entries[date];
      if (!entry) continue;
      for (const t of entry.tasks) {
        if (t.completed) {
          items.push({
            id: t.id,
            title: t.task,
            type: "task",
            completedAt: date,
            date: date,
            outcome: t.outcome,
            system: t.system,
            mission: t.mission,
            source: "journal",
          });
        }
      }
    }
    for (const p of projects) {
      for (const h of (p.history || [])) {
        if (h.date >= startStr && h.date <= endStr) {
          items.push({ ...h, source: "project" });
        }
      }
    }
    items.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return items;
  }, [entries, projects, dates, range]);

  const allSystems = [...new Set(historyItems.filter(i => i.system).map(i => i.system!))];
  const allMissions = [...new Set(historyItems.filter(i => i.mission).map(i => i.mission!))];
  const filtered = historyItems.filter(i => {
    if (filterSystem && i.system !== filterSystem) return false;
    if (filterMission && i.mission !== filterMission) return false;
    return true;
  });

  const handleDownload = useCallback(() => {
    const lines = ["# History"];
    const modeLabel = view === "weekly" ? "Weekly" : "Monthly";
    const rangeLabel = getShortDate(range.start.toISOString().split("T")[0]) + " - " + getShortDate(range.end.toISOString().split("T")[0]);
    lines.push("## " + modeLabel + " Overview");
    lines.push("**Range:** " + rangeLabel);
    lines.push("");
    for (const item of filtered) {
      lines.push("- [" + item.completedAt + "] **" + item.title + "** (" + item.source + ")");
      if (item.outcome) lines.push("  - Outcome: " + item.outcome);
      if (item.system) lines.push("  - System: " + item.system);
      if (item.mission) lines.push("  - Mission: " + item.mission);
    }
    const blob = new Blob([lines.join("\\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "history-" + view + "-" + new Date().toISOString().split("T")[0] + ".md";
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, view, range]);

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">History</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Journal outcomes and completed project items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView(view === "weekly" ? "monthly" : "weekly")}
            className="h-8 text-xs gap-1.5 border-zinc-700 text-zinc-300 hover:text-white">
            {view === "weekly" ? "Monthly" : "Weekly"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}
            className="h-8 text-xs gap-1.5 text-zinc-500 hover:text-zinc-300">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-zinc-100">Journal Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{filtered.filter(i => i.source === "journal").length}</p>
            <p className="text-xs text-zinc-500">completed in journals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-zinc-100">Project Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{filtered.filter(i => i.source === "project").length}</p>
            <p className="text-xs text-zinc-500">archived from projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-zinc-100">Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{filtered.length}</p>
            <p className="text-xs text-zinc-500">items in history</p>
          </CardContent>
        </Card>
      </div>

      {(allSystems.length > 0 || allMissions.length > 0) && (
        <Card>
          <CardContent className="pt-4 flex items-center gap-3 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            {allSystems.length > 0 && (
              <select value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 px-2 py-1.5 outline-none cursor-pointer">
                <option value="">All Systems</option>
                {allSystems.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {allMissions.length > 0 && (
              <select value={filterMission} onChange={(e) => setFilterMission(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 px-2 py-1.5 outline-none cursor-pointer">
                <option value="">All Missions</option>
                {allMissions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {(filterSystem || filterMission) && (
              <button onClick={() => { setFilterSystem(""); setFilterMission(""); }}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors underline">Clear</button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-zinc-100">History ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No history yet. Complete tasks in journals or move project cards to Done after 24 hours.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map((item, i) => (
                <div key={item.id + i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className={"w-2 h-2 rounded-full mt-1.5 shrink-0 " + (item.source === "journal" ? "bg-emerald-500" : "bg-blue-500")} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-zinc-200 font-medium">{item.title}</p>
                    {item.outcome && <p className="text-xs text-zinc-400"><span className="text-zinc-500">Outcome:</span> {item.outcome}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.source === "journal" ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Journal</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Project</span>
                      )}
                      {item.system && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{item.system}</span>}
                      {item.mission && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{item.mission}</span>}
                      <span className="text-[10px] text-zinc-500 ml-auto">{getShortDate(item.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
