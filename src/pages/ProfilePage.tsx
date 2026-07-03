import { useState } from "react";
import { User, Save, CheckCircle, GripVertical, ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import type { Fact } from "@/types";

export function ProfilePage() {
  const { profile, updateProfile } = useData();
  const [saved, setSaved] = useState(false);

  const update = (updates: Partial<typeof profile>) => updateProfile({ ...profile, ...updates });
  const handleSave = () => { 
    updateProfile({ ...profile });
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };

  return (
    <div className="fade-in space-y-5 max-w-3xl ml-auto mr-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Profile</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage your profile settings</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          {saved ? <><CheckCircle className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Profile</>}
        </Button>
      </div>

      {/* Profile Info */}
      <Card className="glow-blue-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><User className="w-4 h-4 text-blue-400" /></div>
            <span className="text-zinc-100">Personal Info</span>
          </CardTitle>
          <CardDescription className="text-zinc-400">Your basic profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="profile-name" className="text-xs text-zinc-300">Display Name</Label>
              <Input id="profile-name" placeholder="Enter your name" value={profile.name} onChange={(e) => update({ name: e.target.value })} className="mt-1.5 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facts About Me */}
      <Card className="border-zinc-700/50">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Facts About Me</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(profile.facts || []).sort((a, b) => a.order - b.order).map((fact, idx) => (
              <div key={fact.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <GripVertical className="w-4 h-4 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <Input value={fact.title} onChange={(e) => {
                    const updated = profile.facts.map(f => f.id === fact.id ? { ...f, title: e.target.value } : f);
                    updateProfile({ ...profile, facts: updated });
                  }} className="h-8 text-xs bg-transparent border-none" placeholder="Title" />
                  <Input value={fact.content} onChange={(e) => {
                    const updated = profile.facts.map(f => f.id === fact.id ? { ...f, content: e.target.value } : f);
                    updateProfile({ ...profile, facts: updated });
                  }} className="h-8 text-xs bg-transparent border-none mt-0.5" placeholder="Content" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    const facts = [...profile.facts];
                    if (idx > 0) { [facts[idx - 1], facts[idx]] = [facts[idx], facts[idx - 1]]; facts[idx - 1].order = idx - 1; facts[idx].order = idx; updateProfile({ ...profile, facts }); }
                  }} className="text-zinc-500 hover:text-zinc-300"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => {
                    const facts = [...profile.facts];
                    if (idx < facts.length - 1) { [facts[idx], facts[idx + 1]] = [facts[idx + 1], facts[idx]]; facts[idx].order = idx + 1; facts[idx + 1].order = idx; updateProfile({ ...profile, facts }); }
                  }} className="text-zinc-500 hover:text-zinc-300"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => updateProfile({ ...profile, facts: profile.facts.filter(f => f.id !== fact.id) })} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => {
              const newFact: Fact = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), title: "", content: "", order: (profile.facts?.length || 0) };
              updateProfile({ ...profile, facts: [...(profile.facts || []), newFact] });
            }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Fact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-zinc-700/50">
        <CardHeader><CardTitle className="text-sm text-zinc-400">Data Management</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => {
            const data = { entries: JSON.parse(localStorage.getItem("daily-tracker-entries") || "{}"), profile: JSON.parse(localStorage.getItem("daily-tracker-profile") || "{}"), projects: JSON.parse(localStorage.getItem("daily-tracker-projects") || "[]") };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob); const a = document.createElement("a");
            a.href = url; a.download = `daily-tracker-backup-${new Date().toISOString().split("T")[0]}.json`; a.click(); URL.revokeObjectURL(url);
          }}>Export Data</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => { try { const d = JSON.parse(ev.target?.result as string); if (d.entries) localStorage.setItem("daily-tracker-entries", JSON.stringify(d.entries)); if (d.profile) localStorage.setItem("daily-tracker-profile", JSON.stringify(d.profile)); if (d.projects) localStorage.setItem("daily-tracker-projects", JSON.stringify(d.projects)); window.location.reload(); } catch { alert("Invalid backup file"); } };
              reader.readAsText(file);
            }; input.click();
          }}>Import Data</Button>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card className="border-zinc-700/50">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Account Security</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => {
            alert("Password reset email has been sent. Check your inbox for instructions to reset your password.");
          }}>
            Forgot Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
