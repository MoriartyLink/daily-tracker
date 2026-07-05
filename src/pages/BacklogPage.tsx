import { useState, useCallback } from "react";
import { Brain, Plus, Trash2, CheckCircle2, Archive, Lightbulb, ListChecks, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import type { BacklogItem, CynefinDomain } from "@/types";
import { CYNFEIN_DOMAINS } from "@/types";

function createBacklogItem(type: BacklogItem["type"] = "braindump"): BacklogItem {
  return {
    id: crypto.randomUUID(),
    content: "",
    type,
    cynefinDomain: "disorder",
    createdAt: new Date().toISOString(),
    tags: [],
    done: false,
  };
}

const TYPE_CONFIG = {
  braindump: { icon: Brain, label: "Brain Dump", color: "text-purple-400", bg: "bg-purple-500/10" },
  note: { icon: Lightbulb, label: "Note", color: "text-amber-400", bg: "bg-amber-500/10" },
  followup: { icon: ListChecks, label: "Follow-up", color: "text-blue-400", bg: "bg-blue-500/10" },
} as const;

function getDomainColor(domain: CynefinDomain): string {
  return CYNFEIN_DOMAINS.find((d) => d.id === domain)?.color || "#8b5cf6";
}

// ── Brain Dump Input ──
function BrainDumpInput({ onAdd }: { onAdd: (content: string, type: BacklogItem["type"]) => void }) {
  const [text, setText] = useState("");
  const [type, setType] = useState<BacklogItem["type"]>("braindump");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), type);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <Card className="border-blue-500/20 glow-blue-subtle">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
          <Brain className="w-4 h-4 text-purple-400" />
          Quick Brain Dump
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Capture thoughts, ideas, and follow-ups as they come. Don't filter — just dump.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Textarea
            placeholder="What's on your mind? Ideas, tasks, worries, anything... (Cmd/Ctrl+Enter to add)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] text-sm bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(["braindump", "note", "followup"] as const).map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors cursor-pointer ${
                      type === t
                        ? `${cfg.bg} ${cfg.color} border border-current`
                        : "text-zinc-500 bg-zinc-900 border border-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <cfg.icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={!text.trim()} className="h-8 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Cynefin View ──
