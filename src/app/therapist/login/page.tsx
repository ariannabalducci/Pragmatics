"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserCog, Lock, User, LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

function TherapistLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if we came back from a NextAuth error
  useEffect(() => {
    if (searchParams?.get("error") === "not_therapist") {
      setError("Your Google account is not linked to a therapist.");
    }
  }, [searchParams]);

  // Check if we just completed Google login successfully
  useEffect(() => {
    const handleGoogleSuccess = async () => {
      if (status === "authenticated" && searchParams?.get("google") === "1") {
        setLoading(true);
        try {
          // Exchange the NextAuth session for the app's own JWT.
          const res = await fetch("/api/auth/google-token");
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error || "Error syncing the session token");
          
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          router.push("/therapist/dashboard");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Login failed");
          setLoading(false);
        }
      }
    };
    
    handleGoogleSuccess();
  }, [status, searchParams, router]);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, expectedRole: "THERAPIST" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/therapist/dashboard");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/therapist/login?google=1" });
  };

  // Finishing the Google sign-in
  if (status === "loading" || (status === "authenticated" && searchParams?.get("google") === "1")) {
    return (
      <div className="min-h-screen bg-[#f4f9f8] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#4d8b7d] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#4d8b7d] font-bold">Signing in...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f9f8] flex items-center justify-center px-4 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#d3ede9_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#e8f0fb_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-[0_8px_48px_rgba(77,139,125,0.15)] border border-slate-100 overflow-hidden">
          
          <div className="bg-[#4d8b7d] px-8 pt-10 pb-8">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white/20 p-4 rounded-2xl">
                <UserCog className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white tracking-tight">Praggymatics</h1>
                <p className="text-white/70 text-sm font-medium mt-0.5">Therapist Area</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold text-center mb-6">
                {error}
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm mb-6"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="therapist-username" className="text-slate-600 text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-[#4d8b7d]" /> Username
                </label>
                <input
                  id="therapist-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4d8b7d]/40 focus:border-[#4d8b7d]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="therapist-password" className="text-slate-600 text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#4d8b7d]" /> Password
                </label>
                <input
                  id="therapist-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4d8b7d]/40 focus:border-[#4d8b7d]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-11 bg-[#4d8b7d] hover:bg-[#3d7a6c] disabled:opacity-60 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                {loading ? "Signing in..." : <><LogIn className="w-4 h-4" /> Sign in</>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link href="/login" className="text-slate-400 hover:text-[#4d8b7d] text-sm font-medium transition-colors">
                ← Are you a kid? Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TherapistLoginPage() {
  return (
    <Suspense fallback={null}>
      <TherapistLoginContent />
    </Suspense>
  );
}
