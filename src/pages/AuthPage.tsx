import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("Supabase not configured") || msg.includes("supabase")) {
        setError("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.");
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-xs text-zinc-300">Email</Label>
        <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-xs text-zinc-300">Password</Label>
        <div className="relative">
          <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 pr-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
    </form>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signup } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(email, password);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.includes("Supabase not configured") || msg.includes("supabase")) {
        setError("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.");
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="text-xs text-zinc-300">Full Name</Label>
        <Input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-xs text-zinc-300">Email</Label>
        <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-xs text-zinc-300">Password</Label>
        <div className="relative">
          <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10 pr-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
    </form>
  );
}

export function AuthPage() {
  const navigate = useNavigate();

  const handleSuccess = () => navigate("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-sm shadow-lg border-zinc-800/60 bg-zinc-950/60 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-2">
            <User className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-xl tracking-tight text-zinc-100">Daily Tracker</CardTitle>
          <CardDescription className="text-sm text-zinc-400">Track · Reflect · Grow</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-zinc-900">
              <TabsTrigger value="login" className="h-7 text-xs text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">Login</TabsTrigger>
              <TabsTrigger value="signup" className="h-7 text-xs text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignupForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
