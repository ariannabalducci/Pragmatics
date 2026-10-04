'use client'

import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";
import Image from "next/image";
import { useState, useEffect, Suspense } from 'react';
import ChatInput from "@/components/ui/ChatInput";
import MessageWindow from "@/components/ui/MessageWindow";
import { ChatHistory, Message, MessageRole } from "../../types";
import { ArrowLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
import ChatWindow from "@/components/ui/ChatWindow";
import { useRouter, useSearchParams } from "next/navigation";

const ChatContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const exerciseId = searchParams.get('id');

    const [interactions, setInteractions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentInteractionIndex, setCurrentInteractionIndex] = useState(0);
    const [currentInteraction, setCurrentInteraction] = useState({});

    const [history, setHistory] = useState<ChatHistory>([]);
    
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        const fetchExerciseData = async () => {
            if (!exerciseId) return;

            try {
                const token = localStorage.getItem("token");
                const mode = localStorage.getItem("pragmatics_mode") || "training";
                const res = await fetch(`/api/exercise/${exerciseId}?mode=${mode}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const data = await res.json(); 

                if (!res.ok || data.error) {
                    setError(data.error || "Failed to load exercise");
                    return;
                }
                
                const content = data.content_json || {};
                setInteractions(content.interactions || []);
                
                setStartTime(Date.now());
                
            } catch (err) {
                console.error(err);
                setError("Network error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchExerciseData();
    }, [exerciseId]);

    useEffect(() => {
        if (interactions.length > 0) {
            setCurrentInteraction(interactions[currentInteractionIndex]);
        }
    }, [currentInteractionIndex, interactions]);

    const isChatMode = interactions.length > 0 && currentInteractionIndex === interactions.length - 1;

    const handleFinish = async () => {
        if (!exerciseId || !startTime) return;

        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        const mode = localStorage.getItem("pragmatics_mode") || "training";

        try {
            const token = localStorage.getItem("token");
            
            const res = await fetch(`/api/exercise/${exerciseId}/attempt`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    success: true,
                    duration_seconds: durationSeconds,
                    tries_till_correct: 0,
                    text_attempt: JSON.stringify(history),
                    mode: mode
                })
            });

            if (mode === "testing") {
                router.push("/path");
                return;
            }

            if (res.ok || res.status === 409) {
                router.push('/congratulations');
            } else {
                console.error("Failed to save progress");
            }
        } catch (err) {
            console.error(err);
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

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    exerciseId: exerciseId,
                    message: message,    
                    history: currentHistory 
                }),
            });

            const data = await response.json();

            if (data.error && !data.response) { 
                console.error("AI Error:", data.error);
                return;
            }

            const aiText = data.response || "Squawk! I forgot what to say.";
            
            const aiMessage: Message = {
                role: "model" as MessageRole,
                parts: [{ text: aiText }],
            };

            setHistory((prev: ChatHistory) => [...prev, aiMessage]);

            if (data.is_ended) {
                setTimeout(() => {
                    handleFinish();
                }, 2500);
            }

        } catch (error) {
            console.error("Request Failed:", error);
        }
    };

    const handleNext = () => {
        if (isChatMode) {
            if (history.length > 0) {
                handleFinish();
            }
        } else if (currentInteractionIndex < interactions.length - 1) {
            setCurrentInteractionIndex(prevIndex => prevIndex + 1);
        }
    };

    const handlePrev = () => {
        if (!isChatMode && currentInteractionIndex > 0) {
            setCurrentInteractionIndex(prevIndex => prevIndex - 1);
        }
    };

    if (loading) return <div className="w-screen h-screen flex items-center justify-center bg-white">Loading...</div>;

    if (error) {
        return (
            <main className="w-screen h-screen flex flex-col items-center justify-center bg-white gap-6">
                <p className="text-2xl font-bold text-red-500">{error}</p>
                <a href="/path">
                    <Button>Go Back to Map</Button>
                </a>
            </main>
        );
    }

    const isPrevDisabled = isChatMode || currentInteractionIndex === 0;
    const isNextDisabled = isChatMode ? history.length === 0 : false;

    return (
        <main className="bg-white grid grid-rows-[min-content_1fr] grid-cols-[1fr_2fr] gap-1 w-screen h-screen pb-6 overflow-hidden">
            
            <div className="col-span-2 flex items-center justify-between px-5 pt-5">
                <a href="/path">
                    <Button variant="back" size="icon-sm" title="Back">
                        <ArrowLeft className="size-6" />
                    </Button>
                </a>
                <LogoutButton />
            </div>

            <div className="relative flex flex-col gap-1 row-start-2 col-start-1 items-center">
                <div className="absolute -left-40 top-0 z-10 h-full w-150 pointer-events-none">
                    <Image
                        src="/side-parrot.svg"
                        alt="Talking parrot"
                        fill
                        className="object-contain"
                    />
                </div>

                <div className="absolute bottom-10 flex flex-row gap-8 justify-center z-20">
                    <Button 
                        variant="arrow" 
                        size="icon-lg"
                        onClick={handlePrev} 
                        disabled={isPrevDisabled}
                        title="Previous"
                    >
                        <ChevronsLeft className="size-10" strokeWidth={3} />
                    </Button>

                    <Button 
                        variant="arrow" 
                        size="icon-lg"
                        onClick={handleNext} 
                        disabled={isNextDisabled}
                        title="Next"
                    >
                        <ChevronsRight className="size-10" strokeWidth={3} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col h-full row-start-2 col-start-2 pr-15 pb-4 overflow-hidden">
                
                <div className="shrink-0 mb-4 transition-all duration-500"> 
                    <ChatWindow interactionData={currentInteraction} />
                </div>

                {isChatMode && (
                    <div className="flex-1 flex flex-col min-h-0 animate-[fade-in_0.5s_ease-in-out_forwards]">
                        
                        {/* Scrollable Messages */}
                        <div className="flex-1 min-h-0 relative">
                             <MessageWindow history={history} />
                        </div>

                        {/* INPUT FIELD */}
                        <div className="shrink-0">
                            <ChatInput onSend={handleSend} />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

const ChatPage = () => (
    <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center">Loading...</div>}>
        <ChatContent />
    </Suspense>
);

export default ChatPage;