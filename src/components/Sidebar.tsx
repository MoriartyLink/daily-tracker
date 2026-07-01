import { NavLink } from "react-router-dom";
import { BookOpen, FolderKanban, BarChart3, User, Cloud, HardDrive, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: BookOpen, label: "Journal" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const { isCloud, user, logout } = useData();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-full border-r border-zinc-800/60 bg-black/60 backdrop-blur-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-[60px]" : "w-[220px]"
        }`}
      >
        <div className="p-5 pb-6 flex items-center justify-between">
          {collapsed ? (
            <div className="w-full flex justify-center">
              <button
                onClick={() => setCollapsed(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between w-full">
                <h1 className="text-base font-bold text-zinc-100 tracking-tight truncate">Daily Tracker</h1>
                <button
                  onClick={() => setCollapsed(true)}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end={item.to === "/"}>
              <item.icon className="w-[18px] h-[18px]" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800/60 space-y-3">
          {!collapsed && (
            <>
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
            </>
          )}
        </div>
      </aside>
    </>
  );
}
