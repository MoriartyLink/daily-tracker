import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Sidebar } from "@/components/Sidebar";
import { JournalPage } from "@/pages/JournalPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AuthPage } from "@/pages/AuthPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <ProtectedRoute>
      <Sidebar />
      <main
        className="p-6 pb-12 transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? 60 : 220 }}
      >
        {children}
      </main>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<AppLayout><JournalPage /></AppLayout>} />
            <Route path="/projects" element={<AppLayout><ProjectPage /></AppLayout>} />
            <Route path="/insights" element={<AppLayout><InsightsPage /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
          </Routes>
        </SidebarProvider>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
