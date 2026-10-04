"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";
import { motion, AnimatePresence } from "framer-motion";

type ReactionsData = {
  id: string;
  situationDesc: string;
  optionADesc: string;
  optionBDesc: string;
  correctOption: "A" | "B";
};

function ReactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const exerciseId = searchParams.get("exerciseId"); // UUID dal DB
  const groupId = searchParams.get("groupId");
  const exerciseTitle = searchParams.get("title") || "Esercizio Reazioni";

  const [data, setData] = useState<ReactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  const [situationSrc, setSituationSrc] = useState("/parrot.gif");
  const [optionASrc, setOptionASrc] = useState("/parrot.gif");
  const [optionBSrc, setOptionBSrc] = useState("/parrot.gif");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!exerciseId) { setLoading(false); return; }
      try {
        const token = localStorage.getItem("token");
        const mode = localStorage.getItem("pragmatics_mode") || "training";
        const res = await fetch(`/api/exercise/${exerciseId}?mode=${mode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        const c = json.content_json as ReactionsData;
        setData(c);
        setSituationSrc(`/images/reactions/${c.id}_situation.png`);
        setOptionASrc(`/images/reactions/${c.id}_a.png`);
        setOptionBSrc(`/images/reactions/${c.id}_b.png`);
        setFeedback(null);
      } catch (err) {
        console.error("Errore caricamento reactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [exerciseId]);

  const handleChoice = async (choice: "A" | "B") => {
    if (!data || feedback) return;

    const mode = localStorage.getItem("pragmatics_mode") || "training";
    const isCorrect = choice === data.correctOption;

    if (mode === "testing") {
      // Nessun feedback in testing: salvataggio immediato e ritorno alla mappa
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/exercise/${exerciseId}/attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duration_seconds: Math.round((Date.now() - startTime) / 1000),
            tries_till_correct: isCorrect ? 0 : 1,
            text_attempt: { chosen: choice, correct: data.correctOption },
            mode: mode
          }),
        });
      } catch (err) {
        console.error("Errore salvataggio attempt:", err);
      }
      router.push("/path-reactions");
      return;
    }

    if (isCorrect) {
      // Salva attempt nel DB
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/exercise/${exerciseId}/attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duration_seconds: Math.round((Date.now() - startTime) / 1000),
            tries_till_correct: 0,
            text_attempt: { chosen: choice, correct: data.correctOption },
            mode: mode
          }),
        });
      } catch (err) {
        console.error("Errore salvataggio attempt:", err);
      }
      router.push("/congratulations?returnTo=/path-reactions");
    } else {
      setFeedback("wrong");
      // Salva comunque il completamento nel DB in modo da riempire la stella
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/exercise/${exerciseId}/attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duration_seconds: Math.round((Date.now() - startTime) / 1000),
            tries_till_correct: 1,
            text_attempt: { chosen: choice, correct: data.correctOption },
            mode: mode
          }),
        });
      } catch (err) {
        console.error("Errore salvataggio attempt:", err);
      }
      setTimeout(() => {
        router.push("/congratulations?returnTo=/path-reactions");
      }, 1500);
    }
  };

  if (loading) return <div className="w-screen h-screen flex items-center justify-center bg-[#FEF5E7]">Caricamento...</div>;
  if (!data) return <div className="w-screen h-screen flex items-center justify-center bg-[#FEF5E7]">Esercizio non trovato.</div>;

  return (
    <main className="bg-[#FEF5E7] flex flex-col w-screen h-screen overflow-hidden">
      {/* TOP BAR */}
      <div className="shrink-0 flex items-center justify-between pt-5 px-6">
        <a href="/path-reactions">
          <Button variant="back" size="icon-sm" title="Back">
            <ArrowLeft className="size-6" />
          </Button>
        </a>
        <div className="flex-1 text-center">
          <h2 className="text-xl md:text-2xl font-black text-[#0e2a47] bg-white inline-block px-6 py-2 rounded-3xl shadow-sm border-2 border-orange-200">
            {exerciseTitle}
          </h2>
        </div>
        <LogoutButton />
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-6 p-4 md:p-6 min-h-0 overflow-auto relative">

        {/* FEEDBACK OVERLAY */}
        <AnimatePresence>
          {feedback === "wrong" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#FEF5E7]"
            >
              <div
                className="text-5xl md:text-7xl font-black text-red-600 bg-white px-12 py-8 rounded-[3rem] shadow-2xl border-4 border-red-300 animate-bounce"
              >
                SBAGLIATO 😔
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SITUAZIONE */}
        <div className="w-full max-w-2xl h-[35vh] bg-white rounded-3xl shadow-xl border-4 border-orange-200 relative overflow-hidden shrink-0">
          <Image
            src={situationSrc}
            alt={data.situationDesc}
            fill
            className={`object-contain ${situationSrc === "/parrot.gif" ? "opacity-50 grayscale scale-50" : "p-3"}`}
            onError={() => setSituationSrc("/parrot.gif")}
            unoptimized
          />
        </div>

        <h3 className="text-lg md:text-2xl font-black text-[#0e2a47] text-center shrink-0">
          QUALE DELLE DUE REAZIONI È CORRETTA?
        </h3>

        {/* OPZIONI */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl shrink-0">
          {/* Opzione A */}
          <button
            onClick={() => handleChoice("A")}
            disabled={feedback !== null}
            className={`flex-1 bg-white rounded-3xl shadow-lg border-4 relative overflow-hidden h-[28vh] transition-all duration-200 group
              ${
                feedback === null
                  ? "border-orange-200 hover:border-[#F39C12] hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                  : feedback === "correct" && data.correctOption === "A"
                  ? "border-green-400 ring-4 ring-green-200"
                  : feedback === "wrong" && data.correctOption !== "A"
                  ? "border-red-400 ring-4 ring-red-200"
                  : "border-orange-200 opacity-50"
              }`}
          >
            <Image
              src={optionASrc}
              alt={data.optionADesc}
              fill
              className={`object-contain ${optionASrc === "/parrot.gif" ? "opacity-50 grayscale scale-50" : "p-3"}`}
              onError={() => setOptionASrc("/parrot.gif")}
              unoptimized
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#F39C12] text-white font-black text-lg px-6 py-2 rounded-full shadow-md group-hover:bg-[#E67E22] transition-colors z-10">
              A
            </div>
          </button>

          {/* Opzione B */}
          <button
            onClick={() => handleChoice("B")}
            disabled={feedback !== null}
            className={`flex-1 bg-white rounded-3xl shadow-lg border-4 relative overflow-hidden h-[28vh] transition-all duration-200 group
              ${
                feedback === null
                  ? "border-orange-200 hover:border-[#F39C12] hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                  : feedback === "correct" && data.correctOption === "B"
                  ? "border-green-400 ring-4 ring-green-200"
                  : feedback === "wrong" && data.correctOption !== "B"
                  ? "border-red-400 ring-4 ring-red-200"
                  : "border-orange-200 opacity-50"
              }`}
          >
            <Image
              src={optionBSrc}
              alt={data.optionBDesc}
              fill
              className={`object-contain ${optionBSrc === "/parrot.gif" ? "opacity-50 grayscale scale-50" : "p-3"}`}
              onError={() => setOptionBSrc("/parrot.gif")}
              unoptimized
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#F39C12] text-white font-black text-lg px-6 py-2 rounded-full shadow-md group-hover:bg-[#E67E22] transition-colors z-10">
              B
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ReactionsPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-[#FEF5E7]">Caricamento...</div>}>
      <ReactionsContent />
    </Suspense>
  );
}
