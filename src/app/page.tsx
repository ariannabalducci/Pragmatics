"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center  overflow-hidden min-h-screen">
      
        
            <Image
                src="/parrot.gif"
                alt="Parrot Animation"
                width={1000}   // Set this to how big you roughly want it (e.g., 600px)
                height={1000}
                unoptimized
                className="object-contain w-full max-w-250 h-auto"
            />
       
   
      <h1 className="text-6xl lg:text-8xl font-bold text-center -translate-y-15  [text-shadow:2px_2px_4px_rgba(0,0,0,0.1)]">Praggymatics</h1>
      <a href="/path"><Button>Start</Button></a>
    </main>
  );
}
