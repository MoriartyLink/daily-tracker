import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { JournalPage } from "@/pages/JournalPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { ProfilePage } from "@/pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <div className="bg-animated min-h-screen">
        <Sidebar />
        <main className="ml-[220px] p-6 pb-12">
          <Routes>
            <Route path="/" element={<JournalPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
