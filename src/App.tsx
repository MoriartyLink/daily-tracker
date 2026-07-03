import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { DataProvider } from "@/contexts/DataContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Sidebar } from "@/components/Sidebar";
import { JournalPage } from "@/pages/JournalPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SearchPage } from "@/pages/SearchPage";
import "@/types/electron";

function MenuListener() {
  const navigate = useNavigate();
  const { setCollapsed, collapsed } = useSidebar();

  useEffect(() => {
    if (!window.electronAPI) return;
    const cleanups = [
      window.electronAPI.onMenuNavigate((path: string) => navigate(path)),
      window.electronAPI.onMenuToggleSidebar(() => setCollapsed(!collapsed)),
    ];
    return () => cleanups.forEach(fn => fn());
  }, [navigate, setCollapsed, collapsed]);

  return null;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <>
      <Sidebar />
      <main
        className="p-6 pb-12 transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? 60 : 220 }}
      >
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <DataProvider>
        <SidebarProvider>
          <MenuListener />
          <Routes>
            <Route path="/" element={<AppLayout><JournalPage /></AppLayout>} />
            <Route path="/projects" element={<AppLayout><ProjectPage /></AppLayout>} />
            <Route path="/insights" element={<AppLayout><InsightsPage /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
            <Route path="/search" element={<AppLayout><SearchPage /></AppLayout>} />
          </Routes>
        </SidebarProvider>
      </DataProvider>
    </HashRouter>
  );
}

export default App;
