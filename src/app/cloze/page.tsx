"use client";

import { useState, useEffect, Suspense, DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";

type ClozeExercise = {
  segments: string[];
  blankCount: number;
  words: string[];
  solutions: Record<number, string>;
};

function ClozeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const exerciseId = searchParams.get("exerciseId");
  const exerciseTitle = searchParams.get("title") || "Cloze exercise";

  const [data, setData] = useState<ClozeExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  const [filledBlanks, setFilledBlanks] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("training");

  useEffect(() => {
    setMode(localStorage.getItem("pragmatics_mode") || "training");
  }, []);

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
        setData(json.content_json as ClozeExercise);
      } catch (err) {
        console.error("Error loading the exercise:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [exerciseId]);

  useEffect(() => {
    setFilledBlanks({});
    setResults(null);
  }, [exerciseId]);

  const availableWords = data
    ? data.words.filter((w) => !Object.values(filledBlanks).includes(w))
    : [];

  const handleDragStartFromBank = (word: string) => setDragging(word);

  const handleDragStartFromBlank = (blankIndex: number) => {
    const word = filledBlanks[blankIndex];
    if (word) {
      setDragging(word);
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
    setFilledBlanks((prev) => ({ ...prev, [blankIndex]: dragging! }));
    setDragging(null);
    setResults(null);
  };

  const handleDragOver = (e: DragEvent) => e.preventDefault();
  const handleDragEnd = () => setDragging(null);

  const saveAttempt = async (allCorrect: boolean, triesTillCorrect: number) => {
    if (!exerciseId) return;
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
          tries_till_correct: triesTillCorrect,
          text_attempt: filledBlanks,
          mode: mode
        }),
      });
    } catch (err) {
      console.error("Error saving the attempt:", err);
    }
  };

  const handleVerify = async () => {
    if (!data) return;
    const newResults: Record<number, boolean> = {};
    let wrongCount = 0;
    for (let i = 1; i <= data.blankCount; i++) {
      const placed = filledBlanks[i];
      newResults[i] = placed === data.solutions[i];
      if (!newResults[i]) wrongCount++;
    }
    
    if (mode === "testing") {
      await saveAttempt(wrongCount === 0, wrongCount);
      router.push("/path-cloze");
      return;
    }

    setResults(newResults);

    const allCorrect = Object.values(newResults).every((v) => v);
    await saveAttempt(allCorrect, wrongCount);
    
    setTimeout(() => {
      router.push("/congratulations?returnTo=/path-cloze");
    }, 2000);
  };

  const renderSegments = () => {
    if (!data) return null;
    return data.segments.map((seg, idx) => {
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
              inline-flex items-center gap-2 mx-3 px-4 py-1.5 rounded-xl min-w-[120px] min-h-[38px] text-center font-bold
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
      return <span key={idx}>{seg}</span>;
    });
  };

  if (loading) return <div className="w-screen h-screen flex items-center justify-center bg-[#F5EEF8]">Loading...</div>;
  if (!data) return <div className="w-screen h-screen flex items-center justify-center bg-[#F5EEF8]">Exercise not found.</div>;

  return (
    <main className="bg-[#F5EEF8] flex flex-col w-screen h-screen overflow-hidden">
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

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-6 min-h-0 overflow-hidden">
        <div className="flex-1 bg-white rounded-3xl shadow-xl border-4 border-purple-200 p-6 md:p-8 min-h-0 overflow-y-auto">
          <p className="text-base md:text-lg leading-loose text-[#0e2a47] font-medium">
            {renderSegments()}
          </p>
        </div>

        <div className="lg:w-[280px] shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-3xl shadow-xl border-4 border-[#8E44AD] p-4 flex-1 min-h-0 overflow-y-auto">
            <h3 className="font-black text-[#8E44AD] text-center mb-4 text-lg">WORDS</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {availableWords.map((word) => (
                <div
                  key={word}
                  draggable
                  onDragStart={() => handleDragStartFromBank(word)}
                  onDragEnd={handleDragEnd}
                  className="bg-[#8E44AD] text-white font-bold px-5 py-2.5 rounded-xl cursor-grab active:cursor-grabbing shadow-md hover:bg-[#7D3C98] hover:shadow-lg hover:scale-105 transition-all select-none text-sm"
                >
                  {word}
                </div>
              ))}
              {availableWords.length === 0 && (
                <p className="text-slate-400 font-medium text-sm text-center">All the words have been placed!</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full bg-[#8E44AD] text-white hover:bg-[#7D3C98] font-black text-lg py-6 rounded-2xl shadow-lg"
          >
            {mode === "testing" ? "CONTINUE" : "I'M DONE ✓"}
          </Button>

          <Button
            onClick={() => router.push("/path-cloze")}
            className="w-full bg-white text-[#8E44AD] hover:bg-[#F5EEF8] font-black text-base py-4 rounded-2xl shadow-md border-2 border-[#8E44AD]"
          >
            Finish Exercise
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function ClozePage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-[#F5EEF8]">Loading...</div>}>
      <ClozeContent />
    </Suspense>
  );
}
