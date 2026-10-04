"use client";

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface InteractionData {
    parrot_msg?: string;
    character1_msg?: string;
    character2_msg?: string;
    background_img?: string;
    character1_img?: string;
    character2_img?: string;
    object_img?: string;
    options?: string[];
    correct_option?: number;
    type?: string;
}

interface StoryWindowProps {
    interactionData: InteractionData;
    onAnswer?: (isCorrect: boolean) => void;
    quizStatus: string | null;
    isTesting?: boolean;
}

const StoryWindow = ({ interactionData, onAnswer, quizStatus, isTesting }: StoryWindowProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [tempSelectedIndex, setTempSelectedIndex] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showWrongFeedback, setShowWrongFeedback] = useState(false);

    const {
        parrot_msg,
        character1_msg,
        character2_msg,
        background_img,
        character1_img,
        character2_img,
        object_img,
        options,
        correct_option
    } = interactionData;

    // 1. Fix Hydration
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Reset the state when the slide changes or the user goes back
    useEffect(() => {
        if (quizStatus === null) {
            setTempSelectedIndex(null);
            setIsSubmitted(false);
            setShowWrongFeedback(false);
        }
    }, [interactionData, quizStatus]);

    const handleConfirm = () => {
        if (tempSelectedIndex !== null && onAnswer) {
            const isCorrect = tempSelectedIndex === correct_option;
            setIsSubmitted(true);
            if (isCorrect) {
                onAnswer(true);
            } else {
                setShowWrongFeedback(true);
                onAnswer(false);
            }
        }
    };

    if (!isMounted) return null;

    const hasImages = background_img || character1_img || character2_img || object_img || character1_msg || character2_msg;

    return (
        <div className="flex flex-col w-full gap-3">

            {/* -------------------- PRAGGY'S SPEECH BUBBLE -------------------- */}
            <div className="flex justify-center w-full mb-2">
                {parrot_msg && (
                    <div className="relative flex items-center justify-center w-full max-w-[650px]">
                        <img
                            src="/exercises/speech-bubble.png"
                            alt="Speech bubble"
                            className="w-full h-auto animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                        <p className="absolute z-10 text-white text-[1.1rem] md:text-lg lg:text-xl font-medium text-center leading-tight w-[85%] pb-[4%] px-2 animate-[fade-in_.5s_ease-in-out_forwards]">
                            {parrot_msg}
                        </p>
                    </div>
                )}
            </div>

            {/* -------------------- STORY IMAGES -------------------- */}
            {hasImages && (
                <div className="relative h-80 overflow-hidden rounded-[40px] bg-gray-100 shadow-inner border-4 border-white">
                    {background_img && (
                        <Image
                            src={background_img}
                            alt="Background"
                            fill
                            priority
                            style={{ objectFit: 'cover' }}
                            className="z-0 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character1_img && (
                        <img
                            src={character1_img}
                            alt="Character 1"
                            style={{ height: '85%', width: 'auto' }} // Fix Aspect Ratio warning
                            className="absolute bottom-0 left-10 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character2_img && (
                        <img
                            src={character2_img}
                            alt="Character 2"
                            style={{ height: '85%', width: 'auto' }} // Fix Aspect Ratio warning
                            className="absolute bottom-0 right-10 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {object_img && (
                        <img
                            src={object_img}
                            alt="Object"
                            style={{ height: '50%', width: 'auto' }} // Fix Aspect Ratio warning
                            className="absolute bottom-5 left-1/2 transform -translate-x-1/2 object-contain z-15 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character1_msg && (
                        <img
                            src={character1_msg}
                            alt="Speech bubble 1"
                            style={{ width: '180px', height: 'auto' }}
                            className="absolute top-10 right-[55%] object-contain z-20 animate-[fade-in_.3s_ease-in-out_forwards]"
                        />
                    )}

                    {character2_msg && (
                        <img
                            src={character2_msg}
                            alt="Speech bubble 2"
                            style={{ width: '180px', height: 'auto' }}
                            className="absolute top-10 left-[55%] object-contain z-20 animate-[fade-in_.3s_ease-in-out_forwards]"
                        />
                    )}
                </div>
            )}

            {/* -------------------- QUIZ / OPTIONS -------------------- */}
            {options && options.length > 0 && typeof correct_option === 'number' && (
                <div className="flex flex-col items-center gap-4 mt-4">
                    <div className="flex flex-row gap-5 justify-center w-full">
                        {options.map((option, index) => {
                            const isSelected = tempSelectedIndex === index;
                            const isCorrect = index === correct_option;

                            return (
                                <Button
                                    key={index}
                                    variant="option"
                                    size="content"
                                    onClick={() => !isSubmitted && setTempSelectedIndex(index)}
                                    disabled={isSubmitted}
                                    className={cn(
                                        "justify-center animate-[fade-in_.5s_ease-in-out_forwards] py-6 px-8 h-auto transition-all",
                                        // Temporary selection (yellow)
                                        isSelected && !isSubmitted && "border-4 border-yellow-400 bg-yellow-50 text-black scale-105",
                                        // Wrong answer: short red flash
                                        isSubmitted && isSelected && showWrongFeedback && "bg-[#E87D57] text-white scale-95",
                                        // Result in testing mode (neutral)
                                        isSubmitted && isSelected && isTesting && !showWrongFeedback && "bg-slate-600 text-white",
                                        // Correct answer in training mode
                                        isSubmitted && isSelected && !isTesting && isCorrect && "bg-[#62B4A5] text-white",
                                        isSubmitted && !isSelected && "opacity-50"
                                    )}
                                >
                                    <span className="text-lg font-bold">
                                        {String.fromCharCode(65 + index)}. {option}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>

                    {/* FEEDBACK / CONFIRM BUTTON */}
                    <div className="h-12 flex items-center justify-center">
                        {isSubmitted && !isTesting && (
                            <p className={cn(
                                "font-bold text-xl animate-[fade-in_.3s_ease-in-out_forwards]",
                                tempSelectedIndex === correct_option ? "text-[#62B4A5]" : "text-[#E87D57]"
                            )}>
                                {tempSelectedIndex === correct_option ? "Great job! 🦜🌟" : "Wrong! 😔"}
                            </p>
                        )}
                        {tempSelectedIndex !== null && !isSubmitted && (
                            <Button
                                onClick={handleConfirm}
                                className={cn(
                                    "text-white font-bold px-10 rounded-full shadow-lg transition-all",
                                    isTesting
                                        ? "bg-slate-500 hover:bg-slate-600"
                                        : "bg-[#62B4A5] hover:bg-[#4a8f82] animate-bounce"
                                )}
                            >
                                {isTesting ? "CONFIRM CHOICE" : "CONFIRM ANSWER 🦜"}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryWindow;