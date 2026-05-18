"use client";

import { ChildData, Appointment } from "../../../types";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Users,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Dashboard() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [exercises, setExercises] = useState<any[]>([]); // Stato per la libreria esercizi
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const [studentsRes, appointmentsRes, exercisesRes] = await Promise.all([
          fetch("/api/therapist/student", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/appointments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/exercises", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const studentsData = await studentsRes.json();
        const appointmentsData = await appointmentsRes.json();
        const exercisesData = await exercisesRes.json();

        setChildren(Array.isArray(studentsData) ? studentsData : []);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        setExercises(Array.isArray(exercisesData) ? exercisesData : []);
      } catch (err) {
        console.error("Errore caricamento", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtro e formattazione appuntamenti di oggi
  const appointmentsToday = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString(); // Per un confronto date più semplice

    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate.toDateString() === todayStr;
      })
      .map((apt) => ({
        ...apt,
        // Usiamo childName che arriva dalla tua API aggiornata
        displayChildName: apt.childName || "Paziente non specificato",
        displayTime: new Date(apt.startTime).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
  }, [appointments]);


  const exercisesByCategory = useMemo(() => {
    const grouped: Record<string, typeof exercises> = {};
    for (const ex of exercises) {
      const label = ex.groupTypeLabel || ex.groupType;
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(ex);
    }
    return grouped;
  }, [exercises]);

  return (
    <div className="flex h-screen bg-[#f4f9f8] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#4d8b7d] flex flex-col justify-between py-8">
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
            <Link href="/therapist/dashboard" className="flex items-center gap-3 bg-white text-[#4d8b7d] px-4 py-3 rounded-xl font-semibold shadow-sm">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-[#0e2a47]">Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Benvenuto nella tua area di lavoro</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Pazienti Seguiti</p>
              <span className="text-5xl font-bold text-[#4d8b7d]">{children.length}</span>
            </div>
            <div className="bg-[#eff9f8] p-3 rounded-xl text-[#4d8b7d]">
              <Users className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Appuntamenti Oggi</p>
              <span className="text-5xl font-bold text-[#7d5ba6]">{appointmentsToday.length}</span>
            </div>
            <div className="bg-[#f6f2fa] p-3 rounded-xl text-[#7d5ba6]">
              <CalendarIcon className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Today's Appointments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-[#0e2a47]">Appuntamenti di Oggi</h3>
              <Link href="/therapist/calendar" className="text-[#4d8b7d] font-bold text-sm flex items-center gap-1 hover:underline">
                Vedi tutti <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-400">Caricamento...</p>
              ) : appointmentsToday.length > 0 ? (
                appointmentsToday.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-5 bg-[#f0f7f6] rounded-2xl border border-transparent hover:border-[#4d8b7d]/20 transition">
                    <div className="flex items-center gap-5">
                      <div className="bg-[#4d8b7d] p-3 rounded-xl text-white">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-800">{apt.displayChildName}</p>
                        <p className="text-sm text-slate-500 font-medium">
                          {apt.displayTime} • {apt.duration} • <span className="italic">{apt.type}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-4 text-center">Nessun appuntamento previsto per oggi.</p>
              )}
            </div>
          </section>

          {/* Nuova Sezione Libreria Esercizi */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-[#0e2a47]">Libreria Esercizi</h3>
              <span className="bg-[#eff9f8] text-[#4d8b7d] px-3 py-1 rounded-full text-xs font-bold uppercase">{exercises.length} Disponibili</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(exercisesByCategory).map(([category, catExercises]) => {
                const isExpanded = expandedCategory === category;
                return (
                  <div key={category} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all">
                    <button 
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg text-[#4d8b7d] shadow-sm">
                          <TrendingUp size={18} />
                        </div>
                        <h4 className="font-bold text-[#0e2a47]">{category}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">
                          {catExercises.length}
                        </span>
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border-t border-slate-100 mt-2">
                        {catExercises.map((ex) => (
                          <div key={ex.id} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-[#4d8b7d]/30 transition group cursor-default">
                            <p className="font-bold text-[#0e2a47] text-xs leading-tight mb-1 truncate" title={ex.displayName}>{ex.displayName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate" title={ex.topic}>{ex.topic}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="fixed bottom-6 right-8">
          <button className="bg-white border border-slate-200 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </main>
    </div>
  );
}