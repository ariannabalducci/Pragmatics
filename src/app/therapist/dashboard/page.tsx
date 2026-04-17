"use client";

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
} from "lucide-react";

type ChildData = {
  id: string;
  name: string;
  age: number;
  gender: string;
  sessionsCompleted?: number;
};

type Appointment = {
  id: string;
  childName: string;
  startTime: string;
  time?: string;
  duration: number;
  type: string;
};

export default function Dashboard() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const [studentsRes, appointmentsRes] = await Promise.all([
          fetch("/api/therapist/student", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/appointments"),
        ]);

        const studentsData = await studentsRes.json();
        const appointmentsData = await appointmentsRes.json();

        setChildren(Array.isArray(studentsData) ? studentsData : []);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      } catch (err) {
        console.error("Errore caricamento", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const appointmentsToday = useMemo<Appointment[]>(() => {
    const today = new Date();
    return appointments
      .filter((apt) => {
        const date = new Date(apt.startTime);
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      })
      .map((apt) => ({
        ...apt,
        id: apt.id,
        childName: apt.childName,
        time: apt.time ?? new Date(apt.startTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        duration: apt.duration,
        type: apt.type,
      }));
  }, [appointments]);

  const totalSessions = children.reduce((sum, c) => sum + (c.sessionsCompleted ?? 0), 0);

  return (
    <div className="flex h-screen bg-[#f4f9f8] font-sans text-slate-800">
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
          </nav>
        </div>

        <div className="px-4">
          <button className="flex items-center gap-3 text-white/90 hover:text-white px-4 py-3 w-full transition font-medium">
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-[#0e2a47]">Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Benvenuto nella tua area di lavoro</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Pazienti Seguiti</p>
              <span className="text-5xl font-bold text-[#4d8b7d]">{children.length || 5}</span>
            </div>
            <div className="bg-[#eff9f8] p-3 rounded-xl text-[#4d8b7d]">
              <Users className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Appuntamenti Oggi</p>
              <span className="text-5xl font-bold text-[#7d5ba6]">{appointmentsToday.length || 3}</span>
            </div>
            <div className="bg-[#f6f2fa] p-3 rounded-xl text-[#7d5ba6]">
              <CalendarIcon className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Sedute Totali</p>
              <span className="text-5xl font-bold text-[#3b82f6]">{totalSessions || 117}</span>
            </div>
            <div className="bg-[#eff6ff] p-3 rounded-xl text-[#3b82f6]">
              <TrendingUp className="w-7 h-7" />
            </div>
          </div>
        </div>

        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-[#0e2a47]">Appuntamenti di Oggi</h3>
            <Link href="#" className="text-[#4d8b7d] font-bold text-sm flex items-center gap-1 hover:underline">
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
                      <p className="font-bold text-lg text-slate-800">{apt.childName}</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {apt.time} • {apt.duration} min • <span className="italic">{apt.type}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 py-4 text-center">Nessun appuntamento previsto.</p>
            )}
          </div>
        </section>

        <div className="fixed bottom-6 right-8">
          <button className="bg-white border border-slate-200 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </main>
    </div>
  );
}
