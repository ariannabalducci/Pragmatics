"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "CHILD") {
        router.push("/");
      } else if (data.user.role === "THERAPIST") {
        router.push("/therapist/dashboard");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    return (
        <main className="bg-white grid grid-rows-[1fr] grid-cols-[1fr_2fr] gap-1 w-screen h-screen overflow-hidden">

            <div className="relative">
                <Image
                    src="/login/login-bush.png"
                    alt="Decorative bush"
                    width={0}
                    height={0}
                    sizes="100vw"
                    priority={true}
                    className="absolute top-0 left-0 z-0 w-100 h-auto"
                />
                <div className="absolute -left-10 top-10 z-10 h-full w-150 z-0 pointer-events-none">
                    <Image
                    src="/side-parrot.svg"
                    alt="Talking parrot"
                    fill
                    className="object-contain z-10"
                    />
                </div>
            </div>

            <div className="bg-[#A6DADA] flex flex-col gap-1 justify-center items-center col-start-2 rounded-l-[8em] shadow-l-2xl">
                <div className="relative h-5/12 w-3/4 flex items-center justify-center">
                    <Image 
                        src="/login/login-bubble.png" 
                        alt="Speech bubble" 
                        fill 
                    />

                    <div>
                        <p className="relative z-10 text-white text-xl px-20 pb-4">
                        Hi! Welcome to Praggymatics!
                        </p>

                        <p className="relative z-10 text-white text-xl px-20 pb-4">
                            I’m Praggy,  your partner on the upcoming adventure. 
                            Are you ready?
                        </p>

                        <p className="relative z-10 text-white text-xl px-20 pb-4">
                            Type your username and password in the boxes below, and let's get started!
                        </p>
                    </div>
                    
                    
                </div>

                <form onSubmit={handleLogin} className="bg-[#EFF8F8] w-full max-w-md p-6 md:p-8 rounded-[3rem] shadow-2xl flex flex-col gap-8 items-center">
                
                {error && <p className="text-red-500 font-bold text-center">{error}</p>}

                <div className="space-y-3 w-full">
                    <label className="flex items-center gap-3 text-gray-600 text-lg font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username
                    </label>
                    <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-50 h-12 rounded-full shadow-[inset_0px_2px_4px_rgba(0,0,0,0.15)] border-t border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#76b5a3] px-6 text-lg text-gray-700 placeholder-transparent"
                    />
                </div>

                <div className="space-y-3 w-full">
                    <label className="flex items-center gap-3 text-gray-600 text-lg font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Password
                    </label>
                    <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 h-12 rounded-full shadow-[inset_0px_2px_4px_rgba(0,0,0,0.15)] border-t border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#76b5a3] px-6 text-lg text-gray-700 placeholder-transparent"
                    />
                </div>
                
                <Button type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Login"}
                </Button>
                </form>
                
            </div>
        </main>
    );
}