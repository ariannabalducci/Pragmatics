"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";
import { motion, AnimatePresence } from "framer-motion";

/*
  Dati degli esercizi.
  correctOption: "A" o "B" indica quale opzione è quella corretta.
  Le immagini vanno in public/images/reazioni/<exerciseId>_situazione.png,
  public/images/reazioni/<exerciseId>_a.png, public/images/reazioni/<exerciseId>_b.png
*/
const EXERCISE_DATA: Record<
  string,
  {
    situazioneDesc: string;
    opzioneADesc: string;
    opzioneBDesc: string;
    correctOption: "A" | "B";
  }
> = {
  caduta: {
    situazioneDesc:
      "Bambino che cade durante un gioco mentre un altro fischia.",
    opzioneADesc: "Bambino che si avvicina e aiuta il compagno caduto.",
    opzioneBDesc: "Bambino che urla contro il compagno a terra.",
    correctOption: "A",
  },
  cucina: {
    situazioneDesc:
      "Bambino che aiuta la mamma a cucinare ma rovescia la farina.",
    opzioneADesc:
      "Mamma che pulisce con faccia triste e manda il bambino in dispensa.",
    opzioneBDesc:
      "Mamma che consola il bambino e puliscono la farina insieme.",
    correctOption: "B",
  },
};

function ReazioniContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get("id") || "caduta";
  const exerciseTitle = searchParams.get("title") || "Esercizio Reazioni";

  const data = EXERCISE_DATA[exerciseId] || EXERCISE_DATA["caduta"];

  const [situazioneSrc, setSituazioneSrc] = useState(
    `/images/reazioni/${exerciseId}_situazione.png`
  );
  const [optionASrc, setOptionASrc] = useState(
    `/images/reazioni/${exerciseId}_a.png`
  );
  const [optionBSrc, setOptionBSrc] = useState(
    `/images/reazioni/${exerciseId}_b.png`
  );

  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    setSituazioneSrc(`/images/reazioni/${exerciseId}_situazione.png`);
    setOptionASrc(`/images/reazioni/${exerciseId}_a.png`);
    setOptionBSrc(`/images/reazioni/${exerciseId}_b.png`);
    setFeedback(null);
  }, [exerciseId]);

  const handleChoice = (choice: "A" | "B") => {
    if (feedback) return; // Già scelto

    if (choice === data.correctOption) {
      setFeedback("correct");
      // Salva completamento
      const completedStr = localStorage.getItem("completed_reazioni");
      let completed = completedStr ? JSON.parse(completedStr) : [];
      if (!completed.includes(exerciseId)) {
        completed.push(exerciseId);
        localStorage.setItem("completed_reazioni", JSON.stringify(completed));
      }
      setTimeout(() => {
        router.push("/congratulations?returnTo=/path-reazioni");
      }, 2000);
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        router.push("/path-reazioni");
      }, 2000);
    }
  };

  return (
    <main className="bg-[#FEF5E7] flex flex-col w-screen h-screen overflow-hidden">
      {/* TOP BAR */}
      <div className="shrink-0 flex items-center justify-between pt-5 px-6">
        <a href="/path-reazioni">
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
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md ${
                feedback === "correct"
                  ? "bg-green-500/30"
                  : "bg-red-500/30"
              }`}
            >
              <div
                className={`text-5xl md:text-7xl font-black ${
                  feedback === "correct" ? "text-green-600" : "text-red-600"
                } bg-white/90 px-12 py-8 rounded-[3rem] shadow-2xl border-4 ${
                  feedback === "correct"
                    ? "border-green-300"
                    : "border-red-300"
                }`}
              >
                {feedback === "correct" ? "GOOD JOB! 🎉" : "SBAGLIATO 😔"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SITUAZIONE IMAGE */}
        <div className="w-full max-w-2xl h-[35vh] bg-white rounded-3xl shadow-xl border-4 border-orange-200 relative overflow-hidden shrink-0">
          <Image
            src={situazioneSrc}
            alt={data.situazioneDesc}
            fill
            className={`object-contain ${
              situazioneSrc === "/parrot.gif"
                ? "opacity-50 grayscale scale-50"
                : "p-3"
            }`}
            onError={() => setSituazioneSrc("/parrot.gif")}
            unoptimized
          />
        </div>

        {/* ISTRUZIONE */}
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
              alt={data.opzioneADesc}
              fill
              className={`object-contain ${
                optionASrc === "/parrot.gif"
                  ? "opacity-50 grayscale scale-50"
                  : "p-3"
              }`}
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
              alt={data.opzioneBDesc}
              fill
              className={`object-contain ${
                optionBSrc === "/parrot.gif"
                  ? "opacity-50 grayscale scale-50"
                  : "p-3"
              }`}
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

export default function ReazioniPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-[#FEF5E7]">
          Loading...
        </div>
      }
    >
      <ReazioniContent />
    </Suspense>
  );
}
