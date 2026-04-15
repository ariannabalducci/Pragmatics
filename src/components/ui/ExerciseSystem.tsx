"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";

interface ExerciseSystemProps {
    groupTitle: string;
    topic: string;
    exerciseId: string;
    levelProgress?: number;
    onClose: () => void;
    mode?: string; // Prop per distinguere tra training e testing
    firstExerciseId?: string;
}
export default function ExerciseSystem({ 
    groupTitle, 
    topic, 
    exerciseId, 
    levelProgress, 
    onClose, 
    mode = "training",
    firstExerciseId 
}: ExerciseSystemProps) {
  
  const isTesting = mode === "testing";
  
  // Configurazione Colori
  const colors = isTesting 
    ? { primary: "bg-[#a386bd]", secondary: "bg-[#8e6fad]", text: "text-[#8e6fad]", border: "border-[#8e6fad]" }
    : { primary: "bg-[#62B4A5]", secondary: "bg-[#4583BD]", text: "text-[#62B4A5]", border: "border-[#4a8f82]" };

  const data = { 
    title: groupTitle, 
    topic: topic,
    exerciseId: exerciseId,
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        
        <div className="absolute inset-0" onClick={onClose} />

        {/* === CARD PRINCIPALE === */}
        <div className="relative z-10 w-full max-w-4xl bg-white/90 rounded-[40px] shadow-2xl overflow-visible p-8 md:p-12 animate-in zoom-in-95 duration-200 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* TASTO CHIUDI */}
            <button
                onClick={onClose}
                className={`${colors.primary} absolute -top-4 -left-4 z-50 w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer`}
            >
                <X size={28} strokeWidth={3} />
            </button>

            <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start z-10">
                <h2 className={`text-3xl md:text-5xl font-black ${colors.text} mb-2 tracking-wide w-full text-center md:text-left leading-tight`}>
                    {data.title}
                </h2>
            </div>

            <div className="flex flex-col justify-start space-y-6 z-10">
                
                <div className={`relative ${colors.primary} text-white p-6 rounded-3xl rounded-br-none mb-8 w-full shadow-md`}>
                    <p className="opacity-90 text-sm font-bold uppercase mb-1">Argomento di oggi:</p>
                    <p className="text-2xl font-black leading-tight">"{data.topic}"</p>
                    <p className="mt-4 font-bold text-sm opacity-90">Sei pronto a iniziare?</p>
                    
                    <div className={`absolute bottom-0 -right-5 w-0 h-0 
                        border-t-25 border-t-transparent 
                        border-l-25 border-l-current 
                        border-b-0 border-b-transparent ${colors.text}`} 
                    />
                </div>

                <div className="w-full space-y-4">
                    {/* PARTE 1 - Sempre visibile */}
                    {(isTesting || levelProgress === 0) && (
                        <div className="bg-white border-2 border-slate-100 rounded-full p-2 flex items-center gap-4 shadow-sm w-full max-w-sm">
                            <span className={`${colors.primary} text-white font-bold px-4 py-1 rounded-full text-lg`}>
                                PARTE 1
                            </span>
                            <span className="text-[#5A5959] font-bold">Momento Storia</span>
                        </div>
                    )}

                    {/* PARTE 2 - Solo in Training se la parte 1 è fatta */}
                    {!isTesting && levelProgress !== 0 && (
                        <div className="bg-white border-2 border-slate-100 rounded-full p-2 flex items-center gap-4 shadow-sm w-full max-w-sm">
                            <span className="bg-[#4583BD] text-white font-bold px-4 py-1 rounded-full text-lg">
                                PARTE 2
                            </span>
                            <span className="text-[#5A5959] font-bold">Momento Chat</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <a href={isTesting 
                            ? `/story?id=${firstExerciseId || exerciseId}&mode=testing` 
                            : (levelProgress === 0 ? `/story?id=${exerciseId}` : `/chat?id=${exerciseId}`)
                        }>
                            <Button className={`${colors.primary} text-white text-xl p-8 rounded-2xl w-full md:w-auto shadow-[0_6px_0_0_rgba(0,0,0,0.1)] hover:translate-y-1 active:shadow-none transition-all`}>
                                {isTesting ? "Inizia Valutazione" : "Inizia a Giocare"}
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            <div className="relative flex items-end justify-center h-full min-h-75 md:min-h-0">
                {(isTesting || levelProgress === 0) ? (
                <Image 
                    src="/path/parrot-flying.svg"
                    alt="Parrot Teacher"
                    width={500}
                    height={500}
                    className="object-contain drop-shadow-xl md:absolute md:scale-150 md:-right-10"
                />
                ) : (
                <Image 
                    src="/path/parrot-standing.svg"
                    alt="Parrot Teacher"
                    width={500}
                    height={500}
                    className="object-contain drop-shadow-xl md:absolute md:scale-160 md:-right-10 md:-bottom-10"
                />
                )}
            </div>

        </div>
    </div>
  );
}