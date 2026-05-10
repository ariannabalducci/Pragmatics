"use client";

import { useState, useEffect, Suspense, DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";

/* ===== DATI DEGLI ESERCIZI ===== */

type ClozeExercise = {
  /* Ogni elemento è una stringa di testo OPPURE un placeholder "[N]" */
  segments: string[];
  /* Numero totale di buchi */
  blankCount: number;
  /* Parole da trascinare (ordine casuale) */
  words: string[];
  /* Mappa: indice buco → parola corretta */
  solutions: Record<number, string>;
};

const EXERCISES: Record<string, ClozeExercise> = {
  dolly: {
    segments: [
      "C'era una volta una ",
      "[1]",
      " di nome Dolly che faceva la ",
      "[2]",
      " in un ristorante di città, ma il suo sogno più grande era quello di diventare una famosa ",
      "[3]",
      ". Ogni giorno andava in edicola ad acquistare il ",
      "[4]",
      " per leggere se c'erano richieste di attrici. Finalmente un ",
      "[5]",
      " lesse che poteva presentarsi in Via Garibaldi per una ",
      "[6]",
      ". Partì il mattino presto e si recò a fare la prova. Il suo stupore fu grande quando scoprì una coda interminabile di aspiranti ",
      "[7]",
      ". Dolly era molto preoccupata e pensò che non ce l'avrebbe mai fatta a spuntarla sulle concorrenti. Venne il suo turno. Le chiesero di recitare ad alta voce le parole: «Porterò le vostre ",
      "[8]",
      " quando saranno pronte». Era proprio la frase più adatta per lei che questa frase era abituata a dirla cento volte al giorno. Si classificò ",
      "[9]",
      " e fu così che, con sua grande gioia, il suo sogno si ",
      "[10]",
      " e diventò un'attrice famosa.",
    ],
    blankCount: 10,
    words: [
      "attrice",
      "ragazza",
      "audizione",
      "giornale",
      "prima",
      "cameriera",
      "avverò",
      "giorno",
      "attrici",
      "patatine fritte",
    ],
    solutions: {
      1: "ragazza",
      2: "cameriera",
      3: "attrice",
      4: "giornale",
      5: "giorno",
      6: "audizione",
      7: "attrici",
      8: "patatine fritte",
      9: "prima",
      10: "avverò",
    },
  },
  pippi: {
    segments: [
      "Una mattina Pippi giunse nel cortile della scuola al galoppo del suo ",
      "[1]",
      ". Scese, spalancò la porta dell'",
      "[2]",
      " ed entrò, sventolando il suo largo ",
      "[3]",
      ". «Salute a tutti! Arrivo in tempo per le moltiplicazioni?». Tom e Anna subito batterono le ",
      "[4]",
      " per la contentezza. «Benvenuta tra noi, Pippi! Intanto dimmi il tuo ",
      "[5]",
      "», disse la maestra. «Mi chiamo Pippi e sono figlia del capitano Calzelunghe.». «Bene! Cominciamo dall'",
      "[6]",
      ". Tu sei brava, vero Pippi Calzelunghe? Allora dimmi, quanto fa 7+5?». Pippi, un po' ",
      "[7]",
      ", guardò la ",
      "[8]",
      " e rispose: «Così, a occhio e croce, fa 67». «Ma no, 7+5 fa 12!», la corresse la maestra. «Ma se lo sapeva», replicò Pippi, «perché me l'ha chiesto?».",
    ],
    blankCount: 8,
    words: [
      "cappello",
      "aritmetica",
      "cavallo",
      "cognome",
      "aula",
      "mani",
      "meravigliata",
      "maestra",
    ],
    solutions: {
      1: "cavallo",
      2: "aula",
      3: "cappello",
      4: "mani",
      5: "cognome",
      6: "aritmetica",
      7: "meravigliata",
      8: "maestra",
    },
  },
};

/* ===== COMPONENTE PRINCIPALE ===== */

function ClozeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get("id") || "dolly";
  const exerciseTitle = searchParams.get("title") || "Esercizio Cloze";

  const data = EXERCISES[exerciseId] || EXERCISES["dolly"];

  // Stato: cosa c'è in ogni buco (indice buco → parola o null)
  const [filledBlanks, setFilledBlanks] = useState<Record<number, string>>({});
  // Stato: risultato verifica (indice buco → true/false) o null se non ancora verificato
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  // Parola attualmente trascinata
  const [dragging, setDragging] = useState<string | null>(null);

  // Parole disponibili nella banca = tutte quelle non piazzate
  const usedWords = Object.values(filledBlanks);
  const availableWords = data.words.filter(
    (w) => !usedWords.includes(w)
  );

  // Reset quando cambia esercizio
  useEffect(() => {
    setFilledBlanks({});
    setResults(null);
  }, [exerciseId]);

  /* --- DRAG HANDLERS --- */

  const handleDragStartFromBank = (word: string) => {
    setDragging(word);
  };

  const handleDragStartFromBlank = (blankIndex: number) => {
    const word = filledBlanks[blankIndex];
    if (word) {
      setDragging(word);
      // Rimuovi dal buco corrente
      setFilledBlanks((prev) => {
        const copy = { ...prev };
        delete copy[blankIndex];
        return copy;
      });
    }
  };

  const handleDropOnBlank = (e: DragEvent, blankIndex: number) => {
    e.preventDefault();
    if (!dragging) return;

    // Se il buco ha già una parola, rimettila nella banca
    setFilledBlanks((prev) => {
      const copy = { ...prev };
      copy[blankIndex] = dragging!;
      return copy;
    });
    setDragging(null);
    setResults(null); // Resetta la verifica se si sposta qualcosa
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  /* --- VERIFICA --- */

  const handleVerify = () => {
    const newResults: Record<number, boolean> = {};
    for (let i = 1; i <= data.blankCount; i++) {
      const placed = filledBlanks[i];
      newResults[i] = placed === data.solutions[i];
    }
    setResults(newResults);

    // Se tutto corretto, salva progresso
    const allCorrect = Object.values(newResults).every((v) => v);
    if (allCorrect) {
      const completedStr = localStorage.getItem("completed_cloze");
      let completed = completedStr ? JSON.parse(completedStr) : [];
      if (!completed.includes(exerciseId)) {
        completed.push(exerciseId);
        localStorage.setItem("completed_cloze", JSON.stringify(completed));
      }
      setTimeout(() => {
        router.push("/congratulations?returnTo=/path-cloze");
      }, 2500);
    }
  };

  /* --- RENDER SEGMENT --- */

  const renderSegments = () => {
    return data.segments.map((seg, idx) => {
      // Controlla se è un placeholder tipo [N]
      const match = seg.match(/^\[(\d+)\]$/);
      if (match) {
        const blankIndex = parseInt(match[1]);
        const word = filledBlanks[blankIndex] || null;
        const result = results ? results[blankIndex] : undefined;

        return (
          <span
            key={idx}
            draggable={!!word}
            onDragStart={() => handleDragStartFromBlank(blankIndex)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnBlank(e, blankIndex)}
            onDragEnd={handleDragEnd}
            className={`
              inline-flex items-center gap-1 mx-1 px-3 py-1 rounded-xl min-w-[100px] min-h-[36px] text-center font-bold
              border-2 border-dashed transition-all cursor-pointer
              ${
                word
                  ? result === true
                    ? "bg-green-100 border-green-400 text-green-800"
                    : result === false
                    ? "bg-red-100 border-red-400 text-red-800"
                    : "bg-purple-50 border-[#8E44AD] text-[#8E44AD]"
                  : "bg-slate-100 border-slate-300 text-slate-400"
              }
              ${!word && dragging ? "ring-2 ring-[#8E44AD] ring-offset-1 bg-purple-50" : ""}
            `}
          >
            {word || `___`}
            {result === true && <Check className="size-4 text-green-600" />}
            {result === false && <X className="size-4 text-red-600" />}
          </span>
        );
      }

      // Testo normale
      return <span key={idx}>{seg}</span>;
    });
  };

  return (
    <main className="bg-[#F5EEF8] flex flex-col w-screen h-screen overflow-hidden">
      {/* TOP BAR */}
      <div className="shrink-0 flex items-center justify-between pt-5 px-6">
        <a href="/path-cloze">
          <Button variant="back" size="icon-sm" title="Back">
            <ArrowLeft className="size-6" />
          </Button>
        </a>
        <div className="flex-1 text-center">
          <h2 className="text-lg md:text-xl font-black text-[#0e2a47] bg-white inline-block px-6 py-2 rounded-3xl shadow-sm border-2 border-purple-200">
            {exerciseTitle}
          </h2>
        </div>
        <LogoutButton />
      </div>

      {/* MAIN CONTENT: testo + banca parole */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-6 min-h-0 overflow-hidden">

        {/* TESTO CON BUCHI */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border-4 border-purple-200 p-6 md:p-8 min-h-0 overflow-y-auto">
          <p className="text-base md:text-lg leading-loose text-[#0e2a47] font-medium">
            {renderSegments()}
          </p>
        </div>

        {/* BANCA PAROLE + BOTTONE */}
        <div className="lg:w-[280px] shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-3xl shadow-xl border-4 border-[#8E44AD] p-4 flex-1 min-h-0 overflow-y-auto">
            <h3 className="font-black text-[#8E44AD] text-center mb-4 text-lg">PAROLE</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableWords.map((word) => (
                <div
                  key={word}
                  draggable
                  onDragStart={() => handleDragStartFromBank(word)}
                  onDragEnd={handleDragEnd}
                  className="bg-[#8E44AD] text-white font-bold px-4 py-2 rounded-xl cursor-grab active:cursor-grabbing shadow-md hover:bg-[#7D3C98] hover:shadow-lg hover:scale-105 transition-all select-none text-sm"
                >
                  {word}
                </div>
              ))}
              {availableWords.length === 0 && (
                <p className="text-slate-400 font-medium text-sm text-center">Tutte le parole sono state piazzate!</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full bg-[#8E44AD] text-white hover:bg-[#7D3C98] font-black text-lg py-6 rounded-2xl shadow-lg"
          >
            HO FINITO ✓
          </Button>

          <Button
            onClick={() => router.push("/path-cloze")}
            className="w-full bg-white text-[#8E44AD] hover:bg-[#F5EEF8] font-black text-base py-4 rounded-2xl shadow-md border-2 border-[#8E44AD]"
          >
            Termina Esercizio
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function ClozePage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-[#F5EEF8]">
          Loading...
        </div>
      }
    >
      <ClozeContent />
    </Suspense>
  );
}
