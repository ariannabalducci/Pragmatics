"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Users, LayoutDashboard, Calendar as CalendarIcon, Sparkles, Send, HelpCircle, LogOut 
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function AI_AssistantPage() {
  const [messages, setMessages] = useState<{ role: string; content: string; time?: string }[]>([
    { 
      role: "assistant", 
      content: "Ciao! Sono l'assistente virtuale di Praggymatics. Posso aiutarti con suggerimenti sugli esercizi, informazioni cliniche o rispondere a domande sulla tua pratica logopedica. Come posso esserti utile oggi?",
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      role: "user", 
      content: input, 
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/therapist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: input }] 
        }),
      });
      
      const data = await res.json();
      
      if (data.message) {
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: data.message,
          time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
        }]);
      }
    } catch (err) {
      console.error("Errore invio messaggio:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Suggeriscimi esercizi per la pragmatica",
    "Come trattare il rotacismo?",
    "Strategie per migliorare la narrazione",
    "Gestione bambini con autismo",
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFB] font-sans text-slate-700 antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-[#4d8b7d] flex flex-col justify-between py-8 shrink-0">
        <div>
          <div className="px-6 flex items-center gap-3 mb-12">
            <div className="bg-white/20 p-2 rounded-xl text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Praggymatics</h1>
              <p className="text-white/70 text-xs">Dashboard Logopedista</p>
            </div>
          </div>

          <nav className="px-4 space-y-2">
            <Link href="/therapist/dashboard" className="flex items-center gap-3 text-white/90 hover:bg-white/10 px-4 py-3 rounded-xl transition font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/therapist/patients" className="flex items-center gap-3 text-white/90 hover:bg-white/10 px-4 py-3 rounded-xl transition font-medium">
              <Users className="w-5 h-5" />
              Pazienti
            </Link>
            <Link href="/therapist/calendar" className="flex items-center gap-3 text-white/90 hover:bg-white/10 px-4 py-3 rounded-xl transition font-medium">
              <CalendarIcon className="w-5 h-5" />
              Calendario
            </Link>
            <div className="flex items-center gap-3 bg-white text-[#4d8b7d] px-4 py-3 rounded-xl font-semibold shadow-sm">
              <Sparkles className="w-5 h-5" />
              Assistente AI
            </div>
          </nav>
        </div>

        <div className="px-4">
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="flex items-center gap-3 text-white/90 hover:text-white px-4 py-3 w-full transition font-medium hover:bg-white/10 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden p-10 flex flex-col">
        <header className="mb-10 flex items-center gap-4">
          <div className="p-3.5 bg-[#67A495]/10 text-[#67A495] rounded-xl border border-[#67A495]/20">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#0E2A47]">Assistente Logopedico AI</h2>
            <p className="text-slate-500 font-medium mt-1">Supporto clinico avanzato (Evidence-Based)</p>
          </div>
        </header>

        <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50 flex flex-col overflow-hidden">
          
          {/* Messages Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-6 pr-3 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="p-2.5 bg-[#F0F7F6] text-[#67A495] rounded-xl shrink-0 border border-[#67A495]/10 shadow-sm">
                    <Sparkles size={20} />
                  </div>
                )}
                
                <div className={`p-5 rounded-2xl shadow-sm ${
                  msg.role === "user" 
                    ? "bg-[#0E2A47] text-white rounded-tr-none max-w-[75%]" 
                    : "bg-[#F0F7F6] text-slate-800 rounded-tl-none border border-slate-100 max-w-[85%]"
                }`}>
                  {/* Rendering Markdown per gestire grassetti, liste e fonti senza simboli brutti */}
                  <div className={`text-sm leading-relaxed ${msg.role === "user" ? "prose-invert" : "prose prose-slate prose-sm"}`}>
                    <ReactMarkdown 
                      components={{
                        // Assicura che le liste e i paragrafi non abbiano margini eccessivi
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  
                  <p className={`text-[10px] mt-2.5 font-medium ${msg.role === "user" ? "text-white/60 text-right" : "text-slate-400"}`}>
                    {msg.time}
                  </p>
                </div>

                {msg.role === "user" && (
                  <div className="w-10 h-10 rounded-xl bg-[#0E2A47]/10 flex items-center justify-center text-[#0E2A47] font-bold shrink-0 border border-[#0E2A47]/10">
                    Tu
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="p-2.5 bg-[#F0F7F6] text-[#67A495] rounded-xl shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="bg-[#F0F7F6] p-4 rounded-2xl flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-[#67A495] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#67A495] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-[#67A495] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* SUGGESTED QUESTIONS - Solo se la chat è vuota */}
          {messages.length < 2 && (
            <div className="mt-8 pt-6 border-t border-dashed border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-[#4D8B7D]">
                <Sparkles size={16} />
                <p className="text-[10px] font-bold uppercase tracking-wider">Domande suggerite:</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-4xl">
                {suggestedPrompts.map(prompt => (
                  <button 
                    key={prompt} 
                    onClick={() => setInput(prompt)}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-[#F0F7F6] hover:border-[#67A495]/30 text-slate-700 text-sm font-medium text-left transition-all active:scale-[0.98]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <form onSubmit={sendMessage} className="mt-8 relative max-w-5xl mx-auto w-full">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chiedi supporto clinico o fonti scientifiche..."
              className="w-full p-4 pr-16 bg-slate-50 rounded-full border-2 border-transparent focus:border-[#67A495]/20 focus:bg-white text-sm outline-none transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-5 bg-[#67A495] text-white rounded-full hover:bg-[#3D6E63] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}