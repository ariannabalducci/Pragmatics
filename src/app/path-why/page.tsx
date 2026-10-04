"use client";

import { useEffect, useState, useRef, MouseEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Play, Lock, Star } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";
import { Button } from "@/components/ui/button";
import { useProgressReset } from "@/lib/hooks/useProgressReset";

type WhyNode = {
  exerciseGroupId: string;
  exerciseId: string;
  title: string;
  status: "available" | "blocked" | "completed";
};

type DailyLimit = {
  prescribed: string[];
  isActive: boolean;
};

const WAVE_CONFIG = {
  amplitude: 90,
  frequency: 0.005,
  step: 300,
  yOffset: 330,
  strokeWidth: 270,
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

export default function PathWhyPage() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [nodes, setNodes] = useState<WhyNode[]>([]);
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
          fetch(`/api/exercises/by-type/why?mode=${mode}`, { headers }),
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
        console.error("Error loading why exercises:", err);
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

  const getWaveY = (x: number) => {
    return WAVE_CONFIG.yOffset + WAVE_CONFIG.amplitude * Math.sin(WAVE_CONFIG.frequency * x);
  };

  const pathData = useMemo(() => {
    const count = visibleNodes.length || 1;
    const totalWidth = count * WAVE_CONFIG.step + 600;
    let d = `M 0 ${getWaveY(0).toFixed(2)}`;
    for (let x = 0; x <= totalWidth; x += 10) {
      d += ` L ${x} ${getWaveY(x).toFixed(2)}`;
    }
    return d;
  }, [visibleNodes.length]);

  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => setIsDragging(false);

  if (loading) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-[#2C82C9] flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </main>
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#2C82C9]">
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
          <div className="bg-white text-[#2C82C9] px-5 py-2.5 rounded-2xl shadow-lg font-bold text-sm">
            🎯 {visibleNodes.filter(n => n.status !== 'completed').length} prescribed exercises left
          </div>
          <div className="bg-[#FFE53B] text-[#8B7D00] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm animate-bounce">
            Session in progress ✨
          </div>
        </div>
      )}

      <Image src="/lbush.png" alt="Left bush" width={400} height={400} className="absolute top-0 left-0 z-0 opacity-80 mix-blend-overlay" />
      <Image src="/rbush.png" alt="Right bush" width={600} height={600} className="absolute bottom-0 right-0 z-10 opacity-80 mix-blend-overlay" />

      {noExercisesToday && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2C82C9]/80 backdrop-blur-sm z-40">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md border-4 border-blue-100 animate-in zoom-in duration-300">
            <div className="text-6xl mb-6">🤫</div>
            <h3 className="text-2xl font-black text-[#0e2a47] mb-4">No exercises for today</h3>
            <p className="text-slate-500 font-bold leading-relaxed">
              Your therapist hasn't prescribed any "Why" questions for this session.
            </p>
          </div>
        </div>
      )}

      <div
        className="w-full h-screen bg-transparent flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={handleMouseMove}
      >
        <div ref={scrollContainerRef} className="w-full h-full overflow-x-auto overflow-y-hidden relative no-scrollbar">
          <div className="relative h-full pointer-events-auto" style={{ width: `${visibleNodes.length * WAVE_CONFIG.step + 600}px` }}>
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">
              <path d={pathData} fill="none" stroke="#5DA0D6" strokeWidth={WAVE_CONFIG.strokeWidth / 5} strokeLinecap="round" transform="translate(0, 140)" />
              <path d={pathData} fill="none" stroke="#7CB4DF" strokeWidth={WAVE_CONFIG.strokeWidth} strokeLinecap="round" />
            </svg>

            {visibleNodes.map((level, index) => {
              const x = index * WAVE_CONFIG.step + 200;
              const y = getWaveY(x);

              return (
                <div key={level.exerciseGroupId} className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform z-10 ${level.status === 'available' ? 'hover:scale-115' : ''}`} style={{ left: x, top: y }}>
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[220px] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border-2 border-blue-200 text-[#0e2a47] font-black text-sm uppercase text-center leading-tight z-20">
                    {level.title}
                  </div>
                  <div className="relative group transition-transform">
                    <ProgressRing progress={level.status === 'completed' ? 2 : 0} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          if (level.status === 'available' || level.status === 'completed') {
                            router.push(`/why?exerciseId=${level.exerciseId}&groupId=${level.exerciseGroupId}&title=${encodeURIComponent(level.title)}`);
                          }
                        }}
                        variant={level.status === 'blocked' ? "locked" : level.status === 'completed' ? "completed" : "play"}
                        size="play"
                      >
                        {level.status === 'blocked' ? <Lock /> : level.status === 'completed' ? <Star fill="currentColor" /> : <Play fill="currentColor" />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
