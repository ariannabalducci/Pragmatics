'use client'

import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";
import Image from "next/image";
import { useState, useEffect, Suspense } from 'react';
import ChatInput from "@/components/ui/ChatInput";
import MessageWindow from "@/components/ui/MessageWindow";
import { ChatHistory, Message, MessageRole } from "../../types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type ExerciseContent = {
  id: string;
  imageId: string;
  questions: string[];
};

const FeelingsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const exerciseId = searchParams.get('exerciseId'); // UUID dal DB
    const groupId = searchParams.get('groupId');
    const exerciseTitle = searchParams.get('title') || "Esercizio Sentimenti";

    const [content, setContent] = useState<ExerciseContent | null>(null);
    const [history, setHistory] = useState<ChatHistory>([]);
    const [loading, setLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState('/parrot.gif');
    const [startTime] = useState(Date.now());

    const [currentStep, setCurrentStep] = useState(1);
    const [userHasAnswered, setUserHasAnswered] = useState(false);

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
                const c = json.content_json as ExerciseContent;
                setContent(c);
                setImageSrc(`/images/feelings/${c.imageId}.png`);
                setHistory([
                    {
                        role: "model" as MessageRole,
                        parts: [{ text: c.questions[0] }],
                    }
                ]);
            } catch (err) {
                console.error("Errore caricamento feelings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [exerciseId]);

    const handleNextStep = () => {
        if (!content) return;
        if (currentStep < content.questions.length) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            setUserHasAnswered(false);
            setHistory(prev => [
                ...prev,
                {
                    role: "model" as MessageRole,
                    parts: [{ text: content.questions[nextStep - 1] }],
                }
            ]);
        }
    };

    const handleFinish = async () => {
        const mode = localStorage.getItem("pragmatics_mode") || "training";
        if (exerciseId) {
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
                        text_attempt: history.map(m => ({ role: m.role, text: m.parts[0]?.text })),
                        mode: mode
                    }),
                });
            } catch (err) {
                console.error("Errore salvataggio attempt:", err);
            }
        }
        if (mode === "testing") {
            router.push('/path-feelings');
        } else {
            router.push('/congratulations?returnTo=/path-feelings');
        }
    };

    const handleSend = async (message: string) => {
        if (!exerciseId || !content) return;

        const newUserMessage: Message = {
            role: "user" as MessageRole,
            parts: [{ text: message }],
        };

        const currentHistory = [...history];
        setHistory([...currentHistory, newUserMessage]);
        setUserHasAnswered(true);

        try {
            const token = localStorage.getItem("token");
            const currentQuestion = content.questions[currentStep - 1];

            const response = await fetch("/api/chat-feelings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    exerciseId: content.id,
                    exerciseTitle: exerciseTitle,
                    currentStep: currentStep,
                    currentQuestion: currentQuestion,
                    message: message,
                    history: currentHistory
                }),
            });

            const data = await response.json();

            if (data.error && !data.response) {
                console.error("AI Error:", data.error);
                return;
            }

            const aiText = data.response || "Squawk! Non ho capito.";
            const aiMessage: Message = {
                role: "model" as MessageRole,
                parts: [{ text: aiText }],
            };
            setHistory((prev: ChatHistory) => [...prev, aiMessage]);

        } catch (error) {
            console.error("Request Failed:", error);
        }
    };

    const totalSteps = content?.questions.length ?? 3;

    if (loading) return <div className="w-screen h-screen flex items-center justify-center bg-[#E74C3C]">Caricamento...</div>;

    return (
        <main className="bg-[#FDEDEC] grid grid-rows-[min-content_min-content_1fr] grid-cols-1 md:grid-cols-[1fr_1fr] gap-2 md:gap-4 w-screen h-screen pb-6 px-6 overflow-hidden">

            {/* TOP BAR */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-between pt-5">
                <a href="/path-feelings">
                    <Button variant="back" size="icon-sm" title="Back">
                        <ArrowLeft className="size-6" />
                    </Button>
                </a>
                <div className="flex-1 text-center">
                    <h2 className="text-xl md:text-2xl font-black text-[#E74C3C] bg-white inline-block px-6 py-2 rounded-3xl shadow-sm border-2 border-red-200">
                        {exerciseTitle}
                    </h2>
                </div>
                <LogoutButton />
            </div>

            {/* HEADER */}
            <div className="col-span-1 md:col-span-2 text-center bg-white/80 backdrop-blur-md border-2 border-[#F5B7B1] rounded-2xl p-2 md:p-3 shadow-sm z-10 mx-auto w-full max-w-3xl">
                <h3 className="font-bold text-[#E74C3C] text-sm md:text-base">
                    Guarda attentamente l'immagine e cerca di capire le reazioni dei personaggi, decidi se la situazione è positiva o negativa.
                </h3>
            </div>

            {/* IMAGE */}
            <div className="flex flex-col items-center justify-center p-2 lg:p-4 h-full">
                <div className="w-full h-full max-h-[600px] bg-white rounded-[3rem] shadow-xl border-4 border-red-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                        <Image
                            src={imageSrc}
                            alt="Illustrazione Esercizio Sentimenti"
                            fill
                            className={`object-contain ${imageSrc === '/parrot.gif' ? 'opacity-50 grayscale scale-50' : 'p-4'}`}
                            onError={() => setImageSrc("/parrot.gif")}
                            unoptimized
                        />
                    </div>
                </div>
            </div>

            {/* CHAT */}
            <div className="flex flex-col min-h-0 py-2 lg:py-4 pr-0 lg:pr-4 overflow-hidden">
                <div className="flex-1 bg-white rounded-[3rem] shadow-xl border-4 border-[#E74C3C] flex flex-col p-4 lg:p-6 min-h-0 overflow-hidden">
                    <div className="shrink-0 mb-4 flex items-center gap-4 border-b-2 border-slate-100 pb-4">
                        <div className="w-14 h-14 bg-[#FDEDEC] rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-inner border-2 border-[#E74C3C]">
                            <Image src="/parrot.gif" width={50} height={50} alt="Praggy" unoptimized />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-xl text-[#0e2a47]">Praggy</h3>
                            <p className="text-sm font-bold text-slate-400">Tutor delle Emozioni - Step {currentStep} di {totalSteps}</p>
                        </div>

                        {userHasAnswered && currentStep < totalSteps && (
                            <Button onClick={handleNextStep} className="bg-[#FFE53B] text-[#8B7D00] hover:bg-[#F2D822] shadow-md border-2 border-[#D4BF32] font-black rounded-2xl shrink-0">
                                Avanti <ArrowRight className="ml-2 size-5" />
                            </Button>
                        )}
                        {userHasAnswered && currentStep === totalSteps && (
                            <Button onClick={handleFinish} className="bg-[#4CAF50] text-white hover:bg-[#45a049] shadow-md border-2 border-[#388E3C] font-black rounded-2xl shrink-0">
                                Termina
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden relative">
                        <MessageWindow history={history} />
                    </div>

                    <div className="shrink-0 pt-4 mt-2">
                        <ChatInput onSend={handleSend} />
                    </div>
                </div>
            </div>

        </main>
    );
};

const FeelingsPage = () => {
    return (
        <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-[#E74C3C]">Caricamento...</div>}>
            <FeelingsContent />
        </Suspense>
    );
};

export default FeelingsPage;
