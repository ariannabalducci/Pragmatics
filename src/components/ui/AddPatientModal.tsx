"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPatientModal({ isOpen, onClose, onSuccess }: AddPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "", // La logopedista sceglie lo username (es: marcored)
    password: "", // La logopedista sceglie la password
    age: "",
    gender: "MALE",
    description: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/therapist/student", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          skin_color: "#FFDBAC",
          hair_style: "SHORT",
          hair_color: "#4B2C20",
          clothes: "TSHIRT",
          eye: "OPEN",
          mouth: "SMILE",
          ethnicity: "CAUCASIAN"
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ name: "", surname: "", username: "", password: "", age: "", gender: "MALE", description: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Errore durante la creazione");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-black">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        <h3 className="text-2xl font-bold text-[#0e2a47] mb-6">Crea Account Bambino</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-black ml-1">Nome</label>
              <input 
                placeholder="Nome del bambino" required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black placeholder:text-slate-400 font-medium"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-black ml-1">Cognome</label>
              <input 
                placeholder="Cognome del bambino" required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black placeholder:text-slate-400 font-medium"
                value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-black ml-1">Scegli Nome Utente</label>
            <input 
              placeholder="Username per il login del bambino" required
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black placeholder:text-slate-400 font-medium"
              value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-black ml-1">Scegli Password</label>
            <input 
              type="text" placeholder="Password per il bambino" required
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black placeholder:text-slate-400 font-medium"
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <p className="text-[10px] text-slate-400 ml-1 italic">* Comunica queste credenziali ai genitori per l'accesso.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-black ml-1">Età</label>
              <input 
                type="number" placeholder="Età" required
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black placeholder:text-slate-400 font-medium"
                value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-black ml-1">Genere</label>
              <select 
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black font-medium"
                value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="MALE">Maschio</option>
                <option value="FEMALE">Femmina</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-black ml-1">Diagnosi / Note Cliniche</label>
            <textarea 
              placeholder="Inserisci la diagnosi o note specifiche..." 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4d8b7d]/20 text-black placeholder:text-slate-400 min-h-[80px] font-medium"
              value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-[#4d8b7d] text-white py-4 rounded-2xl font-bold text-lg hover:brightness-105 transition shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? "Salvataggio..." : "Crea Profilo e Account"}
          </button>
        </form>
      </div>
    </div>
  );
}