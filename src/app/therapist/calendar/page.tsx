"use client";

import Link from "next/link";
import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon, Clock, User, Plus, LogOut,
  LayoutDashboard, Users, FileText, ChevronLeft, ChevronRight, Target, X,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from "date-fns";
import { it } from "date-fns/locale";

const BRAND = {
  primary: "#4d8b7d",
  primaryLight: "#eff9f8",
  bg: "#f4f9f8",
  textDark: "#0e2a47",
};

export default function CalendarPage() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newApp, setNewApp] = useState({
    childId: "",
    time: "10:00",
    type: "training",
    note: "",
    duration: 45,
    trainingExercises: 0,
    testingExercises: 0,
    prescribedGroups: [] as string[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [appRes, childRes, exRes] = await Promise.all([
        fetch('/api/appointments', { headers }),
        fetch('/api/therapist/student', { headers }),
        fetch('/api/exercises', { headers })
      ]);

      const appData = await appRes.json();
      const childData = await childRes.json();
      const exData = await exRes.json();

      setAppointments(Array.isArray(appData) ? appData : []);
      setChildren(Array.isArray(childData) ? childData : (childData.students || []));
      setAllExercises(Array.isArray(exData) ? exData : []);
    } catch (err) {
      console.error("Errore caricamento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.childId) return alert("Seleziona un paziente.");

    const token = localStorage.getItem('token');
    const [hours, minutes] = newApp.time.split(":");
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes));

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          childId: newApp.childId,
          type: newApp.type,
          duration: Number(newApp.duration),
          note: newApp.note,
          trainingExercises: Number(newApp.trainingExercises),
          testingExercises: Number(newApp.testingExercises),
          prescribedGroups: newApp.prescribedGroups,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewApp({ childId: "", time: "10:00", type: "training", note: "", duration: 45, trainingExercises: 1, testingExercises: 0, prescribedGroups: [] });
        fetchData();
      }
    } catch (err) {
      alert("Errore di connessione.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Sei sicuro?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Errore di rete.");
    }
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayAppointments = useMemo(() => {
    return appointments.filter(app => isSameDay(new Date(app.startTime), selectedDate));
  }, [appointments, selectedDate]);

  return (
    <div className="flex h-screen overflow-hidden font-sans antialiased" style={{ backgroundColor: BRAND.bg }}>

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
            
            {/* Voce CALENDARIO Attiva - Sfondo Bianco e Testo Verde */}
            <div className="flex items-center gap-3 bg-white text-[#4d8b7d] px-4 py-3 rounded-xl font-semibold shadow-sm">
              <CalendarIcon className="w-5 h-5" />
              Calendario
            </div>
            
            <Link href="/therapist/ai-assistant" className="flex items-center gap-3 text-white/90 hover:bg-white/10 px-4 py-3 rounded-xl transition font-medium">
              <Sparkles className="w-5 h-5" />
              Assistente AI
            </Link>
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-[#0e2a47]">Calendario</h2>
          <p className="text-slate-500 font-medium mt-1">Organizza le tue sedute</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold capitalize text-[#0e2a47]">
                {format(currentMonth, "MMMM yyyy", { locale: it })}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-[#eff9f8] rounded-lg transition-colors text-[#4d8b7d]"><ChevronLeft size={20} /></button>
                <button onClick={() => { const t = new Date(); setCurrentMonth(t); setSelectedDate(t); }} className="px-4 py-1.5 bg-[#eff9f8] font-bold rounded-lg text-sm text-[#4d8b7d] hover:bg-[#e0eeed]">Oggi</button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-[#eff9f8] rounded-lg transition-colors text-[#4d8b7d]"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                <div key={d} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">{d}</div>
              ))}
              {days.map((date, i) => {
                const isSel = isSameDay(date, selectedDate);
                const isCurr = isSameMonth(date, currentMonth);
                const hasEvent = appointments.some(app => isSameDay(new Date(app.startTime), date)) && isCurr;
                return (
                  <div key={i} className="aspect-square flex items-center justify-center p-1">
                    <button
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "w-full h-full rounded-2xl flex flex-col items-center justify-center transition-all",
                        isSel ? "bg-[#4d8b7d] text-white shadow-lg scale-105" : "hover:bg-slate-50 text-slate-700",
                        !isCurr && "opacity-20"
                      )}
                    >
                      <span className="text-sm font-bold">{format(date, "d")}</span>
                      {hasEvent && !isSel && <div className="w-1 h-1 rounded-full bg-[#4d8b7d] mt-1" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE PANEL APPUNTAMENTI */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#eff9f8] rounded-2xl text-[#4d8b7d]"><CalendarIcon size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-[#0e2a47]">{format(selectedDate, "d MMMM", { locale: it })}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedDayAppointments.length} Appuntamenti</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-slate-400 text-xs italic">Caricamento...</p>
              ) : selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map((app) => (
                  <AppointmentCard
                    key={app.id}
                    id={app.id}
                    time={format(new Date(app.startTime), "HH:mm")}
                    name={app.childName || "Paziente"}
                    type={app.type}
                    duration={app.duration}
                    note={app.note}
                    trainingExercises={app.trainingExercises ?? 0}
                    testingExercises={app.testingExercises ?? 0}
                    prescribedExercises={app.prescribedExercises || []}
                    onDelete={() => handleDeleteAppointment(app.id)}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs italic">Nessun impegno</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-[#4d8b7d] text-white font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Nuovo Appuntamento
            </button>
          </div>
        </div>
      </main>

      {/* MODALE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0e2a47]">Nuovo Appuntamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Paziente</label>
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#4d8b7d] appearance-none cursor-pointer"
                  value={newApp.childId}
                  onChange={(e) => setNewApp({ ...newApp, childId: e.target.value })}
                >
                  <option value="" className="text-slate-400">Seleziona un paziente...</option>
                  {children.map((child: any) => (
                    <option key={child.userId || child.id} value={child.userId || child.id} className="text-slate-900">
                      {child.user?.name || child.name} {child.user?.surname || child.surname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Orario</label>
                  <input type="time" value={newApp.time} onChange={(e) => setNewApp({ ...newApp, time: e.target.value })} className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#4d8b7d]" />
                </div>
                <div>
                  {/* DURATA CUSTOM: Input numerico invece che select */}
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Durata (min)</label>
                  <input 
                    type="number" 
                    value={isNaN(newApp.duration) ? "" : newApp.duration} 
                    onChange={(e) => setNewApp({ ...newApp, duration: parseInt(e.target.value) || 1 })} 
                    className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#4d8b7d]" 
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Tipo</label>
                <select value={newApp.type} onChange={(e) => setNewApp({ ...newApp, type: e.target.value })} className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#4d8b7d] appearance-none cursor-pointer">
                  <option value="training">Training</option>
                  <option value="valutazione">Valutazione</option>
                </select>
              </div>

              <div className="bg-[#eff9f8] rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase text-[#4d8b7d] tracking-wider">Esercizi Prescritti</p>
                  <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full">{newApp.prescribedGroups.length} Selezionati</span>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {allExercises.map((ex) => {
                    const isSelected = newApp.prescribedGroups.includes(ex.id);
                    return (
                      <label 
                        key={ex.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all shadow-sm",
                          isSelected 
                            ? "border-[#4d8b7d] bg-[#eff9f8] scale-[1.01] shadow-md" 
                            : "border-transparent bg-white hover:border-slate-200"
                        )}
                      >
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-[#4d8b7d] rounded cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...newApp.prescribedGroups, ex.id]
                              : newApp.prescribedGroups.filter(id => id !== ex.id);
                            setNewApp({ ...newApp, prescribedGroups: ids });
                          }}
                        />
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-[#4d8b7d]" : "text-[#0e2a47]")}>
                            {ex.displayName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{ex.topic}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 space-y-3 hidden">
                {/* Legacy numerical limits hidden as requested */}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Note</label>
                <textarea
                  placeholder="Note specifiche..."
                  value={newApp.note}
                  onChange={(e) => setNewApp({ ...newApp, note: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-sm text-slate-900 h-24 resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#4d8b7d]"
                />
              </div>

              <button type="submit" className="w-full py-4 rounded-xl bg-[#4d8b7d] text-white font-bold hover:brightness-110 shadow-md transition-all active:scale-95">
                Salva Appuntamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ id, time, name, type, duration, note, trainingExercises, testingExercises, prescribedExercises, onDelete }: any) {
  return (
    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", type === "valutazione" ? "bg-purple-500" : "bg-[#4d8b7d]")} />

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#4d8b7d] uppercase tracking-wider">
          <Clock size={14} strokeWidth={3} /> {time}
        </div>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={18} /></button>
      </div>

      <h5 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-1">
        <User size={16} className="text-slate-400" />
        {name}
      </h5>

      <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-bold">Durata: {duration}</span>
        <span className={cn(
          "px-2 py-0.5 rounded-md uppercase text-[9px]",
          type === "valutazione" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"
        )}>
          {type}
        </span>
      </p>

      {(trainingExercises > 0 || testingExercises > 0) && prescribedExercises.length === 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {trainingExercises > 0 && (
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
              🟢 {trainingExercises} training
            </span>
          )}
          {testingExercises > 0 && (
            <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
              🟣 {testingExercises} valutazione
            </span>
          )}
        </div>
      )}

      {prescribedExercises.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Esercizi Prescritti</p>
          <div className="flex flex-wrap gap-2">
            {prescribedExercises.map((ex: any) => (
              <span key={ex.id} className="bg-teal-50 text-[#4d8b7d] text-[10px] font-bold px-2 py-1 rounded-lg border border-teal-100">
                {ex.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {note && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-700 italic leading-relaxed flex items-start gap-2">
          <FileText size={12} className="mt-0.5 text-slate-400 shrink-0" />
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}