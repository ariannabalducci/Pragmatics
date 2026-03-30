"use client";

import { X, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import { progress } from "framer-motion";

interface ExerciseSystemProps {
    groupTitle: string;
    topic: string;
    exerciseId: string;
    levelProgress?: number;
  onClose: () => void;
}

export default function ExerciseSystem({ groupTitle, topic, exerciseId, levelProgress, onClose }: ExerciseSystemProps) {
  const data = { 
    title: `${groupTitle}`, 
    topic: `Understanding ${topic}`,
    exerciseId: exerciseId,
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        
        <div className="absolute inset-0" onClick={onClose} />

        {/* === THE MAIN CARD === */}
        <div className="relative z-10 w-full max-w-4xl bg-white/90 rounded-[40px] shadow-2xl overflow-visible p-8 md:p-12 animate-in zoom-in-95 duration-200 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* CLOSE BUTTON */}
            <button
                onClick={onClose}
                className="bg-[#62B4A5] absolute -top-4 -left-4 z-50 w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                >
                <X size={28} strokeWidth={3} />
            </button>

            <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start z-10">
                <h2 className="text-3xl md:text-5xl font-black text-[#62B4A5] mb-2 tracking-wide w-full text-center md:text-left leading-tight">
                    {data.title}
                </h2>
            </div>

            <div className="flex flex-col justify-start space-y-6 z-10">
                
                <div className="relative bg-[#62B4A5] text-white p-6 rounded-3xl rounded-br-none mb-8 w-full shadow-md">
                    <p className="opacity-90 text-sm font-bold uppercase mb-1">Today's topic:</p>
                    <p className="text-2xl font-black leading-tight">"{data.topic}"</p>
                    <p className="mt-4 font-bold text-sm opacity-90">Are you ready to start?</p>
                    
                    <div className="absolute bottom-0 -right-5 w-0 h-0 
                        border-t-25 border-t-transparent 
                        border-l-25 border-l-[#62B4A5] 
                        border-b-0 border-b-transparent" 
                    />
                </div>

                <div className="w-full space-y-4">

                {levelProgress === 0 ? (
                    <div className="bg-white border-2 border-slate-100 rounded-full p-2 flex items-center gap-4 shadow-sm w-full max-w-sm">
                        <span className="bg-[#62B4A5] text-white font-bold px-4 py-1 rounded-full text-lg">
                            PART 1
                        </span>
                        <span className="text-[#5A5959] font-bold">Story Time!</span>
                    </div>


                )
                    :(<div className="bg-white border-2 border-slate-100 rounded-full p-2 flex items-center gap-4 shadow-sm w-full max-w-sm">
                        <span className="bg-[#4583BD] text-white font-bold px-4 py-1 rounded-full text-lg">
                            PART 2
                        </span>
                        <span className="text-[#5A5959] font-bold">Chatting Time!</span>
                    </div>)

                    }
                    {levelProgress === 0 ? (
                        <a href={`/story?id=${exerciseId}`}><Button>Start Playing</Button></a>):
                        (<a href={`/chat?id=${exerciseId}`}><Button>Start Playing</Button></a>)}
                </div>
            </div>

            <div className="relative flex items-end justify-center h-full min-h-75 md:min-h-0">
                {levelProgress === 0 ? (
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