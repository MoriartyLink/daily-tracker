import { useState, useCallback, useRef, useEffect } from "react";
import { Users, User, Plus, Trash2, ChevronRight, ArrowLeft, Target, Heart, Mail, MessageCircle, Link2, Network, PenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Person } from "@/types";

function createPerson(): Person {
  return {
    id: crypto.randomUUID(),
    name: "",
    relationshipStatus: "",
    wants: "",
    goal: "",
    telegramUsername: "",
    email: "",
    notes: "",
    connections: [],
    createdAt: new Date().toISOString(),
  };
}

const RELATIONSHIP_OPTIONS = [
  "Friend", "Colleague", "Family", "Mentor", "Partner",
  "Client", "Team Member", "Acquaintance", "Network", "Other",
];

// ── Whiteboard Component ──
interface WhiteboardNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  personId?: string;
}

interface WhiteboardLine {
  id: string;
  fromId: string;
  toId: string;
}

const NOTE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#6366f1"];

function CanvasWhiteboard({ people }: { people: Person[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [notes, setNotes] = useState<WhiteboardNote[]>(() => {
    try {
      const saved = localStorage.getItem("daily-tracker-whiteboard");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [lines, setLines] = useState<WhiteboardLine[]>(() => {
    try {
      const saved = localStorage.getItem("daily-tracker-whiteboard-lines");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<"free" | "connect" | "note">("free");
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingNote, setDraggingNote] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Save state
  useEffect(() => {
    localStorage.setItem("daily-tracker-whiteboard", JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("daily-tracker-whiteboard-lines", JSON.stringify(lines));
  }, [lines]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = Math.max(400, rect.height);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid background
    ctx.strokeStyle = "rgba(63, 63, 70, 0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw lines
    for (const line of lines) {
      const from = notes.find((n) => n.id === line.fromId);
      const to = notes.find((n) => n.id === line.toId);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x + 60, from.y + 25);
        ctx.lineTo(to.x + 60, to.y + 25);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        ctx.beginPath();
        ctx.moveTo(to.x + 60, to.y + 25);
        ctx.lineTo(to.x + 60 - 10 * Math.cos(angle - 0.3), to.y + 25 - 10 * Math.sin(angle - 0.3));
        ctx.lineTo(to.x + 60 - 10 * Math.cos(angle + 0.3), to.y + 25 + 10 * Math.sin(angle + 0.3));
        ctx.closePath();
        ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
        ctx.fill();
      }
    }

    // Draw notes
    for (const note of notes) {
      const x = note.x;
      const y = note.y;
      const w = 120;
      const h = 50;

      ctx.fillStyle = note.color + "CC";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const displayText = note.text.length > 15 ? note.text.substring(0, 15) + "..." : note.text;
      ctx.fillText(displayText || "Empty", x + w / 2, y + h / 2);
    }

    // Connecting line
    if (connectingFrom) {
      const from = notes.find((n) => n.id === connectingFrom);
      if (from && lastPos) {
        ctx.beginPath();
        ctx.moveTo(from.x + 60, from.y + 25);
        ctx.lineTo(lastPos.x, lastPos.y);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [notes, lines, connectingFrom, lastPos]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const findNoteAt = (pos: { x: number; y: number }) => {
    return notes.find((n) => pos.x >= n.x && pos.x <= n.x + 120 && pos.y >= n.y && pos.y <= n.y + 50);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const hitNote = findNoteAt(pos);

    if (drawMode === "note") {
      const newNote: WhiteboardNote = {
        id: Date.now().toString(),
        x: pos.x - 60,
        y: pos.y - 25,
        text: "",
        color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
      };
      setNotes((prev) => [...prev, newNote]);
      const text = prompt("Enter note text:");
      if (text) {
        setNotes((prev) => prev.map((n) => n.id === newNote.id ? { ...n, text } : n));
      }
      return;
    }

    if (drawMode === "connect") {
      if (hitNote) {
        if (!connectingFrom) {
          setConnectingFrom(hitNote.id);
        } else {
          if (hitNote.id !== connectingFrom) {
            setLines((prev) => [...prev, { id: Date.now().toString(), fromId: connectingFrom, toId: hitNote.id }]);
          }
          setConnectingFrom(null);
        }
      } else {
        setConnectingFrom(null);
      }
      return;
    }

    if (hitNote) {
      setDraggingNote(hitNote.id);
      setLastPos({ x: pos.x - hitNote.x, y: pos.y - hitNote.y });
    } else {
      setIsDrawing(true);
      setLastPos(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (draggingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === draggingNote ? { ...n, x: pos.x - (lastPos?.x || 0), y: pos.y - (lastPos?.y || 0) } : n
        )
      );
    }

    if (connectingFrom) {
      setLastPos(pos);
    }

    if (isDrawing && drawMode === "free" && lastPos) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
      ctx.lineWidth = 3;
      ctx.stroke();
      setLastPos(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDraggingNote(null);
  };

  const clearCanvas = () => {
    setNotes([]);
    setLines([]);
    localStorage.removeItem("daily-tracker-whiteboard");
    localStorage.removeItem("daily-tracker-whiteboard-lines");
  };

  const addPersonNote = (person: Person) => {
    const existing = notes.find((n) => n.personId === person.id);
    if (existing) return;
    const newNote: WhiteboardNote = {
      id: Date.now().toString(),
      x: 50 + (notes.length % 5) * 140,
      y: 50 + Math.floor(notes.length / 5) * 80,
      text: person.name || "Unknown",
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
      personId: person.id,
    };
    setNotes((prev) => [...prev, newNote]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant={drawMode === "free" ? "default" : "outline"}
            onClick={() => { setDrawMode("free"); setConnectingFrom(null); }}
            className="h-7 text-[10px] gap-1">
            <PenLine className="w-3 h-3" />Free Draw
          </Button>
          <Button size="sm" variant={drawMode === "connect" ? "default" : "outline"}
            onClick={() => { setDrawMode("connect"); setConnectingFrom(null); }}
            className="h-7 text-[10px] gap-1">
            <Link2 className="w-3 h-3" />Connect
          </Button>
          <Button size="sm" variant={drawMode === "note" ? "default" : "outline"}
            onClick={() => { setDrawMode("note"); setConnectingFrom(null); }}
            className="h-7 text-[10px] gap-1">
            <Plus className="w-3 h-3" />Add Note
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {people.map((p) => (
            <button key={p.id} onClick={() => addPersonNote(p)}
              title={`Add ${p.name} to board`}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer">
              +{p.name}
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={clearCanvas}
            className="h-7 text-[10px] text-red-400 hover:text-red-300 gap-1">
            <Trash2 className="w-3 h-3" />Clear
          </Button>
        </div>
      </div>
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950" style={{ height: "500px" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <p className="text-[10px] text-zinc-500">
        Draw: Click & drag to sketch • Connect: Click one note then another to link • Note: Click to add a sticky note
      </p>
    </div>
  );
}

// ── Person Detail View ──
function PersonDetail({ person, people, onUpdate, onDelete, onBack }: {
  person: Person;
  people: Person[];
  onUpdate: (u: Partial<Person>) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const others = people.filter((p) => p.id !== person.id);

  const toggleConnection = (personId: string) => {
    const current = person.connections || [];
    const next = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    onUpdate({ connections: next });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {person.name || "New Person"}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">Manage contact details and connections</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onDelete}
          className="gap-1.5 text-xs border-red-800 text-red-400 hover:text-red-300">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <User className="w-4 h-4 text-blue-400" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-zinc-400">Name</Label>
                  <Input value={person.name} onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="Full name..."
                    className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Relationship</Label>
                  <select value={person.relationshipStatus}
                    onChange={(e) => onUpdate({ relationshipStatus: e.target.value })}
                    className="mt-1.5 w-full h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 outline-none cursor-pointer">
                    <option value="">Select...</option>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-zinc-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <Input type="email" value={person.email} onChange={(e) => onUpdate({ email: e.target.value })}
                    placeholder="email@example.com"
                    className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> Telegram
                  </Label>
                  <Input value={person.telegramUsername} onChange={(e) => onUpdate({ telegramUsername: e.target.value })}
                    placeholder="@username"
                    className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals & Wants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <Target className="w-4 h-4 text-amber-400" />
                Goals & Desires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-400">What they want</Label>
                <Input value={person.wants} onChange={(e) => onUpdate({ wants: e.target.value })}
                  placeholder="What is this person looking for?"
                  className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Their goal</Label>
                <Input value={person.goal} onChange={(e) => onUpdate({ goal: e.target.value })}
                  placeholder="What are they working towards?"
                  className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <Heart className="w-4 h-4 text-rose-400" />
                Notes & Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={person.notes} onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="How are they connected with meetings, tasks, projects? Any relevant context..."
                className="min-h-[120px] text-sm bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Relationship Status Badge */}
          {person.relationshipStatus && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-zinc-300">{person.relationshipStatus}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <Network className="w-4 h-4 text-emerald-400" />
                Connections
                <span className="text-xs text-zinc-500 font-normal ml-1">
                  {(person.connections || []).length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {others.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No other people to connect with.</p>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {others.map((other) => {
                    const isConnected = (person.connections || []).includes(other.id);
                    return (
                      <button key={other.id} onClick={() => toggleConnection(other.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          isConnected
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
                        }`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? "bg-emerald-500" : "bg-zinc-600"}`} />
                        <span className="truncate flex-1">{other.name}</span>
                        {other.relationshipStatus && (
                          <span className="text-[9px] text-zinc-500">{other.relationshipStatus}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Person List View ──
function PersonCard({ person, onSelect }: {
  person: Person;
  onSelect: () => void;
}) {
  const connected = (person.connections || []).length;
  return (
    <Card className="group cursor-pointer hover:border-zinc-700 hover:shadow-md transition-all duration-300" onClick={onSelect}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {(person.name || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100 text-sm truncate">
                {person.name || "Unnamed"}
              </h3>
              {person.relationshipStatus && (
                <p className="text-[10px] text-zinc-400 mt-0.5">{person.relationshipStatus}</p>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {person.goal && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 truncate max-w-[150px]">
              🎯 {person.goal}
            </span>
          )}
          {connected > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              {connected} connection{connected !== 1 ? "s" : ""}
            </span>
          )}
          {person.email && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{person.email}</span>
          )}
        </div>

        {person.wants && (
          <p className="text-xs text-zinc-500 line-clamp-1">💡 {person.wants}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PersonList({ people, onSelect, onAdd }: {
  people: Person[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">People</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Manage contacts, relationships, goals, and brainstorm connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowWhiteboard(!showWhiteboard)}
            className="gap-1.5 text-xs h-8 border-zinc-700 text-zinc-300 hover:text-white">
            <Network className="w-3.5 h-3.5" />
            {showWhiteboard ? "Hide Board" : "Whiteboard"}
          </Button>
          <Button onClick={onAdd} className="gap-2">
            <Plus className="w-4 h-4" /> New Person
          </Button>
        </div>
      </div>

      {showWhiteboard && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
              <PenLine className="w-4 h-4 text-orange-400" />
              Brainstorm Board
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Visualize connections between people. Click person names to add them as sticky notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CanvasWhiteboard people={people} />
          </CardContent>
        </Card>
      )}

      {people.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">No People Yet</h3>
            <p className="text-sm text-zinc-400 text-center max-w-sm">
              Add people to track relationships, goals, and connections with meetings and projects.
            </p>
            <Button onClick={onAdd} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add Person
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={() => onSelect(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──
export function PeoplePage() {
  const { people, setPeople } = useData();
  const [selectedId, setSelectedId] = useLocalStorage<string | null>("people-selected", null);
  const selected = people.find((p) => p.id === selectedId) || null;

  const addPerson = useCallback(() => {
    const p = createPerson();
    setPeople((prev) => [...prev, p]);
    setSelectedId(p.id);
  }, [setPeople, setSelectedId]);

  const updatePerson = useCallback((id: string, u: Partial<Person>) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...u } : p)));
  }, [setPeople]);

  const deletePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  }, [setPeople, setSelectedId]);

  if (selected) {
    return (
      <PersonDetail
        person={selected}
        people={people}
        onUpdate={(u) => updatePerson(selected.id, u)}
        onDelete={() => deletePerson(selected.id)}
        onBack={() => setSelectedId(null)}
      />
    );
  }
  return <PersonList people={people} onSelect={setSelectedId} onAdd={addPerson} />;
}
