"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, FileText, Edit2, Plus, Clock 
} from "lucide-react";

export default function PatientDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allAvailableExercises, setAllAvailableExercises] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchPatient();
      fetchExercisesList();
    }
  }, [studentId]);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/therapist/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Controllo per evitare il bug "Unexpected Token <"
      if (!res.ok) throw new Error("Risposta del server non valida");
      const data = await res.json();
      setPatient(data);
    } catch (err) { 
      console.error("Errore caricamento:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchExercisesList = async () => {
    try {
      const res = await fetch('/api/exercises');
      if (res.ok) setAllAvailableExercises(await res.json());
    } catch (err) { console.error(err); }
  };

  const filteredExercises = useMemo(() => {
    return allAvailableExercises.filter(ex =>
      ex.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allAvailableExercises]);

  const handleAddExercise = async (exercise: any) => {
    try {
      const res = await fetch('/api/exercises/add-to-path', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fileName: exercise.fileName,
          childId: studentId,
          title: exercise.displayName
        })
      });
      if (res.ok) {
        fetchPatient();
        setSearchTerm("");
        setIsDropdownOpen(false);
        setEditingSessionId(null);
      }
    } catch (err) { alert("Errore al salvataggio"); }
  };

  if (loading) return <div className="p-10 text-slate-400 font-medium">Caricamento paziente...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFB] font-sans text-slate-700 antialiased">
      <main className="flex-1 p-10 overflow-y-auto">
        <Link href="/therapist/patients" className="flex items-center gap-2 text-[#4D8B7D] mb-8 text-sm font-medium">
          <ArrowLeft size={18} /> Torna ai pazienti
        </Link>

        {/* Header Paziente */}
        <header className="flex items-center gap-6 mb-12">
          <div className="w-20 h-20 rounded-2xl bg-[#67A495] text-white flex items-center justify-center text-3xl font-semibold shadow-sm">
            {patient?.initials || patient?.name?.[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0E2A47]">{patient?.name} {patient?.surname}</h1>
            <p className="text-slate-500 text-sm mt-1">{patient?.age} anni • {patient?.appointments?.length || 0} sedute totali</p>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Info Side */}
          <div className="col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-purple-400"><FileText size={18} /><span className="font-bold text-[#0E2A47]">Diagnosi</span></div>
                <Edit2 size={14} className="text-slate-300 cursor-pointer" />
              </div>
              <p className="text-sm text-slate-500 border-l-2 border-purple-100 pl-3">{patient?.diagnosis || "Nessuna diagnosi"}</p>
            </section>
          </div>

          {/* Sedute Side */}
          <div className="col-span-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 min-h-[600px]">
              <div className="flex items-center gap-3 mb-8">
                <Calendar className="text-[#67A495]" size={24} />
                <h2 className="text-xl font-bold text-[#0E2A47]">Sedute e Percorso Personalizzato</h2>
              </div>

              <div className="space-y-6">
                {patient?.appointments?.map((app: any) => (
                  <div key={app.id} className="border border-slate-100 rounded-2xl p-6 hover:border-teal-100 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl text-[#67A495]"><Calendar size={18} /></div>
                        <div>
                          {/* Data e Ora sincronizzati dal calendario */}
                          <p className="font-bold text-[#0E2A47]">
                            {app.startTime ? new Date(app.startTime).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : "Data non definita"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-slate-400">
                              {app.startTime ? new Date(app.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : "--:--"} 
                              {" • "} {app.duration || '45 min'}
                            </p>
                            {/* Badge dinamico basato sul database */}
                            {app.type && (
                              <span className="text-[10px] font-bold bg-teal-50 text-[#67A495] px-2 py-0.5 rounded-full uppercase">
                                {app.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEditingSessionId(editingSessionId === app.id ? null : app.id)}
                        className={`p-2 rounded-lg transition-colors ${editingSessionId === app.id ? 'bg-[#67A495] text-white' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>

                    {editingSessionId === app.id && (
                      <div className="mt-6 p-5 bg-slate-50 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-[10px] font-bold text-[#67A495] uppercase mb-3 tracking-wider">Aggiungi esercizio</p>
                        <div className="relative">
                          <input 
                            type="text"
                            className="w-full p-3 rounded-xl border-none text-sm shadow-sm focus:ring-2 focus:ring-teal-100"
                            placeholder="Cerca esercizio..."
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); setIsDropdownOpen(true);}}
                          />
                          {isDropdownOpen && searchTerm && (
                            <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-48 overflow-auto">
                              {filteredExercises.map(ex => (
                                <div key={ex.fileName} onClick={() => handleAddExercise(ex)} className="p-4 hover:bg-teal-50 cursor-pointer text-sm font-medium flex justify-between group">
                                  <span className="text-[#0E2A47] group-hover:text-[#67A495]">{ex.displayName}</span>
                                  <Plus size={16} className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}