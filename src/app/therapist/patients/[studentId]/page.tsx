"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, FileText, Edit2, Plus, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Target,
  TrendingUp, BookOpen, Activity, User as UserIcon, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Result {
  id: string;
  exerciseType: string;
  groupTitle: string;
  success: boolean;
  durationSeconds: number;
  triesTillCorrect: number;
  textAttempt: string | any[];
  createdAt: string;
}

interface Appointment {
  id: string;
  date: string;
  type: string;
  duration: string;
  note: string;
  isPast: boolean;
  results: Result[];
}

interface ProgressPoint {
  date: string;
  pragmatics: number | null;
  narrative: number | null;
}

interface Patient {
  id: string;
  name: string;
  surname: string;
  age: number;
  initials: string;
  diagnosis: string;
  objectives: string;
  notes: string;
  totalSessions: number;
  lastSessionDate: string | null;
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  progressData: ProgressPoint[];
}


export default function PatientDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<'diagnosis' | 'objectives' | 'notes' | null>(null);
  const [tempValues, setTempValues] = useState<{
    diagnosis?: string;
    objectives?: string;
    notes?: string;
  }>({});
  const [expandedResults, setExpandedResults] = useState<string[]>([]);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);


  useEffect(() => {
    if (studentId) fetchPatient();
  }, [studentId]);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/therapist/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load the patient");
      const data = await res.json();
      setPatient(data);
      setTempValues({
        diagnosis: data.diagnosis,
        objectives: data.objectives,
        notes: data.notes
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSaveField = async (field: 'diagnosis' | 'objectives' | 'notes') => {
    try {
      const res = await fetch(`/api/therapist/student/${studentId}`, {

        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          [field === 'diagnosis' ? 'description' :
            field === 'objectives' ? 'diagnosis' : 'internalNotes']: tempValues[field]
        })
      });
      if (res.ok && patient) {
        setPatient({ ...patient, [field]: tempValues[field] || "" });
        setEditingField(null);
      }

    } catch (err) { alert("Error saving the changes."); }
  };

  const handleResetProgress = async () => {
    if (!window.confirm(`Reset all section progress (Feelings, Reactions, Why, Cloze) for ${patient?.name}? The child will start over at their next login.`)) return;
    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/therapist/student/${studentId}/reset-progress`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setResetDone(true);
        setTimeout(() => setResetDone(false), 3000);
      } else {
        alert('Error resetting progress.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFB]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#67A495] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading patient...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-700 antialiased p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <Link href="/therapist/patients" className="inline-flex items-center gap-2 text-[#4D8B7D] mb-8 text-sm font-bold hover:translate-x-[-4px] transition-transform">
          <ArrowLeft size={16} /> Back to patients
        </Link>

        {/* Header (Figma style) */}
        <header className="flex items-center gap-6 mb-12">
          <div className="w-20 h-20 rounded-[2rem] bg-[#67A495] text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#67A495]/20">
            {patient?.initials}
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#0E2A47] tracking-tight">{patient?.name} {patient?.surname}</h1>
            <div className="flex items-center gap-4 text-slate-400 text-sm font-bold mt-2">
              <span className="flex items-center gap-1.5"><UserIcon size={14} className="text-[#67A495]" /> {patient?.age} years old</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#67A495]" /> {patient?.totalSessions} total sessions</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#67A495]" /> Last session: {patient?.lastSessionDate ? new Date(patient.lastSessionDate).toLocaleDateString('en-US') : 'N/A'}</span>
            </div>
          </div>
          {/* Reset progress button */}
          <div className="ml-auto">
            <button
              id="reset-progress-btn"
              onClick={handleResetProgress}
              disabled={resetting}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shadow-sm border",
                resetDone
                  ? "bg-green-50 text-green-600 border-green-100"
                  : "bg-red-50 text-red-400 border-red-100 hover:bg-red-100 hover:text-red-600",
                resetting && "opacity-60 cursor-not-allowed"
              )}
            >
              <RotateCcw size={15} className={resetting ? "animate-spin" : ""} />
              {resetDone ? "Progress reset ✓" : resetting ? "Resetting..." : "Reset Section Progress"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Info Cards */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* DIAGNOSIS */}
            <InfoCard
              title="Diagnosis"
              icon={<FileText size={18} className="text-purple-400" />}
              value={patient?.diagnosis}
              field="diagnosis"
              tempValue={tempValues.diagnosis}
              isEditing={editingField === 'diagnosis'}
              onEdit={() => setEditingField('diagnosis')}
              onChange={(v) => setTempValues({ ...tempValues, diagnosis: v })}
              onSave={() => handleSaveField('diagnosis')}
              onCancel={() => setEditingField(null)}
              renderList
            />

            {/* GOALS */}
            <InfoCard
              title="Goals"
              icon={<Target size={18} className="text-[#67A495]" />}
              value={patient?.objectives}
              field="objectives"
              tempValue={tempValues.objectives}
              isEditing={editingField === 'objectives'}
              onEdit={() => setEditingField('objectives')}
              onChange={(v) => setTempValues({ ...tempValues, objectives: v })}
              onSave={() => handleSaveField('objectives')}
              onCancel={() => setEditingField(null)}
              renderList
              bulletIcon={<CheckCircle2 size={16} className="text-[#67A495]" />}
            />

            {/* NOTES */}
            <InfoCard
              title="Notes"
              icon={<Edit2 size={18} className="text-blue-400" />}
              value={patient?.notes}
              field="notes"
              tempValue={tempValues.notes}
              isEditing={editingField === 'notes'}
              onEdit={() => setEditingField('notes')}
              onChange={(v) => setTempValues({ ...tempValues, notes: v })}
              onSave={() => handleSaveField('notes')}
              onCancel={() => setEditingField(null)}
            />
          </div>

          {/* RIGHT COLUMN: Sessions and Charts */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* PROGRESS CHART CARD */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-50 rounded-xl text-[#67A495]"><TrendingUp size={20} /></div>
                  <h2 className="text-xl font-black text-[#0E2A47]">Progress Over Time</h2>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#67A495]" /> Pragmatics
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Narrative
                  </div>
                </div>
              </div>

              <div className="h-64 w-full relative">
                <ProgressChart data={patient?.progressData || []} />
              </div>
            </section>

            {/* SESSIONS CARD */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-teal-50 rounded-xl text-[#67A495]"><Calendar size={20} /></div>
                <h2 className="text-xl font-black text-[#0E2A47]">Sessions and Personalized Plan</h2>
              </div>

              {/* Scheduled Sessions */}
              <div className="mb-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={14} /> Upcoming Sessions ({patient?.upcomingAppointments?.length || 0})
                </h3>
                <div className="space-y-3">
                  {patient?.upcomingAppointments?.map((app: any) => (
                    <SessionItem key={app.id} app={app} isUpcoming />
                  ))}
                  {patient?.upcomingAppointments?.length === 0 && (
                    <p className="text-sm text-slate-300 italic py-4">No upcoming sessions</p>
                  )}
                </div>
              </div>

              {/* Past Sessions */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={14} /> Past Sessions ({patient?.pastAppointments?.length || 0})
                </h3>
                <div className="space-y-3">
                  {patient?.pastAppointments?.map((app: any) => (
                    <SessionItem
                      key={app.id}
                      app={app}
                      isExpanded={expandedResults.includes(app.id)}
                      onToggle={() => {
                        setExpandedResults(prev => prev.includes(app.id) ? prev.filter(i => i !== app.id) : [...prev, app.id]);
                      }}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* LAST SESSION DETAILS */}
            {patient?.pastAppointments?.[0] && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-purple-50 rounded-xl text-purple-400"><TrendingUp size={20} /></div>
                  <h2 className="text-xl font-black text-[#0E2A47]">Last Session</h2>
                </div>

                <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <Calendar className="text-slate-400" size={18} />
                    <span className="text-lg font-black text-[#0E2A47]">
                      {new Date(patient.pastAppointments[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-slate-300 mx-2">•</span>
                    <span className="text-sm font-bold text-slate-400">{patient.pastAppointments[0].duration}</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Activities</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.pastAppointments[0].results.map((res, idx) => (
                          <span key={idx} className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-[#0E2A47] border border-slate-100 shadow-sm">

                            {res.groupTitle}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Results</p>
                      <p className="text-sm font-bold text-[#0E2A47] leading-relaxed">
                        {summarizeResults(patient.pastAppointments[0].results)}
                      </p>
                    </div>

                    {patient.pastAppointments[0].note && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notes</p>
                        <p className="text-sm text-slate-500 font-medium italic">"{patient.pastAppointments[0].note}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function summarizeResults(results: Result[]) {
  if (results.length === 0) return "No exercises recorded in this session.";
  const withErrors = results.filter((r) => r.triesTillCorrect > 0).length;
  const exercises = results.length === 1 ? "1 exercise" : `${results.length} exercises`;
  return `${exercises} completed, ${withErrors} with errors.`;
}

// SUB-COMPONENTS

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | undefined;
  tempValue: string | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  renderList?: boolean;
  bulletIcon?: React.ReactNode;
  field: string;
}

function InfoCard({
  title, icon, value, tempValue, isEditing,
  onEdit, onChange, onSave, onCancel, renderList, bulletIcon
}: InfoCardProps) {

  const listItems = value ? (typeof value === 'string' ? value.split(/[\n;]+/).filter(Boolean) : []) : [];

  return (
    <motion.section
      layout
      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 hover:shadow-md transition-shadow group relative"
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-black text-[#0E2A47] tracking-tight">{title}</span>
        </div>
        {!isEditing && (
          <button onClick={onEdit} className="p-2 bg-slate-50 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-[#67A495] hover:bg-teal-50">
            <Edit2 size={14} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className="w-full p-4 text-sm text-slate-600 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#67A495]/20 min-h-[120px] resize-none font-medium"
            value={tempValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="px-4 py-2 text-[11px] font-black text-slate-400 hover:text-slate-600">Cancel</button>
            <button onClick={onSave} className="px-5 py-2 text-[11px] font-black bg-[#67A495] text-white rounded-xl shadow-lg shadow-[#67A495]/20">Save</button>
          </div>
        </div>
      ) : (
        <div className="px-2">
          {renderList && listItems.length > 0 ? (
            <ul className="space-y-3">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm font-bold text-slate-500 leading-snug">
                  {bulletIcon || <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-200" />}
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-wrap">
              {value || `Add ${title.toLowerCase()}...`}
            </p>
          )}
        </div>
      )}
    </motion.section>
  );
}

interface SessionItemProps {
  app: Appointment;
  isUpcoming?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function SessionItem({ app, isUpcoming, isExpanded, onToggle }: SessionItemProps) {
  const [expandedChats, setExpandedChats] = useState<string[]>([]);

  const toggleChat = (resId: string) => {
    setExpandedChats(prev => prev.includes(resId) ? prev.filter(id => id !== resId) : [...prev, resId]);
  };

  return (
    <div className={cn(
      "group relative border border-slate-100 rounded-[1.8rem] p-5 transition-all bg-white",
      isUpcoming ? "hover:border-teal-100" : "hover:border-purple-100 shadow-sm"
    )}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl flex items-center justify-center",
            isUpcoming ? "bg-teal-50 text-[#67A495]" : "bg-purple-50 text-purple-400"
          )}>
            <Calendar size={18} />
          </div>
          <div>
            <p className="font-black text-[#0E2A47] text-sm">
              {new Date(app.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span className="text-slate-300 mx-2">•</span>
              {new Date(app.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm",
                isUpcoming ? "bg-white text-[#67A495] border border-teal-50" : "bg-white text-purple-400 border border-purple-50"
              )}>
                {app.type}
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">
                <Clock size={10} className="inline mr-1" /> {app.duration}
              </span>
              {!isUpcoming && app.results?.length > 0 && (
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">
                  <BookOpen size={10} className="inline mr-1" /> {app.results.length} exercises
                </span>
              )}
            </div>
          </div>
        </div>

        {!isUpcoming && app.results?.length > 0 && (
          <button onClick={onToggle} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-300 overflow-hidden">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
        {isUpcoming && (
          <button className="p-2 hover:bg-teal-50 rounded-xl transition-colors text-slate-300 hover:text-[#67A495]">
            <Edit2 size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-slate-50 space-y-3">
              {app.results.map((res, idx) => {
                const isChat = res.exerciseType === 'why' || res.exerciseType === 'feelings';
                const chatExpanded = expandedChats.includes(res.id);

                let chatHistory: { role: string, text: string }[] = [];
                if (isChat && res.textAttempt) {
                  try {
                    const parsed = typeof res.textAttempt === 'string' ? JSON.parse(res.textAttempt) : res.textAttempt;
                    if (Array.isArray(parsed)) {
                      chatHistory = parsed.map((m: any) => ({
                        role: m.role || '',
                        text: m.text || m.parts?.[0]?.text || ''
                      }));
                    }
                  } catch (e) {
                    console.error("Error parsing the chat history:", e);
                  }
                }

                return (
                  <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center justify-between p-4 bg-slate-50/20">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-xl",
                          res.success ? "bg-teal-100 text-[#67A495]" : "bg-red-100 text-red-500"
                        )}>
                          {res.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#0E2A47]">{res.groupTitle}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.exerciseType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 pr-4">
                        {isChat ? (
                          <button
                            onClick={() => toggleChat(res.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF8F8] text-[#67A495] hover:bg-[#DCEFEF] rounded-xl text-[11px] font-black transition-colors"
                          >
                            <FileText size={12} />
                            {chatExpanded ? "Hide Chat" : "View Chat"}
                          </button>
                        ) : (
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Errors</p>
                            <p className={cn("text-xs font-black", res.triesTillCorrect > 0 ? "text-orange-400" : "text-[#67A495]")}>
                              {res.triesTillCorrect || 0}
                            </p>
                          </div>
                        )}

                        <div className="text-right min-w-[60px]">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Time</p>
                          <p className="text-xs font-black text-[#0E2A47]">{res.durationSeconds}s</p>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isChat && chatExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-50/50 border-t border-slate-100 p-4"
                        >
                          <div className="max-w-2xl mx-auto space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chatbot Transcript</p>
                            {chatHistory.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No messages exchanged.</p>
                            ) : (
                              chatHistory.map((msg, mIdx) => {
                                const isUser = msg.role === 'user';
                                return (
                                  <div key={mIdx} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs font-medium ${
                                      isUser
                                        ? "bg-white text-gray-700 border border-slate-200 rounded-br-none shadow-sm"
                                        : "bg-[#67A495] text-white rounded-bl-none shadow-sm"
                                    }`}>
                                      <p className="font-bold text-[9px] uppercase tracking-wider opacity-60 mb-1">
                                        {isUser ? "Child" : "Praggy"}
                                      </p>
                                      <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {app.note && (
                <p className="text-[11px] italic text-slate-400 mt-4 px-2 font-medium">"{app.note}"</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressChart({ data }: { data: ProgressPoint[] }) {

  if (!data || data.length === 0) return (
    <div className="h-full w-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
      Not enough data for the chart
    </div>
  );

  const padding = 20;
  const width = 600; // Ref width for SVG
  const height = 240;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const pointsPragmatic = data.map((d, i) => {
    if (d.pragmatics === null) return null;
    const x = data.length > 1
      ? padding + (i / (data.length - 1)) * chartWidth
      : padding + chartWidth / 2;
    const y = height - padding - (d.pragmatics / 100) * chartHeight;
    return { x, y };
  }).filter(Boolean) as { x: number, y: number }[];

  const pointsNarration = data.map((d, i) => {
    if (d.narrative === null) return null;
    const x = data.length > 1
      ? padding + (i / (data.length - 1)) * chartWidth
      : padding + chartWidth / 2;
    const y = height - padding - (d.narrative / 100) * chartHeight;
    return { x, y };
  }).filter(Boolean) as { x: number, y: number }[];

  const getPath = (points: { x: number, y: number }[]) => {
    if (points.length < 2) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-sm">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((level) => {
        const y = height - padding - (level / 100) * chartHeight;
        return (
          <g key={level}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
            <text x="0" y={y + 4} fontSize="9" className="fill-slate-300 font-bold">{level}</text>
          </g>
        );
      })}

      {/* Curves */}
      <path d={getPath(pointsPragmatic)} fill="none" stroke="#67A495" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d={getPath(pointsNarration)} fill="none" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points circles */}
      {pointsPragmatic.map((p, i) => (
        <circle key={`p-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#67A495" strokeWidth="2" />
      ))}
      {pointsNarration.map((p, i) => (
        <circle key={`n-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#A78BFA" strokeWidth="2" />
      ))}

      {/* X Labels */}
      {data.map((d, i) => {
        const x = data.length > 1
          ? padding + (i / (data.length - 1)) * chartWidth
          : padding + chartWidth / 2;
        if (i % 2 !== 0 && data.length > 5) return null; // Reduce labels
        return (
          <text key={i} x={x} y={height - 2} textAnchor="middle" fontSize="9" className="fill-slate-400 font-black uppercase">
            {d.date}
          </text>
        );
      })}
    </svg>
  );
}