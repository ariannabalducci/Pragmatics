"use client";

import { useRef, useEffect } from "react";
import { ChatHistory } from "@/types";

interface MessageWindowProps {
  history: ChatHistory;
}

const BotTail = () => (
  <svg className="absolute bottom-[0px] left-[-9px] w-[10px] h-[16px] text-[#6AAFA1]" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0C10 6 10 10 0 16L10 16V0Z" />
  </svg>
);

const UserTail = () => (
  <svg className="absolute bottom-[0px] right-[-9px] w-[10px] h-[16px] text-white" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.05))" }}>
    <path d="M0 0C0 6 0 10 10 16L0 16V0Z" />
  </svg>
);

export default function MessageWindow({ history }: MessageWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when history changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);
  
  return (
    <div className="h-full w-full overflow-y-auto px-4 custom-scrollbar"> 
      <div className="flex flex-col gap-4 "> 
        {history.map((msg, index) => {
          const isUser = msg.role === "user";
          
          return (
            <div
              key={index}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`
                  relative px-6 py-4 max-w-[85%] sm:max-w-md
                  text-lg font-medium leading-relaxed shadow-sm
                  ${!isUser 
                    ? "bg-[#6AAFA1] text-white rounded-2xl rounded-bl-none ml-2" 
                    : "bg-white text-gray-700 rounded-2xl rounded-br-none mr-2"
                  }
                `}
              >
                {!isUser && <BotTail />}
                {isUser && <UserTail />}

                <div className="whitespace-pre-wrap break-words">
                  {msg.parts.map((part, idx) => (
                    <span key={idx}>{part.text}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}