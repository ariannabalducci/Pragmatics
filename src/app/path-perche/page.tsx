"use client";

import { useEffect, useState, useRef, MouseEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Play, Lock, Star } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";
import { Button } from "@/components/ui/button";

const TITLES = [
  "Perché si devono indossare i vestiti?",
  "Perché si deve andare a scuola?",
  "Perché bisogna andare a lavorare?",
  "Perché si stirano i vestiti prima di indossarli?",
  "Perché ci laviamo le mani?",
  "Perché gli autobus hanno molti sedili/posti?",
  "Perché bisogna lavarsi i denti?",
  "Perché esistono le finestre?",
  "Perché usiamo gli orologi?",
  "Perché dobbiamo dormire?",
  "Perché si indossano le calze prima delle scarpe?",
  "Perché chiudiamo la porta di casa a chiave?",
  "Perché usiamo il telefono?",
  "Perché dormiamo sul materasso?",
  "Perché mettiamo benzina nelle automobili, nei camion e nei motorini?"
];

// Nodi statici per la dimostrazione
export type PercheNode = { id: string, title: string, status: "available" | "locked" | "completed", progress: number };

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

export default function PathPerchePage() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [nodes, setNodes] = useState<PercheNode[]>([]);

  useEffect(() => {
    const completedStr = localStorage.getItem('completed_perche');
    const completed = completedStr ? JSON.parse(completedStr) : [];

    let nextAvailableIndex = 0;
    for (let i = 0; i < TITLES.length; i++) {
        if (completed.includes(`perche_${i + 1}`)) {
            nextAvailableIndex = i + 1;
        }
    }

    const calculatedNodes = TITLES.map((title, i) => {
        const id = `perche_${i + 1}`;
        const isCompleted = completed.includes(id);
        const isAvailable = i === nextAvailableIndex || isCompleted;

        return {
            id,
            title,
            status: isCompleted ? "completed" : (isAvailable ? "available" : "locked"),
            progress: 0
        } as PercheNode;
    });

    setNodes(calculatedNodes);
  }, []);

  const getWaveY = (x: number) => {
    return WAVE_CONFIG.yOffset + WAVE_CONFIG.amplitude * Math.sin(WAVE_CONFIG.frequency * x);
  };

  const pathData = useMemo(() => {
    const totalWidth = TITLES.length * WAVE_CONFIG.step + 600;
    let d = `M 0 ${getWaveY(0).toFixed(2)}`;
    for (let x = 0; x <= totalWidth; x += 10) {
      d += ` L ${x} ${getWaveY(x).toFixed(2)}`;
    }
    return d;
  }, []);

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

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#2C82C9]">
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button 
          onClick={() => router.push("/select-mode")}
          className="bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-2xl shadow-sm text-slate-700 font-bold text-sm hover:bg-white hover:shadow transition-all"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Modalità
        </button>
        <LogoutButton />
      </div>

      <Image src="/lbush.png" alt="Left bush" width={400} height={400} className="absolute top-0 left-0 z-0 opacity-80 mix-blend-overlay" />
      <Image src="/rbush.png" alt="Right bush" width={600} height={600} className="absolute bottom-0 right-0 z-10 opacity-80 mix-blend-overlay" />

      <div
        className="w-full h-screen bg-transparent flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={handleMouseMove}
      >
        <div ref={scrollContainerRef} className="w-full h-full overflow-x-auto overflow-y-hidden relative no-scrollbar">
          <div className="relative h-full pointer-events-auto" style={{ width: `${TITLES.length * WAVE_CONFIG.step + 600}px` }}>
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">
              <path d={pathData} fill="none" stroke="#5DA0D6" strokeWidth={WAVE_CONFIG.strokeWidth / 5} strokeLinecap="round" transform="translate(0, 140)" />
              <path d={pathData} fill="none" stroke="#7CB4DF" strokeWidth={WAVE_CONFIG.strokeWidth} strokeLinecap="round" />
            </svg>

            {nodes.map((level, index) => {
              const x = index * WAVE_CONFIG.step + 200;
              const y = getWaveY(x);

              return (
                <div key={level.id} className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform z-10 ${level.status === 'available' ? 'hover:scale-115' : ''}`} style={{ left: x, top: y }}>
                  
                  {/* Titolo sopra al nodo */}
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[220px] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border-2 border-blue-200 text-[#0e2a47] font-black text-sm uppercase text-center leading-tight z-20">
                    {level.title}
                  </div>

                  <div className="relative group transition-transform">
                    <ProgressRing progress={level.status === 'locked' ? 0 : level.status === 'completed' ? 2 : level.progress} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          if (level.status === 'available' || level.status === 'completed') {
                            router.push(`/perche?id=${level.id}&title=${encodeURIComponent(level.title)}`);
                          }
                        }}
                        variant={level.status === 'locked' ? "locked" : level.status === 'completed' ? "completed" : "play"}
                        size="play"
                      >
                        {level.status === 'locked' ? <Lock /> : level.status === 'completed' ? <Star fill="currentColor" /> : <Play fill="currentColor" />}
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
