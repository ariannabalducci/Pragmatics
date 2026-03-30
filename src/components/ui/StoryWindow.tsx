import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const StoryWindow = ({ interactionData, onAnswer, quizStatus}) => {
    
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

    const activeMessage = parrot_msg;
    
    const hasImages = background_img || character1_img || character2_img || object_img || character1_msg || character2_msg;

    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        if (quizStatus === null) {
            setSelectedIndex(null);
        }
    }, [interactionData, quizStatus]);

    const handleOptionClick = (index, option) => {
        setSelectedIndex(index);
        const isCorrect = index === correct_option; 
        
        if (onAnswer) {
            onAnswer(isCorrect);
        }
    };

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

            {/* -------------------- OPTIONS/QUIZ -------------------- */}
            {options && options.length > 0 && correct_option &&(
                <div className="flex flex-row gap-5 mt-4 justify-content-center">
                    {options.map((option, index) => {
                        const isSelected = selectedIndex === index;
                        const isCorrect = index === correct_option;

                        return (
                            <Button 
                                key={index} 
                                variant="option" 
                                size="content"
                                onClick={() => handleOptionClick(index, option)}
                                disabled={selectedIndex !== null}
                                className={cn(
                                    "justify-center animate-[fade-in_.5s_ease-in-out_forwards]",
                                    isSelected && isCorrect && "bg-[#62B4A5] text-white hover:bg-[#62B4A5]",
                                    isSelected && !isCorrect && "bg-[#E87D57] text-white hover:bg-[#E87D57]"
                                )}
                        
                            >
                                <p>{String.fromCharCode(65 + index)}. {option}</p>
                            </Button>
                        );
                    })}
                </div>
            )}
            
        </div>
    );
};

export default StoryWindow;