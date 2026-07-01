import { useMemo } from "react";
import { BarChart3, Brain, Heart, Image, GitBranch, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import type { TimeRange } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

function getDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function getShortDate(s: string) { return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export function InsightsPage() {
  const { entries } = useData();
  const [timeRange, setTimeRange] = useLocalStorage<TimeRange>("insights-time-range", "weekly");
  const days = timeRange === "weekly" ? 7 : 30;

  const chartData = useMemo(() => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = getDaysAgo(i);
      const entry = entries[dateStr];
      const mentalAvg = entry ? (entry.mentalStatus.morning + entry.mentalStatus.afternoon + entry.mentalStatus.night) / 3 : 0;
      const physVal = entry?.physicalStatus === "good" ? 3 : entry?.physicalStatus === "sick" ? 2 : entry?.physicalStatus === "critical" ? 1 : 0;
      data.push({ date: dateStr, label: getShortDate(dateStr), tasksCompleted: entry ? entry.tasks.filter((t) => t.task.trim() !== "").length : 0, totalTasks: entry?.tasks.length || 0, mentalAvg: Math.round(mentalAvg * 10) / 10, physical: physVal, outcome: entry ? entry.tasks.filter((t) => t.task.trim() !== "").length : 0 });
    }
    return data;
  }, [entries, days]);

  const hasData = Object.keys(entries).length > 0;

  const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-zinc-300 mb-1.5 font-medium">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>)}
      </div>
    );
  };

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Insights</h2>
          <p className="text-sm text-slate-400 mt-0.5">Visualize your patterns and progress</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList><TabsTrigger value="weekly">Weekly</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger></TabsList>
        </Tabs>
      </div>

      {!hasData ? (
        <Card className="glow-blue-subtle"><CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4"><BarChart3 className="w-8 h-8 text-blue-400" /></div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">No Data Yet</h3>
          <p className="text-sm text-slate-400 text-center max-w-sm">Start tracking in the Journal to see insights here.</p>
        </CardContent></Card>
      ) : (<>
        {/* Mental Health */}
        <Card className="glow-blue-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center"><Brain className="w-4 h-4 text-purple-400" /></div>
              <span className="text-slate-100">Mental Health Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="mentalG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 3]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} ticks={[1, 2, 3]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="mentalAvg" name="Mental" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#mentalG)" dot={{ fill: "#8b5cf6", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Physical Health */}
        <Card className="glow-blue-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Heart className="w-4 h-4 text-emerald-400" /></div>
              <span className="text-slate-100">Physical Health Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="physG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 3]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} ticks={[1, 2, 3]} tickFormatter={(v: number) => v === 3 ? "Good" : v === 2 ? "Sick" : v === 1 ? "Critical" : ""} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="stepAfter" dataKey="physical" name="Physical" stroke="#10b981" strokeWidth={2.5} fill="url(#physG)" dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center"><Activity className="w-6 h-6 text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-slate-100">{chartData.reduce((s, d) => s + d.tasksCompleted, 0)}</p><p className="text-xs text-slate-400">Total Tasks ({timeRange})</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center"><Brain className="w-6 h-6 text-purple-400" /></div>
            <div><p className="text-2xl font-bold text-slate-100">{(chartData.filter((d) => d.mentalAvg > 0).reduce((s, d) => s + d.mentalAvg, 0) / Math.max(chartData.filter((d) => d.mentalAvg > 0).length, 1)).toFixed(1)}</p><p className="text-xs text-slate-400">Avg Mental Score</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Heart className="w-6 h-6 text-emerald-400" /></div>
            <div><p className="text-2xl font-bold text-slate-100">{chartData.filter((d) => d.physical === 3).length}/{days}</p><p className="text-xs text-slate-400">Healthy Days</p></div>
          </CardContent></Card>
        </div>

        {/* Generate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="group hover:border-blue-500/30 transition-all duration-300 cursor-pointer"><CardContent className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all"><Image className="w-7 h-7 text-blue-400" /></div>
            <div className="flex-1"><h3 className="text-sm font-semibold text-slate-100 mb-1">Generate Infographic</h3><p className="text-xs text-slate-400">Create a visual summary of your progress</p></div>
            <Button variant="outline" size="sm">Generate</Button>
          </CardContent></Card>
          <Card className="group hover:border-purple-500/30 transition-all duration-300 cursor-pointer"><CardContent className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all"><GitBranch className="w-7 h-7 text-purple-400" /></div>
            <div className="flex-1"><h3 className="text-sm font-semibold text-slate-100 mb-1">Generate Mindmap</h3><p className="text-xs text-slate-400">Map connections between your activities</p></div>
            <Button variant="outline" size="sm">Generate</Button>
          </CardContent></Card>
        </div>
      </>)}
    </div>
  );
}
