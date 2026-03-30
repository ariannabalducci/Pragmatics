"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Edit3, ChevronDown } from "lucide-react";
import { LevelNode } from "./Path";

const DAILY_TASKS = [
  { id: 1, title: 'Finish part 1 of story "Make a cake"', subtitle: 'Learn Sarcasm', completed: true },
  { id: 2, title: 'Finish part 2 of story "A mountain of homework"', subtitle: 'Learn more about figurative language', completed: false },
  { id: 3, title: 'Add one more parrot into your collections', subtitle: '', completed: false },
];

export default function ParrotPopUp({ nodes }: {nodes: LevelNode[]}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');

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
            alt="Peeking Parrot" 
            width={500}
            height={600}
            className="pointer-events-none" 
          />
      </div>

      {/* POPUP */}
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
                
                {/* Header Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <span>📅</span>
                        <span>Daily Tasks</span>
                    </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                    {nodes.map((task) => (
                        <div 
                            key={task.id}
                            className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all
                                ${task 
                                    ? 'bg-[#E0F2F1] border-[#B2DFDB]' 
                                    : 'bg-white border-slate-100 shadow-sm' 
                                }
                            `}
                        >
                            <div className="flex gap-3">
                                <div className="mt-1 min-w-5">
                                    {task ? (
                                        <div className="w-6 h-6 bg-[#26A69A] rounded-full flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    ) : (
                                        <div className="text-red-400">
                                            <Edit3 size={20} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm leading-tight ${task ? 'text-[#00695C] opacity-70' : 'text-slate-700'}`}>
                                        {task.group_title}
                                    </h4>
                                    {task.group_topic && (
                                        <p className="text-xs text-slate-400 mt-1 font-medium">{task.group_topic}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}