import { useState } from "react";
import {
  User,
  Target,
  Plus,
  Trash2,
  Save,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { UserProfile, Goal } from "@/types";

const defaultProfile: UserProfile = {
  name: "",
  avatar: "",
  goals: [],
};

function createEmptyGoal(): Goal {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    targetDate: "",
    progress: 0,
  };
}

export function ProfilePage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    "daily-tracker-profile",
    defaultProfile
  );
  const [saved, setSaved] = useState(false);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const addGoal = () => {
    updateProfile({ goals: [...profile.goals, createEmptyGoal()] });
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    updateProfile({
      goals: profile.goals.map((g) =>
        g.id === goalId ? { ...g, ...updates } : g
      ),
    });
  };

  const removeGoal = (goalId: string) => {
    updateProfile({ goals: profile.goals.filter((g) => g.id !== goalId) });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Profile</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your profile and set goals</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Info */}
      <Card className="glow-blue-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            Personal Info
          </CardTitle>
          <CardDescription>Your basic profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/20 overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
              <p className="text-[10px] text-zinc-600">Avatar</p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="profile-name" className="text-xs">Display Name</Label>
                <Input
                  id="profile-name"
                  placeholder="Enter your name"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="profile-avatar" className="text-xs">Avatar URL</Label>
                <Input
                  id="profile-avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={profile.avatar}
                  onChange={(e) => updateProfile({ avatar: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                Goal Setting
              </CardTitle>
              <CardDescription className="mt-1.5">
                Define your goals and track your progress
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addGoal} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.goals.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">No goals set yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Click "Add Goal" to define your objectives.</p>
            </div>
          ) : (
            profile.goals.map((goal, index) => (
              <div key={goal.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="group relative">
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 cursor-pointer z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Goal Title</Label>
                        <Input
                          placeholder="e.g., Read 12 books this year"
                          value={goal.title}
                          onChange={(e) =>
                            updateGoal(goal.id, { title: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Target Date</Label>
                        <Input
                          type="date"
                          value={goal.targetDate}
                          onChange={(e) =>
                            updateGoal(goal.id, { targetDate: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        placeholder="Describe your goal and how you plan to achieve it..."
                        value={goal.description}
                        onChange={(e) =>
                          updateGoal(goal.id, { description: e.target.value })
                        }
                        className="mt-1 min-h-[80px]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs">Progress</Label>
                        <span className="text-xs font-mono text-blue-400">
                          {goal.progress}%
                        </span>
                      </div>
                      <Progress value={goal.progress} />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) =>
                          updateGoal(goal.id, {
                            progress: parseInt(e.target.value),
                          })
                        }
                        className="w-full mt-2 accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const data = {
                entries: JSON.parse(
                  localStorage.getItem("daily-tracker-entries") || "{}"
                ),
                profile: JSON.parse(
                  localStorage.getItem("daily-tracker-profile") || "{}"
                ),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `daily-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target?.result as string);
                    if (data.entries)
                      localStorage.setItem(
                        "daily-tracker-entries",
                        JSON.stringify(data.entries)
                      );
                    if (data.profile)
                      localStorage.setItem(
                        "daily-tracker-profile",
                        JSON.stringify(data.profile)
                      );
                    window.location.reload();
                  } catch {
                    alert("Invalid backup file");
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
          >
            Import Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
