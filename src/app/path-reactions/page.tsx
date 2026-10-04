"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Play, Lock, Star } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";
import { Button } from "@/components/ui/button";
import { useProgressReset } from "@/lib/hooks/useProgressReset";

type ReactionsNode = {
  exerciseGroupId: string;
  exerciseId: string;
  title: string;
  status: "available" | "blocked" | "completed";
};

type DailyLimit = {
  prescribed: string[];
  isActive: boolean;
};

function ProgressRing({ progress }: { progress: number }) {
  const size = 200;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringColor = '#D9D9D9';
  const activeColor = '#FFE53B';
  const maxProgress = 2;
  const strokeDashoffset = circumference - (progress / maxProgress) * circumference;

  return (
    <svg width={size} height={size} className="pointer-events-none">
      <circle cx={center} cy={center} r={radius} fill="none" stroke={ringColor} strokeWidth={strokeWidth} strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`} />
      {progress > 0 && (
        <circle cx={center} cy={center} r={radius} fill="none" stroke={activeColor} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`} />
      )}
    </svg>
  );
}

export default function PathReactionsPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<ReactionsNode[]>([]);
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null);
  const [loading, setLoading] = useState(true);

  useProgressReset();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const mode = localStorage.getItem("pragmatics_mode") || "training";

        const [nodesRes, todayRes] = await Promise.all([
          fetch(`/api/exercises/by-type/reactions?mode=${mode}`, { headers }),
          fetch("/api/appointments/today", { headers }),
        ]);

        if (nodesRes.ok) setNodes(await nodesRes.json());

        if (todayRes.ok) {
          const todayData = await todayRes.json();
          if (todayData.hasAppointment) {
            setDailyLimit({
              prescribed: todayData.prescribedExercises || [],
              isActive: todayData.isActive || false,
            });
          }
        }
      } catch (err) {
        console.error("Error loading reactions exercises:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const visibleNodes = (() => {
    if (!dailyLimit || !dailyLimit.isActive) return nodes;
    if (dailyLimit.prescribed.length > 0) {
      return nodes.filter((n) => dailyLimit.prescribed.includes(n.exerciseGroupId));
    }
    return nodes;
  })();

  const isSessionActive = dailyLimit?.isActive && dailyLimit.prescribed.length > 0;
  const noExercisesToday = isSessionActive && visibleNodes.length === 0;

  if (loading) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-[#FEF5E7] flex items-center justify-center">
        <div className="text-[#F39C12] text-2xl font-bold">Loading...</div>
      </main>
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#FEF5E7]">
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => router.push("/select-mode")}
          className="bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-2xl shadow-sm text-slate-700 font-bold text-sm hover:bg-white hover:shadow transition-all"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Mode
        </button>
        <LogoutButton />
      </div>

      {isSessionActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
          <div className="bg-[#F39C12] text-white px-5 py-2.5 rounded-2xl shadow-lg font-bold text-sm">
            🎯 {visibleNodes.filter(n => n.status !== 'completed').length} prescribed exercises left
          </div>
          <div className="bg-[#FFE53B] text-[#8B7D00] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm animate-bounce">
            Session in progress ✨
          </div>
        </div>
      )}

      <Image src="/lbush.png" alt="Left bush" width={400} height={400} className="absolute top-0 left-0 z-0 opacity-60 mix-blend-overlay pointer-events-none" />
      <Image src="/rbush.png" alt="Right bush" width={600} height={600} className="absolute bottom-0 right-0 z-10 opacity-60 mix-blend-overlay pointer-events-none" />

      {noExercisesToday && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FEF5E7]/80 backdrop-blur-sm z-40">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md border-4 border-orange-100 animate-in zoom-in duration-300">
            <div className="text-6xl mb-6">🤫</div>
            <h3 className="text-2xl font-black text-[#0e2a47] mb-4">No exercises for today</h3>
            <p className="text-slate-500 font-bold leading-relaxed">
              Your therapist hasn’t prescribed any Reactions exercises for this session.
            </p>
          </div>
        </div>
      )}

      <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-32 relative z-10 px-8">
        {visibleNodes.map((level) => (
          <div
            key={level.exerciseGroupId}
            className={`relative flex flex-col items-center transition-transform ${
              level.status === "available" ? "hover:scale-105" : ""
            }`}
          >
            <div className="mb-6 w-[260px] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border-2 border-orange-200 text-[#0e2a47] font-black text-sm uppercase text-center leading-tight">
              {level.title}
            </div>
            <div className="relative group">
              <ProgressRing progress={level.status === "completed" ? 2 : 0} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  onClick={() => {
                    if (level.status === "available" || level.status === "completed") {
                      router.push(
                        `/reactions?exerciseId=${level.exerciseId}&groupId=${level.exerciseGroupId}&title=${encodeURIComponent(level.title)}`
                      );
                    }
                  }}
                  variant={level.status === "blocked" ? "locked" : level.status === "completed" ? "completed" : "play"}
                  size="play"
                >
                  {level.status === "blocked" ? <Lock /> : level.status === "completed" ? <Star fill="currentColor" /> : <Play fill="currentColor" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
