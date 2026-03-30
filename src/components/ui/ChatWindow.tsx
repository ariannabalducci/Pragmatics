import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';

const ChatWindow = ({ interactionData}) => {
    
    const { 
        parrot_msg, 
        character1_msg,
        character2_msg,
        background_img, 
        character1_img, 
        character2_img, 
        object_img
    } = interactionData;
    
    const hasImages = background_img || character1_img || character2_img || object_img || character1_msg || character2_msg;

    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        setSelectedIndex(null);
    }, [interactionData]);


    return (
        <div className="flex flex-col w-full gap-3">
            
            {/* -------------------- MESSAGE BOX -------------------- */}
            <div className="relative min-h-40 flex items-center justify-center">
                {parrot_msg && (
                    <Image 
                    src="/exercises/speech-bubble.png" 
                    alt="Speech bubble" 
                    fill 
                    className='animate-[fade-in_.5s_ease-in-out_forwards]'   
                    />
                )}

                {parrot_msg && (
                    <p className="relative z-10 text-white text-xl px-20 pb-4 animate-[fade-in_.5s_ease-in-out_forwards]">
                        {parrot_msg}
                    </p>
                )}
            </div>

            {/* -------------------- IMAGES -------------------- */}
            {hasImages && (
                <div className="relative  h-80 overflow-hidden rounded-4xl bg-gray-100">
                    {background_img && (
                        <Image
                            src={background_img}
                            alt="Background scene"
                            fill
                            className="object-cover z-0 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character1_img && (
                        <img
                            src={character1_img}
                            alt="Character 1"
                            width={270}
                            className="absolute bottom-0 left-10 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character2_img && (
                        <img
                            src={character2_img}
                            alt="Character 2"
                            width={270} 
                            className="absolute bottom-0 right-10 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {object_img && (
                        <img
                            src={object_img}
                            alt="Story object"
                            width={150} 
                            height={300} 
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character1_msg && (
                        <img
                            src={character1_msg}
                            alt="Speech Baloon"
                            width={200} 
                            height={300} 
                            className="absolute top-3 right-4/12 transform -translate-x-1/2 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}

                    {character2_msg && (
                        <img
                            src={character2_msg}
                            alt="Speech Baloon"
                            width={200} 
                            height={300} 
                            className="absolute top-3 left-7/12 transform -translate-x-1/2 object-contain z-10 animate-[fade-in_.5s_ease-in-out_forwards]"
                        />
                    )}
                </div>
            )}            
        </div>
    );
};

export default ChatWindow;