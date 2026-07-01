import { NavLink } from "react-router-dom";
import {
  BookOpen,
  BarChart3,
  User,
  Sparkles,
} from "lucide-react";

const navItems = [
  { to: "/", icon: BookOpen, label: "Journal" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl z-50 flex flex-col">
      {/* Logo */}
      <div className="p-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Daily Tracker</h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Track · Reflect · Grow</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
            end={item.to === "/"}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-[11px] text-zinc-500">Data stored locally</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">in your browser</p>
        </div>
      </div>
    </aside>
  );
}
