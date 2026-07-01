import { useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Brain,
  Heart,
  Image,
  GitBranch,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DailyEntry, TimeRange } from "@/types";

function getDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function getShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ChartDataPoint {
  date: string;
  label: string;
  tasksCompleted: number;
  totalTasks: number;
  mentalAvg: number;
  physical: number;
}

export function InsightsPage() {
  const [entries] = useLocalStorage<Record<string, DailyEntry>>(
    "daily-tracker-entries",
    {}
  );
  const [timeRange, setTimeRange] = useLocalStorage<TimeRange>(
    "insights-time-range",
    "weekly"
  );

  const days = timeRange === "weekly" ? 7 : 30;

  const chartData: ChartDataPoint[] = useMemo(() => {
    const data: ChartDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = getDaysAgo(i);
      const entry = entries[dateStr];
      const mentalAvg = entry
        ? (entry.mentalStatus.morning +
            entry.mentalStatus.afternoon +
            entry.mentalStatus.night) /
          3
        : 0;
      const physVal =
        entry?.physicalStatus === "good"
          ? 7
          : entry?.physicalStatus === "sick"
            ? 4
            : entry?.physicalStatus === "critical"
              ? 1
              : 0;

      data.push({
        date: dateStr,
        label: getShortDate(dateStr),
        tasksCompleted: entry
          ? entry.tasks.filter((t) => t.task.trim() !== "").length
          : 0,
        totalTasks: entry?.tasks.length || 0,
        mentalAvg: Math.round(mentalAvg * 10) / 10,
        physical: physVal,
      });
    }
    return data;
  }, [entries, days]);

  const outcomeData = useMemo(() => {
    return chartData.map((d) => ({
      ...d,
      outcome: d.tasksCompleted,
    }));
  }, [chartData]);

  const hasData = Object.keys(entries).length > 0;

  const CustomTooltipContent = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 text-xs shadow-xl border border-zinc-700/50">
          <p className="text-zinc-400 mb-1.5 font-medium">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-zinc-200" style={{ color: p.color }}>
              {p.name}: <span className="font-semibold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Insights</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Visualize your patterns and progress</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!hasData ? (
        <Card className="glow-blue-subtle">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Data Yet</h3>
            <p className="text-sm text-zinc-500 text-center max-w-sm">
              Start tracking your daily activities in the Journal to see insights and trends here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Outcome History */}
          <Card className="glow-blue-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                Outcome History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomeData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="label"
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltipContent />} />
                    <Bar dataKey="outcome" name="Tasks" radius={[4, 4, 0, 0]}>
                      {outcomeData.map((d, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={d.outcome > 0 ? "#3b82f6" : "#27272a"}
                          fillOpacity={d.outcome > 0 ? 0.85 : 0.3}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Mental Graph */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                Mental Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="mentalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="label"
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 7]}
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      ticks={[1, 2, 3, 4, 5, 6, 7]}
                    />
                    <Tooltip content={<CustomTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="mentalAvg"
                      name="Mental Avg"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fill="url(#mentalGradient)"
                      dot={{ fill: "#a855f7", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#a855f7", stroke: "#1e1b4b", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Physical Graph */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-emerald-400" />
                </div>
                Physical Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="physicalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="label"
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 7]}
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      ticks={[1, 4, 7]}
                      tickFormatter={(val: number) =>
                        val === 7 ? "Good" : val === 4 ? "Sick" : val === 1 ? "Critical" : ""
                      }
                    />
                    <Tooltip content={<CustomTooltipContent />} />
                    <Area
                      type="stepAfter"
                      dataKey="physical"
                      name="Physical"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#physicalGradient)"
                      dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#10b981", stroke: "#064e3b", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {chartData.reduce((sum, d) => sum + d.tasksCompleted, 0)}
                  </p>
                  <p className="text-xs text-zinc-500">Total Tasks ({timeRange})</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {(
                      chartData.filter((d) => d.mentalAvg > 0).reduce((sum, d) => sum + d.mentalAvg, 0) /
                      Math.max(chartData.filter((d) => d.mentalAvg > 0).length, 1)
                    ).toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-500">Avg Mental Score</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {chartData.filter((d) => d.physical === 7).length}/{days}
                  </p>
                  <p className="text-xs text-zinc-500">Healthy Days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="group hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-400/10 flex items-center justify-center group-hover:from-blue-600/30 group-hover:to-blue-400/20 transition-all duration-300">
                  <Image className="w-7 h-7 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">Generate Infographic</h3>
                  <p className="text-xs text-zinc-500">Create a visual summary of your progress</p>
                </div>
                <Button variant="outline" size="sm">Generate</Button>
              </CardContent>
            </Card>
            <Card className="group hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-400/10 flex items-center justify-center group-hover:from-purple-600/30 group-hover:to-purple-400/20 transition-all duration-300">
                  <GitBranch className="w-7 h-7 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">Generate Mindmap</h3>
                  <p className="text-xs text-zinc-500">Map out connections between your activities</p>
                </div>
                <Button variant="outline" size="sm">Generate</Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
