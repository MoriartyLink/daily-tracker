import { NavLink } from "react-router-dom";
import { BookOpen, FolderKanban, BarChart3, User, Sparkles, Cloud, HardDrive, LogOut } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: BookOpen, label: "Journal" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const { isCloud, user, logout } = useData();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-zinc-800/60 bg-black/60 backdrop-blur-xl z-50 flex flex-col">
      <div className="p-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100 tracking-tight">Daily Tracker</h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Track · Reflect · Grow</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end={item.to === "/"}>
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800/60 space-y-3">
        <div className="rounded-lg bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 p-3 flex items-center justify-center gap-2">
          {isCloud ? (
            <><Cloud className="w-3.5 h-3.5 text-blue-400" /><span className="text-[11px] text-zinc-400">Synced with Supabase</span></>
          ) : (
            <><HardDrive className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[11px] text-zinc-500">Local storage</span></>
          )}
        </div>
        {user && (
          <div className="rounded-lg bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 p-3">
            <p className="text-xs text-zinc-300 truncate mb-2">{user.email}</p>
            <Button variant="outline" size="sm" onClick={logout} className="w-full h-8 text-xs gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
