"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Play, Lock, Star } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";
import { Button } from "@/components/ui/button";

const EXERCISES = [
  { id: "caduta", title: "LA CADUTA NEL GIOCO" },
  { id: "cucina", title: "L'INCIDENTE IN CUCINA" },
];

type ReazioniNode = {
  id: string;
  title: string;
  status: "available" | "locked" | "completed";
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

export default function PathReazioniPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<ReazioniNode[]>([]);

  useEffect(() => {
    const completedStr = localStorage.getItem("completed_reazioni");
    const completed = completedStr ? JSON.parse(completedStr) : [];

    let nextAvailableIndex = 0;
    for (let i = 0; i < EXERCISES.length; i++) {
      if (completed.includes(EXERCISES[i].id)) {
        nextAvailableIndex = i + 1;
      }
    }

    const calculatedNodes = EXERCISES.map((ex, i) => {
      const isCompleted = completed.includes(ex.id);
      const isAvailable = i === nextAvailableIndex || isCompleted;
      return {
        id: ex.id,
        title: ex.title,
        status: isCompleted
          ? "completed"
          : isAvailable
          ? "available"
          : "locked",
      } as ReazioniNode;
    });

    setNodes(calculatedNodes);
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#FEF5E7]">
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => router.push("/select-mode")}
          className="bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-2xl shadow-sm text-slate-700 font-bold text-sm hover:bg-white hover:shadow transition-all"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Modalità
        </button>
        <LogoutButton />
      </div>

      <Image src="/lbush.png" alt="Left bush" width={400} height={400} className="absolute top-0 left-0 z-0 opacity-60 mix-blend-overlay pointer-events-none" />
      <Image src="/rbush.png" alt="Right bush" width={600} height={600} className="absolute bottom-0 right-0 z-10 opacity-60 mix-blend-overlay pointer-events-none" />

      <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-32 relative z-10 px-8">
        {nodes.map((level) => (
          <div
            key={level.id}
            className={`relative flex flex-col items-center transition-transform ${
              level.status === "available" ? "hover:scale-105" : ""
            }`}
          >
            {/* Titolo */}
            <div className="mb-6 w-[260px] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border-2 border-orange-200 text-[#0e2a47] font-black text-sm uppercase text-center leading-tight">
              {level.title}
            </div>

            <div className="relative group">
              <ProgressRing
                progress={level.status === "completed" ? 2 : 0}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  onClick={() => {
                    if (
                      level.status === "available" ||
                      level.status === "completed"
                    ) {
                      router.push(
                        `/reazioni?id=${level.id}&title=${encodeURIComponent(level.title)}`
                      );
                    }
                  }}
                  variant={
                    level.status === "locked"
                      ? "locked"
                      : level.status === "completed"
                      ? "completed"
                      : "play"
                  }
                  size="play"
                >
                  {level.status === "locked" ? (
                    <Lock />
                  ) : level.status === "completed" ? (
                    <Star fill="currentColor" />
                  ) : (
                    <Play fill="currentColor" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
