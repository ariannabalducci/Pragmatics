'use client'

import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";
import Image from "next/image";
import { useState, useEffect, Suspense } from 'react';
import ChatInput from "@/components/ui/ChatInput";
import MessageWindow from "@/components/ui/MessageWindow";
import { ChatHistory, Message, MessageRole } from "../../types";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type ExerciseContent = {
  id: string;
  questionTitle: string;
  imageId: string;
};

const PercheContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const exerciseId = searchParams.get('exerciseId'); // UUID dal DB
    const groupId = searchParams.get('groupId');
    const questionTitle = searchParams.get('title') || "Domanda Causale";

    const [content, setContent] = useState<ExerciseContent | null>(null);
    const [history, setHistory] = useState<ChatHistory>([]);
    const [loading, setLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState('/parrot.gif');
    const [startTime] = useState(Date.now());

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
                setImageSrc(`/images/perche/${c.imageId}.png`);
            } catch (err) {
                console.error("Errore caricamento perche:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [exerciseId]);

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
            router.push('/path-perche');
        } else {
            router.push('/congratulations?returnTo=/path-perche');
        }
    };

    const handleSend = async (message: string) => {
        if (!exerciseId) return;

        const newUserMessage: Message = {
            role: "user" as MessageRole,
            parts: [{ text: message }],
        };

        const currentHistory = [...history];
        setHistory([...currentHistory, newUserMessage]);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch("/api/chat-perche", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    questionTitle: questionTitle,
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

    if (loading) return <div className="w-screen h-screen flex items-center justify-center bg-[#2C82C9]">Caricamento...</div>;

    return (
        <main className="bg-[#E5F2FC] grid grid-rows-[min-content_1fr] grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 w-screen h-screen pb-6 px-6 overflow-hidden">

            {/* TOP BAR */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-between pt-5">
                <a href="/path-perche">
                    <Button variant="back" size="icon-sm" title="Back">
                        <ArrowLeft className="size-6" />
                    </Button>
                </a>
                <div className="flex-1 flex items-center justify-center gap-4">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-[#2C82C9] bg-white inline-block px-6 py-2 rounded-3xl shadow-sm border-2 border-blue-200 text-center">
                        {questionTitle}
                    </h2>
                    <Button onClick={handleFinish} className="bg-[#FFE53B] text-[#8B7D00] hover:bg-[#F2D822] shadow-md border-2 border-[#D4BF32] font-black rounded-2xl px-6 py-6 text-lg shrink-0">
                        Termina Esercizio
                    </Button>
                </div>
                <LogoutButton />
            </div>

            {/* IMAGE */}
            <div className="flex flex-col items-center justify-center p-4 lg:p-8 min-h-0">
                <div className="w-full h-full max-h-[600px] bg-white rounded-[3rem] shadow-xl border-4 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                        <Image
                            src={imageSrc}
                            alt="Illustrazione Esercizio"
                            fill
                            className={`object-contain ${imageSrc === '/parrot.gif' ? 'opacity-50 grayscale scale-50' : 'p-4'}`}
                            onError={() => setImageSrc("/parrot.gif")}
                            unoptimized
                        />
                    </div>
                </div>
            </div>

            {/* CHAT */}
            <div className="flex flex-col min-h-0 py-4 lg:py-8 pr-0 lg:pr-4 overflow-hidden">
                <div className="flex-1 bg-white rounded-[3rem] shadow-xl border-4 border-[#62B4A5] flex flex-col p-4 lg:p-6 min-h-0 overflow-hidden relative">
                    <div className="shrink-0 mb-4 flex items-center gap-4 border-b-2 border-slate-100 pb-4">
                        <div className="w-14 h-14 bg-[#EFF8F8] rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-inner border-2 border-[#62B4A5]">
                            <Image src="/parrot.gif" width={50} height={50} alt="Praggy" unoptimized />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-[#0e2a47]">Praggy</h3>
                            <p className="text-sm font-bold text-slate-400">Tutor di Logica</p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 relative">
                        {history.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-60">
                                <span className="text-5xl mb-4">🦜</span>
                                <p className="font-bold text-slate-500 max-w-[200px]">Cosa ne pensi? Scrivi qui la tua risposta!</p>
                            </div>
                        ) : (
                            <MessageWindow history={history} />
                        )}
                    </div>

                    <div className="shrink-0 pt-4 mt-2">
                        <ChatInput onSend={handleSend} />
                    </div>
                </div>
            </div>

        </main>
    );
};

const PerchePage = () => {
    return (
        <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-[#2C82C9]">Caricamento...</div>}>
            <PercheContent />
        </Suspense>
    );
};

export default PerchePage;
