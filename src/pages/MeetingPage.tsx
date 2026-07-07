import { useCallback, useMemo } from "react";
import { Calendar, Clock, Bell, BellOff, FileText, Users, Plus, Trash2, ChevronRight, ArrowLeft, CheckCircle2, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Meeting } from "@/types";

function createMeeting(): Meeting {
  return {
    id: crypto.randomUUID(),
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    reminder: false,
    agenda: "",
    minutes: "",
    participants: [],
    createdAt: new Date().toISOString(),
  };
}

function formatDateLong(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function isUpcoming(date: string, time: string): boolean {
  if (!date) return false;
  const now = new Date();
  const meetingDate = new Date(date + "T" + (time || "00:00"));
  return meetingDate > now;
}

function getPersonName(people: { id: string; name: string }[], id: string): string {
  const p = people.find((p) => p.id === id);
  return p?.name || "Unknown";
}

function MeetingDetail({ meeting, people, projects, onUpdate, onDelete, onBack }: {
  meeting: Meeting;
  people: { id: string; name: string }[];
  projects: { id: string; title: string }[];
  onUpdate: (u: Partial<Meeting>) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const toggleParticipant = (personId: string) => {
    const current = meeting.participants || [];
    const next = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    onUpdate({ participants: next });
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
              {meeting.title || "New Meeting"}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {meeting.date ? formatDateLong(meeting.date) : "No date set"}
              {meeting.time ? ` at ${meeting.time}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUpcoming(meeting.date, meeting.time) && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Upcoming
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-xs border-red-800 text-red-400 hover:text-red-300">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <ListChecks className="w-4 h-4 text-blue-400" />
                Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Meeting agenda items..."
                value={meeting.agenda}
                onChange={(e) => onUpdate({ agenda: e.target.value })}
                className="min-h-[150px] text-sm bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <FileText className="w-4 h-4 text-amber-400" />
                Meeting Minutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Record meeting notes, decisions, action items..."
                value={meeting.minutes}
                onChange={(e) => onUpdate({ minutes: e.target.value })}
                className="min-h-[200px] text-sm bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <FileText className="w-4 h-4 text-emerald-400" />
                Related Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={meeting.relatedProjectId || ""}
                onChange={(e) => onUpdate({ relatedProjectId: e.target.value || undefined })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 px-3 py-2 outline-none cursor-pointer"
              >
                <option value="">No project linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title || "Untitled"}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-100">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-400">Title</Label>
                <Input value={meeting.title} onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Meeting title..."
                  className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Date</Label>
                <Input type="date" value={meeting.date} onChange={(e) => onUpdate({ date: e.target.value })}
                  className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Time</Label>
                <Input type="time" value={meeting.time} onChange={(e) => onUpdate({ time: e.target.value })}
                  className="mt-1.5 h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 cursor-pointer">Reminder</Label>
                <button
                  onClick={() => onUpdate({ reminder: !meeting.reminder })}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    meeting.reminder ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={meeting.reminder ? "Reminder on" : "Reminder off"}
                >
                  {meeting.reminder ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
              </div>
              {meeting.reminder && (
                <p className="text-[10px] text-emerald-400/70">Reminder will notify before the meeting</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                <Users className="w-4 h-4 text-blue-400" />
                Participants
                <span className="text-xs text-zinc-500 font-normal ml-1">
                  {(meeting.participants || []).length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {people.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No people added yet. Add people from the People tab first.
                </p>
              ) : (
                <div className="space-y-1 max-h-[250px] overflow-y-auto">
                  {people.map((person) => {
                    const isSelected = (meeting.participants || []).includes(person.id);
                    return (
                      <button key={person.id} onClick={() => toggleParticipant(person.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
                        }`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-blue-500" : "bg-zinc-600"}`} />
                        <span className="truncate flex-1">{person.name}</span>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />}
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

function MeetingList({ meetings, people, projects, onSelect, onAdd }: {
  meetings: Meeting[];
  people: { id: string; name: string }[];
  projects: { id: string; title: string }[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const sorted = useMemo(() => {
    return [...meetings].sort((a, b) => {
      const dateA = a.date + "T" + (a.time || "00:00");
      const dateB = b.date + "T" + (b.time || "00:00");
      return dateB.localeCompare(dateA);
    });
  }, [meetings]);

  const upcoming = sorted.filter((m) => isUpcoming(m.date, m.time));
  const past = sorted.filter((m) => !isUpcoming(m.date, m.time) || !m.date);

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Meetings</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage meetings, agendas, minutes, and participants</p>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" /> New Meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">No Meetings Yet</h3>
            <p className="text-sm text-zinc-400 text-center max-w-sm">
              Create your first meeting to start tracking agendas, minutes, and participants.
            </p>
            <Button onClick={onAdd} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Create Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Upcoming ({upcoming.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcoming.map((m) => (
                  <MeetingCard key={m.id} meeting={m} people={people} projects={projects} onSelect={() => onSelect(m.id)} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-400">Past Meetings ({past.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {past.map((m) => (
                  <MeetingCard key={m.id} meeting={m} people={people} projects={projects} onSelect={() => onSelect(m.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MeetingCard({ meeting, people, projects, onSelect }: {
  meeting: Meeting;
  people: { id: string; name: string }[];
  projects: { id: string; title: string }[];
  onSelect: () => void;
}) {
  const upcoming = isUpcoming(meeting.date, meeting.time);
  const relatedProject = meeting.relatedProjectId ? projects.find(p => p.id === meeting.relatedProjectId) : null;
  return (
    <Card className="group cursor-pointer hover:border-zinc-700 hover:shadow-md transition-all duration-300" onClick={onSelect}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-100 text-sm truncate">
              {meeting.title || "Untitled Meeting"}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Calendar className="w-3 h-3" />
                {meeting.date ? formatDateLong(meeting.date) : "No date"}
              </span>
              {meeting.time && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <Clock className="w-3 h-3" />{meeting.time}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {relatedProject && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
              <FileText className="w-2.5 h-2.5" />{relatedProject.title}
            </span>
          )}
          {upcoming && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />Upcoming
            </span>
          )}
          {meeting.reminder && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1">
              <Bell className="w-2.5 h-2.5" />Reminder
            </span>
          )}
          {(meeting.participants || []).length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />{(meeting.participants || []).length}
            </span>
          )}
        </div>
        {meeting.agenda && (
          <p className="text-xs text-zinc-500 line-clamp-2">{meeting.agenda}</p>
        )}
        {(meeting.participants || []).length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {meeting.participants.slice(0, 3).map((pid) => (
              <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {getPersonName(people, pid)}
              </span>
            ))}
            {(meeting.participants || []).length > 3 && (
              <span className="text-[10px] text-zinc-500">+{(meeting.participants || []).length - 3}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MeetingPage() {
  const { meetings, setMeetings, people, projects } = useData();
  const [selectedId, setSelectedId] = useLocalStorage<string | null>("meeting-selected", null);
  const selected = meetings.find((m) => m.id === selectedId) || null;

  const addMeeting = useCallback(() => {
    const m = createMeeting();
    setMeetings((prev) => [...prev, m]);
    setSelectedId(m.id);
  }, [setMeetings, setSelectedId]);

  const updateMeeting = useCallback((id: string, u: Partial<Meeting>) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, ...u } : m)));
  }, [setMeetings]);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setSelectedId(null);
  }, [setMeetings, setSelectedId]);

  if (selected) {
    return (
      <MeetingDetail
        meeting={selected}
        people={people}
        projects={projects}
        onUpdate={(u) => updateMeeting(selected.id, u)}
        onDelete={() => deleteMeeting(selected.id)}
        onBack={() => setSelectedId(null)}
      />
    );
  }
  return <MeetingList meetings={meetings} people={people} projects={projects} onSelect={setSelectedId} onAdd={addMeeting} />;
}
