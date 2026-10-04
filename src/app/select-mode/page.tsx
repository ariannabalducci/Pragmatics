"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, ClipboardList, HelpCircle, Map, Heart, Zap, BookOpen } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";

export default function SelectModePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [expandedCard, setExpandedCard] = useState<"training" | "testing" | null>(null);
  // null when no session is active
  const [sessionMode, setSessionMode] = useState<"training" | "testing" | null>(null);
  // The cards stay hidden until the session check is done.
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkSession = async () => {
      // Show the cards anyway if the API doesn't answer within 5 seconds.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSessionChecked(true);
          clearTimeout(timeoutId);
          return;
        }
        const res = await fetch("/api/appointments/today", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.hasAppointment && data.isActive && data.sessionMode) {
            setSessionMode(data.sessionMode as "training" | "testing");
            localStorage.setItem("pragmatics_mode", data.sessionMode);
          }
        }
      } catch {
        // On error or timeout the cards are shown anyway.
      }
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  if (!isMounted || !sessionChecked) {
    return <main className="min-h-screen bg-[#F0F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#62B4A5] border-t-transparent rounded-full animate-spin" />
    </main>;
  }

  const handleSelectCategory = (mode: "training" | "testing", path: string) => {
    localStorage.setItem("pragmatics_mode", mode);
    router.push(path);
  };

  const renderCategories = (mode: "training" | "testing") => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4 h-full justify-center"
    >
      <button
        onClick={() => handleSelectCategory(mode, "/path")}
        className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#62B4A5] hover:bg-[#EFF8F8] transition-all group"
      >
        <div className="w-14 h-14 bg-[#62B4A5] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <Map className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-black text-[#62B4A5]">General</h3>
          <p className="text-sm text-slate-500 font-medium">Explore the main map</p>
        </div>
      </button>

      <button
        onClick={() => handleSelectCategory(mode, "/path-why")}
        className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#2C82C9] hover:bg-[#E5F2FC] transition-all group"
      >
        <div className="w-14 h-14 bg-[#2C82C9] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <HelpCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-black text-[#2C82C9]">Why</h3>
          <p className="text-sm text-slate-500 font-medium">Cause and effect questions</p>
        </div>
      </button>

      <button
        onClick={() => handleSelectCategory(mode, "/path-feelings")}
        className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#E74C3C] hover:bg-[#FDEDEC] transition-all group"
      >
        <div className="w-14 h-14 bg-[#E74C3C] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <Heart className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-black text-[#E74C3C]">Feelings</h3>
          <p className="text-sm text-slate-500 font-medium">Understanding emotions</p>
        </div>
      </button>

      <button
        onClick={() => handleSelectCategory(mode, "/path-reactions")}
        className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#F39C12] hover:bg-[#FEF5E7] transition-all group"
      >
        <div className="w-14 h-14 bg-[#F39C12] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-black text-[#F39C12]">Reactions</h3>
          <p className="text-sm text-slate-500 font-medium">Social problem solving</p>
        </div>
      </button>

      <button
        onClick={() => handleSelectCategory(mode, "/path-cloze")}
        className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#8E44AD] hover:bg-[#F5EEF8] transition-all group"
      >
        <div className="w-14 h-14 bg-[#8E44AD] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-black text-[#8E44AD]">Cloze</h3>
          <p className="text-sm text-slate-500 font-medium">Complete the text</p>
        </div>
      </button>

      <button
        onClick={() => setExpandedCard(null)}
        className="w-full flex-1 bg-white rounded-3xl p-4 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all font-bold"
      >
        Cancel
      </button>
    </motion.div>
  );

  // During a session only the prescribed mode is shown.
  const showTraining = !sessionMode || sessionMode === "training";
  const showTesting  = !sessionMode || sessionMode === "testing";

  return (
    <main className="flex flex-col items-center justify-center overflow-hidden min-h-screen bg-[#F0F7F7] relative py-10">
      <div className="absolute top-4 left-4 z-20">
        <LogoutButton />
      </div>

      {sessionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className={`px-5 py-2 rounded-2xl shadow-lg font-bold text-sm text-white ${sessionMode === "testing" ? "bg-[#8e6fad]" : "bg-[#62B4A5]"}`}>
            🎯 Session in progress — {sessionMode === "testing" ? "Assessment" : "Training"}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center w-full px-4"
      >
        <Image
          src="/parrot.gif"
          alt="Parrot Animation"
          width={400}
          height={400}
          unoptimized
          priority
          style={{ height: "auto" }}
          className="object-contain w-full max-w-[200px] mb-4 drop-shadow-xl"
        />

        <h1 className="text-4xl lg:text-5xl font-black text-center text-[#4a8f82] mb-2">
          Praggymatics
        </h1>

        <p className="text-lg lg:text-xl font-bold text-slate-500 mb-8">
          {sessionMode ? "Choose a category:" : "Choose a mode:"}
        </p>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-stretch">

          {showTraining && (
            <motion.div
              whileHover={expandedCard === "training" ? {} : { scale: 1.05 }}
              className={`flex-1 ${expandedCard === "training" ? "flex flex-col" : ""}`}
            >
              {expandedCard !== "training" ? (
                <button
                  onClick={() => setExpandedCard("training")}
                  className="w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-transparent hover:border-[#62B4A5] transition-all group"
                >
                  <div className="w-20 h-20 bg-[#EFF8F8] rounded-full flex items-center justify-center group-hover:bg-[#62B4A5] transition-colors">
                    <Play className="w-10 h-10 text-[#62B4A5] group-hover:text-white ml-2" strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-[#62B4A5] mb-2">Training</h2>
                    <p className="text-slate-500 font-medium">Full path with hints, corrections and positive reinforcement.</p>
                  </div>
                </button>
              ) : renderCategories("training")}
            </motion.div>
          )}

          {showTesting && (
            <motion.div
              whileHover={expandedCard === "testing" ? {} : { scale: 1.05 }}
              className={`flex-1 ${expandedCard === "testing" ? "flex flex-col" : ""}`}
            >
              {expandedCard !== "testing" ? (
                <button
                  onClick={() => setExpandedCard("testing")}
                  className="w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-transparent hover:border-[#8e6fad] transition-all group"
                >
                  <div className="w-20 h-20 bg-[#f4eff8] rounded-full flex items-center justify-center group-hover:bg-[#8e6fad] transition-colors">
                    <ClipboardList className="w-10 h-10 text-[#8e6fad] group-hover:text-white" strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-[#8e6fad] mb-2">Assessment</h2>
                    <p className="text-slate-500 font-medium">Silent test with no feedback, narration only.</p>
                  </div>
                </button>
              ) : renderCategories("testing")}
            </motion.div>
          )}

        </div>
      </motion.div>
    </main>
  );
}