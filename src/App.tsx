import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { Sidebar } from "@/components/Sidebar";
import { JournalPage } from "@/pages/JournalPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AuthPage } from "@/pages/AuthPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Sidebar /><main className="ml-[220px] p-6 pb-12"><JournalPage /></main></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Sidebar /><main className="ml-[220px] p-6 pb-12"><ProjectPage /></main></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Sidebar /><main className="ml-[220px] p-6 pb-12"><InsightsPage /></main></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Sidebar /><main className="ml-[220px] p-6 pb-12"><ProfilePage /></main></ProtectedRoute>} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
