"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Edit3, ChevronDown } from "lucide-react";
import { LevelNode } from "./Path";

interface ParrotPopUpProps {
  nodes: LevelNode[];
  mode?: string;
}

export default function ParrotPopUp({ nodes, mode = "training" }: ParrotPopUpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isTesting = mode === "testing";

  const theme = isTesting 
    ? {
        taskBg: "bg-[#E0E7F2]", 
        taskBorder: "border-[#B2C0DF]",
        checkBg: "bg-[#8e6fad]",   
        textMain: "text-[#536184]",
        label: "Assessment in progress 📝",
        emptyMsg: "No assessments available."
      }
    : {
        taskBg: "bg-[#E0F2F1]", 
        taskBorder: "border-[#B2DFDB]",
        checkBg: "bg-[#26A69A]",   
        textMain: "text-[#00695C]",
        label: "Today's Tasks 📅",
        emptyMsg: "No tasks for now!"
      };

  return (
    <>
      {/* PEEKING PARROT */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`absolute -bottom-40 -right-5 z-30 cursor-pointer transition-all duration-500
          ${isOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100 hover:-translate-y-4'}
        `}
      >
          <Image 
            src="/path/parrot-down.svg" 
            alt="Parrot" 
            width={500}
            height={600}
            className="pointer-events-none" 
          />
      </div>

      {/* TASKS POPUP */}
      <div 
        className={`absolute bottom-0 -right-5 z-50 flex flex-col items-center justify-end transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) pointer-events-none
          ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}
        `}
      >
        <div className="bg-[#F8FAFC] w-125 max-w-[95vw] rounded-t-[40px] shadow-2xl pb-8 relative pointer-events-auto mx-auto">
            
            {/* CLOSE ARROW */}
            <div 
                onClick={() => setIsOpen(false)} 
                className="w-full h-12 flex items-center justify-center cursor-pointer group hover:bg-slate-100 rounded-t-[40px] transition-colors"
            >
                <ChevronDown size={32} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>

            {/* CONTENT */}
            <div className="px-8 mt-2">
                
                <div className="flex items-center justify-between mb-6">
                    <div className={`flex items-center gap-2 font-bold ${isTesting ? 'text-[#8e6fad]' : 'text-slate-500'}`}>
                        <span className="text-xl">{theme.label}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {nodes.length > 0 ? nodes.map((task) => (
                        <div 
                            key={task.id}
                            className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all
                                ${task 
                                    ? `${theme.taskBg} ${theme.taskBorder}` 
                                    : 'bg-white border-slate-100 shadow-sm' 
                                }
                            `}
                        >
                            <div className="flex gap-3">
                                <div className="mt-1 min-w-5">
                                    {task ? (
                                        <div className={`w-6 h-6 ${theme.checkBg} rounded-full flex items-center justify-center`}>
                                            <Check size={14} className="text-white" />
                                        </div>
                                    ) : (
                                        <div className="text-red-400">
                                            <Edit3 size={20} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm leading-tight ${task ? `${theme.textMain} opacity-70` : 'text-slate-700'}`}>
                                        {task.group_title}
                                    </h4>
                                    {task.group_topic && (
                                        <p className="text-xs text-slate-400 mt-1 font-medium italic">
                                            {task.group_topic}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-400 py-4 italic">{theme.emptyMsg}</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}