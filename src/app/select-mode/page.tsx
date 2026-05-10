"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, ClipboardList, HelpCircle, Map, Heart, Zap, BookOpen } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [showTrainingOptions, setShowTrainingOptions] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <main className="min-h-screen bg-[#F0F7F7]" />;
  }

  const handleSelectMode = (mode: "training" | "testing") => {
    localStorage.setItem("pragmatics_mode", mode);
    router.push("/path");
  };

  return (
    <main className="flex flex-col items-center justify-center overflow-hidden min-h-screen bg-[#F0F7F7] relative">
      <div className="absolute top-4 left-4 z-20">
        <LogoutButton />
      </div>

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
          className="object-contain w-full max-w-[250px] mb-6 drop-shadow-xl"
        />

        <h1 className="text-4xl lg:text-6xl font-black text-center text-[#4a8f82] mb-4">
          Praggymatics
        </h1>
        
        <p className="text-xl lg:text-2xl font-bold text-slate-500 mb-12">
          Seleziona la modalità:
        </p>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-stretch">
          {/* Card Training */}
          <motion.div whileHover={showTrainingOptions ? {} : { scale: 1.05 }} className={`flex-1 ${showTrainingOptions ? 'flex flex-col' : ''}`}>
            {!showTrainingOptions ? (
              <button
                onClick={() => setShowTrainingOptions(true)}
                className="w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-transparent hover:border-[#62B4A5] transition-all group"
              >
                <div className="w-20 h-20 bg-[#EFF8F8] rounded-full flex items-center justify-center group-hover:bg-[#62B4A5] transition-colors">
                  <Play className="w-10 h-10 text-[#62B4A5] group-hover:text-white ml-2" strokeWidth={3} />
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-[#62B4A5] mb-2">Fase di Training</h2>
                  <p className="text-slate-500 font-medium">Percorso completo con aiuti, correzioni e rinforzi positivi.</p>
                </div>
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-4 h-full justify-center"
              >
                <button
                  onClick={() => handleSelectMode("training")}
                  className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#62B4A5] hover:bg-[#EFF8F8] transition-all group"
                >
                  <div className="w-14 h-14 bg-[#62B4A5] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <Map className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#62B4A5]">Generico</h3>
                    <p className="text-sm text-slate-500 font-medium">Esplora la mappa principale</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    localStorage.setItem("pragmatics_mode", "training");
                    router.push("/path-perche");
                  }}
                  className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#2C82C9] hover:bg-[#E5F2FC] transition-all group"
                >
                  <div className="w-14 h-14 bg-[#2C82C9] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <HelpCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#2C82C9]">Perché</h3>
                    <p className="text-sm text-slate-500 font-medium">Domande Causali</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("pragmatics_mode", "training");
                    router.push("/path-sentimenti");
                  }}
                  className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#E74C3C] hover:bg-[#FDEDEC] transition-all group"
                >
                  <div className="w-14 h-14 bg-[#E74C3C] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <Heart className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#E74C3C]">I Sentimenti</h3>
                    <p className="text-sm text-slate-500 font-medium">Analisi delle emozioni</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("pragmatics_mode", "training");
                    router.push("/path-reazioni");
                  }}
                  className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#F39C12] hover:bg-[#FEF5E7] transition-all group"
                >
                  <div className="w-14 h-14 bg-[#F39C12] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#F39C12]">Reazioni</h3>
                    <p className="text-sm text-slate-500 font-medium">Problem solving sociale</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("pragmatics_mode", "training");
                    router.push("/path-cloze");
                  }}
                  className="w-full flex-1 bg-white rounded-3xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#8E44AD] hover:bg-[#F5EEF8] transition-all group"
                >
                  <div className="w-14 h-14 bg-[#8E44AD] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#8E44AD]">Cloze</h3>
                    <p className="text-sm text-slate-500 font-medium">Completa il testo</p>
                  </div>
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Card Testing */}
          <motion.div whileHover={{ scale: 1.05 }} className="flex-1">
            <button
              onClick={() => handleSelectMode("testing")}
              className="w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-transparent hover:border-[#8e6fad] transition-all group"
            >
              <div className="w-20 h-20 bg-[#f4eff8] rounded-full flex items-center justify-center group-hover:bg-[#8e6fad] transition-colors">
                <ClipboardList className="w-10 h-10 text-[#8e6fad] group-hover:text-white" strokeWidth={3} />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-[#8e6fad] mb-2">Fase di Valutazione</h2>
                <p className="text-slate-500 font-medium">Test silente senza feedback, solo narrazione.</p>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}