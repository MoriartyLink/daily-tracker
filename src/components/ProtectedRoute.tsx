import { Navigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useData();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}
