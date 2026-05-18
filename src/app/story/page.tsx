'use client'

import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import StoryWindow from "@/components/ui/StoryWindow";
import { ArrowLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const StoryPage = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const exerciseId = searchParams.get('id');

    const [interactions, setInteractions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [startTime, setStartTime] = useState<number | null>(null);
    const [mistakes, setMistakes] = useState(0);

    const [currentInteractionIndex, setCurrentInteractionIndex] = useState(0);
    const [currentInteraction, setCurrentInteraction] = useState<any>({});

    const [quizStatus, setQuizStatus] = useState<string | null>(null);

    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        setIsTesting(localStorage.getItem('pragmatics_mode') === 'testing');
    }, []);

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
                    setError(data.error || "Failed to load");
                    return;
                }

                const fetchedInteractions = data.content_json?.interactions || [];
                const quizIndex = fetchedInteractions.findIndex((int: any) => int.options && int.options.length > 0);
                const finalInteractions = quizIndex !== -1 ? fetchedInteractions.slice(0, quizIndex + 1) : fetchedInteractions;

                setInteractions(finalInteractions);
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
            setQuizStatus(null);
        }
    }, [currentInteractionIndex, interactions]);

    const handleAnswer = (isCorrect: boolean) => {
        if (!isCorrect) {
            setMistakes(prev => prev + 1);
        }
        setQuizStatus(isCorrect ? 'correct' : 'incorrect');
    };

    const handleFinish = async () => {
        if (!exerciseId || !startTime) return;

        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        const mode = localStorage.getItem('pragmatics_mode') || 'training';

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`/api/exercise/${exerciseId}/attempt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    success: quizStatus === 'correct',
                    duration_seconds: durationSeconds,
                    tries_till_correct: mistakes,
                    mode: mode
                })
            });

            if (mode === 'testing') {
                router.push('/path');
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

    const isQuizScreen = currentInteraction.options && currentInteraction.options.length > 0;

    const handleNext = () => {
        if (isQuizScreen) {
            if (quizStatus !== null) {
                handleFinish();
                return;
            }
        }

        if (currentInteractionIndex < interactions.length - 1) {
            setCurrentInteractionIndex(prevIndex => prevIndex + 1);
        } else {
            handleFinish();
        }
    };

    const handlePrev = () => {
        if (currentInteractionIndex > 0) {
            setCurrentInteractionIndex(prevIndex => prevIndex - 1);
        }
    };

    const isPrevDisabled = currentInteractionIndex === 0 || (quizStatus !== null);

    // Si sblocca il tasto "avanti" se l'interazione non è un quiz, 
    // o se è un quiz ed è stata data una risposta (qualunque essa sia)
    const isNextDisabled = isQuizScreen ? quizStatus === null : false;


    return (
        <main className="bg-white grid grid-rows-[min-content_1fr] grid-cols-[1fr_2fr] gap-1 w-screen h-screen pb-10 overflow-hidden">
            <div className="col-span-2 flex items-center justify-between px-5 pt-5">
                <a href="/path">
                    <Button variant="back" size="icon-sm" title="Back">
                        <ArrowLeft className="size-6" />
                    </Button>
                </a>
                <LogoutButton />
            </div>

            <div className="relative flex flex-col gap-1 row-start-2 col-start-1 items-center">
                <div className="absolute -left-40 top-0 z-10 h-full w-150 z-0 pointer-events-none">
                    <Image
                        src="/side-parrot.svg"
                        alt="Talking parrot"
                        fill
                        className="object-contain z-0"
                    />
                </div>

                <div className="absolute bottom-10 flex flex-row gap-8 justify-center z-10">
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

            <div className="flex flex-col gap-1 row-start-2 col-start-2 pr-15">
                <StoryWindow
                    interactionData={currentInteraction}
                    quizStatus={quizStatus}
                    onAnswer={handleAnswer}
                    isTesting={isTesting}
                />
            </div>
        </main>
    );
};

export default StoryPage;