function CynefinView({
  items,
  onUpdate,
  onDelete,
}: {
  items: BacklogItem[];
  onUpdate: (id: string, u: Partial<BacklogItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const activeItems = items.filter((i) => !i.done);
  const doneItems = items.filter((i) => i.done);

  return (
    <div className="space-y-4">
      {/* Cynefin Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {CYNFEIN_DOMAINS.map((domain) => {
          const domainItems = activeItems.filter((i) => i.cynefinDomain === domain.id);
          return (
            <Card key={domain.id} className="border-zinc-800" style={{ borderTopColor: domain.color, borderTopWidth: 2 }}>
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold" style={{ color: domain.color }}>
                    {domain.title}
                  </CardTitle>
                  <span className="text-[10px] text-zinc-500">{domainItems.length}</span>
                </div>
                <CardDescription className="text-[9px] text-zinc-500 leading-tight mt-0.5">
                  {domain.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {domainItems.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Drop items here</p>
                  ) : (
                    domainItems.map((item) => (
                      <div key={item.id} className="group relative p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => onUpdate(item.id, { done: true })}
                            className="mt-0.5 w-3.5 h-3.5 rounded border border-zinc-600 hover:border-emerald-500 flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-zinc-300 break-words whitespace-normal">{item.content}</p>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {(() => {
                                const cfg = TYPE_CONFIG[item.type];
                                return (
                                  <span className={`text-[8px] px-1 py-0.5 rounded ${item.type !== "braindump" ? cfg.bg + " " + cfg.color : "text-zinc-500 bg-zinc-800"}`}>
                                    {cfg.label}
                                  </span>
                                );
                              })()}
                              {/* Domain selector */}
                              <select
                                value={item.cynefinDomain}
                                onChange={(e) => onUpdate(item.id, { cynefinDomain: e.target.value as CynefinDomain })}
                                className="text-[8px] bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-400 outline-none cursor-pointer"
                                style={{ color: getDomainColor(item.cynefinDomain) }}
                              >
                                {CYNFEIN_DOMAINS.map((d) => (
                                  <option key={d.id} value={d.id}>{d.title}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Done items */}
      {doneItems.length > 0 && (
        <Card className="border-zinc-800">
          <CardHeader
            className="pb-2 px-4 pt-3 cursor-pointer"
            onClick={() => setCollapsed((prev) => ({ ...prev, done: !prev.done }))}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs text-zinc-400">
                {collapsed.done ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <Archive className="w-3 h-3" />
                Done ({doneItems.length})
              </CardTitle>
            </div>
          </CardHeader>
          {!collapsed.done && (
            <CardContent className="px-4 pb-3">
              <div className="space-y-1.5">
                {doneItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 opacity-60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <p className="text-[11px] text-zinc-400 line-through flex-1 min-w-0">{item.content}</p>
                    <span className="text-[8px] text-zinc-600" style={{ color: getDomainColor(item.cynefinDomain) }}>
                      {CYNFEIN_DOMAINS.find((d) => d.id === item.cynefinDomain)?.title}
                    </span>
                    <button onClick={() => onUpdate(item.id, { done: false })}
                      className="text-zinc-500 hover:text-zinc-300 text-[9px] cursor-pointer shrink-0">
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Main ──
export function BacklogPage() {
  const { backlogItems, setBacklogItems } = useData();
  const [view, setView] = useState<"cynefin" | "list">("cynefin");

  const addItem = useCallback((content: string, type: BacklogItem["type"]) => {
    const item = createBacklogItem(type);
    item.content = content;
    setBacklogItems((prev) => [item, ...prev]);
  }, [setBacklogItems]);

  const updateItem = useCallback((id: string, u: Partial<BacklogItem>) => {
    setBacklogItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...u } : i)));
  }, [setBacklogItems]);

  const deleteItem = useCallback((id: string) => {
    setBacklogItems((prev) => prev.filter((i) => i.id !== id));
  }, [setBacklogItems]);

  const clearDone = useCallback(() => {
    setBacklogItems((prev) => prev.filter((i) => !i.done));
  }, [setBacklogItems]);

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Backlog</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Brain dump compiler — capture everything, organize with Cynefin framework
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "cynefin" ? "list" : "cynefin")}
            className="h-8 text-xs gap-1.5 border-zinc-700 text-zinc-300 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {view === "cynefin" ? "List View" : "Cynefin View"}
          </Button>
          {backlogItems.filter((i) => i.done).length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearDone}
              className="h-8 text-xs gap-1.5 text-zinc-500 hover:text-zinc-300">
              <Trash2 className="w-3.5 h-3.5" /> Clear Done
            </Button>
          )}
        </div>
      </div>

      {/* Brain Dump Input */}
      <BrainDumpInput onAdd={addItem} />

      {/* Items Count */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>Total: {backlogItems.length}</span>
        <span>Active: {backlogItems.filter((i) => !i.done).length}</span>
        <span>Done: {backlogItems.filter((i) => i.done).length}</span>
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-400" />
          {backlogItems.filter((i) => i.type === "braindump").length}
        </span>
        <span className="flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          {backlogItems.filter((i) => i.type === "note").length}
        </span>
        <span className="flex items-center gap-1">
          <ListChecks className="w-3 h-3 text-blue-400" />
          {backlogItems.filter((i) => i.type === "followup").length}
        </span>
      </div>

      {backlogItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Empty Backlog</h3>
            <p className="text-sm text-zinc-400 text-center max-w-sm">
              Use the brain dump box above to capture thoughts, ideas, and follow-ups.
              The Cynefin framework will help you organize them by complexity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CynefinView items={backlogItems} onUpdate={updateItem} onDelete={deleteItem} />
      )}

      {/* Cynefin Legend */}
      <Card className="border-zinc-800">
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-xs text-zinc-400">Cynefin Framework Legend</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-[10px] text-zinc-500">
            {CYNFEIN_DOMAINS.map((d) => (
              <div key={d.id} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: d.color }} />
                <div>
                  <span style={{ color: d.color }} className="font-medium">{d.title}</span>
                  <p>{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
