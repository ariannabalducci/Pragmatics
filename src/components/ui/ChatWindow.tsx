"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

// 1. DEFINIAMO L'INTERFACCIA (Risolve l'errore TypeScript)
interface InteractionData {
    parrot_msg?: string;
    character1_msg?: string;
    character2_msg?: string;
    background_img?: string;
    character1_img?: string;
    character2_img?: string;
    object_img?: string;
}

interface ChatWindowProps {
    interactionData: InteractionData;
}

const ChatWindow = ({ interactionData }: ChatWindowProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Se non è ancora montato, non renderizziamo nulla per evitare errori di Hydration
    if (!isMounted) return null;

    // Se interactionData è undefined, evitiamo il crash usando un oggetto vuoto
    const { 
        parrot_msg, 
        character1_msg,
        character2_msg,
        background_img, 
        character1_img, 
        character2_img, 
        object_img
    } = interactionData || {};

    const hasImages = background_img || character1_img || character2_img || object_img || character1_msg || character2_msg;

    return (
        <div className="flex flex-col w-full gap-3">
            
            {/* -------------------- MESSAGE BOX (PRAGGY) -------------------- */}
            <div className="flex justify-center w-full mb-2">
                {parrot_msg && (
                    <div className="relative flex items-center justify-center w-full max-w-[650px]">
                        <img 
                            src="/exercises/speech-bubble.png" 
                            alt="Fumetto" 
                            className="w-full h-auto animate-[fade-in_.5s_ease-in-out_forwards]"   
                        />
                        <p className="absolute z-10 text-white text-[1.1rem] md:text-lg lg:text-xl font-medium text-center leading-tight w-[85%] pb-[4%] px-2 animate-[fade-in_.5s_ease-in-out_forwards]">
                            {parrot_msg}
                        </p>
                    </div>
                )}
            </div>

            {/* -------------------- IMMAGINI DELLA STORIA -------------------- */}
            {hasImages && (
                <div className="relative h-80 overflow-hidden rounded-[40px] bg-gray-100 shadow-inner border-4 border-white">
                    {background_img && (
                        <Image
                            src={background_img}
                            alt="Sfondo"
                            fill
                            priority
                            className="object-cover z-0 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character1_img && (
                        <img
                            src={character1_img}
                            alt="Personaggio 1"
                            style={{ width: '270px', height: 'auto' }}
                            className="absolute bottom-0 left-10 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character2_img && (
                        <img
                            src={character2_img}
                            alt="Personaggio 2"
                            style={{ width: '270px', height: 'auto' }}
                            className="absolute bottom-0 right-10 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {object_img && (
                        <img
                            src={object_img}
                            alt="Oggetto"
                            style={{ width: '150px', height: 'auto' }}
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character1_msg && (
                        <img
                            src={character1_msg}
                            alt="Fumetto 1"
                            style={{ width: '200px', height: 'auto' }}
                            className="absolute top-3 right-[55%] object-contain z-20 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character2_msg && (
                        <img
                            src={character2_msg}
                            alt="Fumetto 2"
                            style={{ width: '200px', height: 'auto' }}
                            className="absolute top-3 left-[55%] object-contain z-20 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}
                </div>
            )}            
        </div>
    );
};

export default ChatWindow;