"use client";

import Link from "next/link";
import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon, Clock, User, Plus, LogOut,
  LayoutDashboard, Users, FileText, ChevronLeft, ChevronRight, Target, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from "date-fns";
import { it } from "date-fns/locale";

const BRAND = {
  primary: "#5FA293",
  primaryLight: "#6BB4A4",
  bg: "#F0F7F5",
  textDark: "#2D4A43",
  textMuted: "#8BA8A1",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 3, 17));
  const [appointments, setAppointments] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]); // Stato per i bambini dal DB
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    childId: "", // Usiamo l'ID invece del nome testuale
    time: "10:00",
    type: "training",
    note: "",
    duration: "45 min"
  });

  // 1. CARICAMENTO DATI (Con gestione Token)
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Recuperiamo il token dal localStorage (o dove lo salvi al login)
      const token = localStorage.getItem('token'); 

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [appRes, childRes] = await Promise.all([
        fetch('/api/appointments', { headers }),
        fetch('/api/therapist/student', { headers })
      ]);
      
      // Se l'API risponde 401, il token è scaduto o mancante
      if (childRes.status === 401) {
        console.error("Non autorizzato. Controlla il login.");
        return;
      }

      const appData = await appRes.json();
      const childData = await childRes.json();
      
      console.log("Pazienti caricati:", childData); // Debug per vedere se arrivano i dati

      setAppointments(Array.isArray(appData) ? appData : []);
      // Gestiamo il caso in cui i dati siano in un sotto-oggetto o array
      setChildren(Array.isArray(childData) ? childData : (childData.students || []));
      
    } catch (err) {
      console.error("Errore caricamento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. SALVATAGGIO DINAMICO (Con gestione Token)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newApp.childId) {
      alert("Per favore, seleziona un paziente dalla lista.");
      return;
    }

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
          duration: newApp.duration,
          note: newApp.note
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewApp({ childId: "", time: "10:00", type: "training", note: "", duration: "45 min" });
        fetchData(); // Ricarica la lista per vedere il nuovo appuntamento
      } else {
        const errData = await res.json();
        alert(`Errore: ${errData.error || "Impossibile salvare l'appuntamento"}`);
      }
    } catch (err) {
      alert("Errore di connessione. Verifica la tua rete.");
    }
  };

  // 3. ELIMINAZIONE (Con gestione Token)
  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo appuntamento?")) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      } else {
        alert("Errore nella cancellazione dell'appuntamento.");
      }
    } catch (err) {
      alert("Errore di rete durante l'eliminazione.");
    }
  };

  // 4. LOGICA CALENDARIO (Resta invariata)
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.startTime);
      return isSameDay(appDate, selectedDate);
    });
  }, [appointments, selectedDate]);
  return (
    <div className="flex min-h-screen font-sans antialiased" style={{ backgroundColor: BRAND.bg }}>

      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0" style={{ backgroundColor: BRAND.primary, color: "white" }}>
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-[#E0EEF0] rounded-xl text-[#5FA293]"><Target size={24} /></div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Praggymatics</h1>
              <p className="text-[10px] opacity-70 uppercase tracking-tighter">Dashboard Logopedista</p>
            </div>
          </div>
          <nav className="space-y-2">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/therapist/dashboard" />
            <NavItem icon={<Users size={20} />} label="Pazienti" href="/pazienti" />
            <NavItem icon={<CalendarIcon size={20} />} label="Calendario" href="/therapist/calendar" active />
          </nav>
        </div>
        <Link href="/" className="flex items-center gap-3 px-4 py-3 opacity-80 hover:opacity-100 transition">
          <LogOut size={20} /><span>Esci</span>
        </Link>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-4xl font-extrabold" style={{ color: "#4A7A6F" }}>Calendario</h2>
          <p className="text-slate-500 font-medium">Gestisci i tuoi appuntamenti</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* CALENDARIO */}
          <div className="flex-1 bg-white rounded-[40px] p-10 shadow-sm border border-white">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black capitalize" style={{ color: BRAND.textDark }}>
                {format(currentMonth, "MMMM yyyy", { locale: it })}
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={() => { const t = new Date(); setCurrentMonth(t); setSelectedDate(t); }} className="px-5 py-1.5 bg-[#E8F3F1] font-bold rounded-lg text-sm transition-colors hover:bg-[#d5e9e6]" style={{ color: BRAND.primary }}>Oggi</button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="w-full max-w-2xl mx-auto">
              <div className="grid grid-cols-7 mb-6 text-center">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                  <div key={d} className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.textMuted }}>{d}</div>
                ))}

                {days.map((date, i) => {
                  const isSel = isSameDay(date, selectedDate);
                  const isCurr = isSameMonth(date, currentMonth);
                  const hasEvent = appointments.some(app => isSameDay(new Date(app.startTime), date)) && isCurr;

                  return (
                    <div key={i} className="aspect-[4/5] flex items-center justify-center relative">
                      <button
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "w-16 h-20 rounded-[20px] flex flex-col items-center justify-center transition-all relative",
                          isSel ? "shadow-lg shadow-teal-900/10 scale-105 text-white" : "hover:bg-slate-50 text-[#2D4A43]",
                          !isCurr && "opacity-20"
                        )}
                        style={{ backgroundColor: isSel ? BRAND.primaryLight : "transparent" }}
                      >
                        <span className="text-base font-black mb-1">{format(date, "d")}</span>
                        {hasEvent && !isSel && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primaryLight }}></div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F0F7F5] rounded-2xl text-[#5FA293]"><CalendarIcon size={24} /></div>
                <div>
                  <h4 className="font-extrabold text-xl">{format(selectedDate, "d MMMM", { locale: it })}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                    {selectedDayAppointments.length} Appuntamenti
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-slate-400 text-sm italic">Caricamento...</p>
              ) : selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map((app) => (
                  <AppointmentCard
                    key={app.id}
                    id={app.id}
                    time={format(new Date(app.startTime), "HH:mm")}
                    name={app.patientName || app.child?.user?.name || "Paziente"}
                    type={app.type}
                    duration={app.duration}
                    note={app.note}
                    onDelete={() => handleDeleteAppointment(app.id)}
                  />
                ))
              ) : (
                <p className="text-center text-slate-400 text-sm py-10 italic">Nessun impegno per oggi</p>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-teal-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND.primaryLight }}
            >
              <Plus size={20} /> Nuovo Appuntamento
            </button>
          </div>
        </div>
      </main>

      {/* MODALE NUOVO APPUNTAMENTO DINAMICA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Crea Appuntamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Data Appuntamento</label>
                <input
                  type="date"
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-black focus:ring-2 focus:ring-[#6BB4A4]"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>

              {/* SELECT DINAMICA BAMBINI */}
<div>
  <label className="text-xs font-black uppercase text-slate-400 mb-2 block">
    Seleziona Paziente
  </label>
  <div className="relative">
    <select 
      required
      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-black focus:ring-2 focus:ring-[#6BB4A4] appearance-none cursor-pointer"
      value={newApp.childId}
      onChange={(e) => {
        console.log("Paziente selezionato ID:", e.target.value);
        setNewApp({...newApp, childId: e.target.value});
      }}
    >
      <option value="" disabled>Scegli il paziente...</option>
      
      {children && children.length > 0 ? (
        children.map((child: any) => {
          // Determina l'ID (prova userId, poi id)
          const childId = child.userId || child.id;
          // Determina il Nome (prova user.name, poi name diretto)
          const name = child.user?.name || child.name || "Paziente";
          const surname = child.user?.surname || child.surname || "";

          return (
            <option key={childId} value={childId}>
              {name} {surname}
            </option>
          );
        })
      ) : (
        <option value="" disabled>Nessun paziente trovato</option>
      )}
    </select>
    
    {/* Piccola freccia estetica visto che abbiamo usato appearance-none */}
    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Orario</label>
                  <input
                    type="time"
                    required
                    value={newApp.time}
                    onChange={(e) => setNewApp({ ...newApp, time: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-black focus:ring-2 focus:ring-[#6BB4A4]"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Tipo</label>
                  <select
                    value={newApp.type}
                    onChange={(e) => setNewApp({ ...newApp, type: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-black focus:ring-2 focus:ring-[#6BB4A4]"
                  >
                    <option value="training">Training</option>
                    <option value="valutazione">Valutazione</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Note (Opzionale)</label>
                <textarea
                  value={newApp.note}
                  onChange={(e) => setNewApp({ ...newApp, note: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium text-black h-24 focus:ring-2 focus:ring-[#6BB4A4]"
                  placeholder="Es: Focus su fonetica..."
                />
              </div>

              <button type="submit" className="w-full py-5 rounded-2xl text-white font-black text-lg shadow-lg hover:brightness-110 transition-all" style={{ backgroundColor: BRAND.primary }}>
                Conferma e Salva
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: any, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className="block w-full text-white">
      <button className={cn("flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold transition-all", active ? "bg-white shadow-md text-[#5FA293]" : "hover:bg-white/10 opacity-80")}>
        {icon}<span>{label}</span>
      </button>
    </Link>
  );
}

function AppointmentCard({ id, time, name, type, duration, note, onDelete }: any) {
  const isVal = type === "valutazione";
  return (
    <div className="p-6 bg-white rounded-[30px] border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", isVal ? "bg-purple-400" : "bg-[#6BB4A4]")} />
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-slate-800"><Clock size={16} className="text-slate-300" />{time}</div>
        <div className="flex items-center gap-2">
          <span className={cn("px-3 py-1 rounded-full text-[10px] uppercase tracking-widest", isVal ? "bg-purple-50 text-purple-500" : "bg-teal-50 text-teal-600")}>{type}</span>
          {onDelete && (
            <button type="button" onClick={onDelete} className="text-slate-300 hover:text-red-500 transition-colors" aria-label="Elimina appuntamento">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <h5 className="text-lg text-slate-800 mb-1 flex items-center gap-2 font-bold"><User size={16} className="text-slate-300" />{name}</h5>
      <p className="text-xs text-slate-400 mb-3 font-medium">Durata: {duration}</p>
      {note && <div className="pt-3 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-[11px] italic transition-colors group-hover:text-slate-600"><FileText size={12} />{note}</div>}
    </div>
  );
}