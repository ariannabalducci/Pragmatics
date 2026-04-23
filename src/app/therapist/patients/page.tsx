"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Users, LayoutDashboard, Calendar as CalendarIcon, 
  LogOut, Plus, Search, Calendar, Activity, FileText, 
  Sparkles
} from "lucide-react";
import { PatientListItem } from "@/types";
import AddPatientModal from "@/components/ui/AddPatientModal";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/therapist/student", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatients(data);
      }
    } catch (err) {
      console.error("Errore fetching pazienti", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      `${p.name} ${p.surname}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, patients]);

  return (
    <div className="flex h-screen bg-[#f4f9f8] font-sans antialiased">
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

            {/* Voce PAZIENTI Attiva - Sfondo Bianco e Testo Verde */}
            <div className="flex items-center gap-3 bg-white text-[#4d8b7d] px-4 py-3 rounded-xl font-semibold shadow-sm">
              <Users className="w-5 h-5" />
              Pazienti
            </div>
            
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

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#0e2a47]">Pazienti</h2>
            <p className="text-slate-500 font-medium text-lg">Gestisci i tuoi pazienti in carico</p>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 min-h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-[#0e2a47]">Elenco Pazienti</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#4d8b7d] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition shadow-sm"
            >
              <Plus size={18} /> Aggiungi Paziente
            </button>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Cerca per nome o cognome..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#4d8b7d] font-medium text-slate-700 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <p className="text-slate-400 animate-pulse">Caricamento...</p>
            ) : filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </div>
      </main>

      <AddPatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPatients} 
      />
    </div>
  );
}

function PatientCard({ patient }: { patient: PatientListItem }) {
  const formattedDate = patient.lastSessionDate 
    ? new Date(patient.lastSessionDate).toLocaleDateString('it-IT', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : "---";

  return (
    <Link href={`/therapist/patients/${patient.id}`} className="group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#eff9f8] text-[#4d8b7d] flex items-center justify-center font-bold text-lg group-hover:bg-[#4d8b7d] group-hover:text-white transition-colors">
          {patient.initials}
        </div>
        <div>
          <h4 className="text-xl font-bold text-slate-800">{patient.name} {patient.surname}</h4>
          <p className="text-slate-500 font-medium">{patient.age} anni</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Calendar size={18} className="text-slate-400" />
          <span className="text-sm font-medium">Ultima seduta: <span className="font-bold">{formattedDate}</span></span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Activity size={18} className="text-slate-400" />
          <span className="text-sm font-medium"><span className="font-bold">{patient.totalSessions}</span> sedute totali</span>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-100 flex items-center gap-3 text-slate-500">
        <FileText size={18} className="text-slate-400" />
        <span className="text-sm italic">{patient.diagnosis || "Nessuna diagnosi"}</span>
      </div>
    </Link>
  );
}