"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  // Assicuriamo che il componente sia montato sul client prima di renderizzare
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Renderizziamo un contenitore vuoto o uno scheletro per evitare il mismatch
    return <main className="min-h-screen bg-white" />;
  }

  return (
    <main className="flex flex-col items-center justify-center overflow-hidden min-h-screen bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <Image
          src="/parrot.gif"
          alt="Parrot Animation"
          width={1000}
          height={1000}
          unoptimized
          priority // Carica subito l'animazione principale
          style={{ height: "auto" }} // Risolve l'errore aspect-ratio
          className="object-contain w-full max-w-[500px]" // Ridotto per una visualizzazione migliore
        />

        <h1 className="text-6xl lg:text-8xl font-bold text-center -translate-y-10 [text-shadow:2px_2px_4px_rgba(0,0,0,0.1)] text-[#62B4A5]">
          Praggymatics
        </h1>

        <div className="mt-8">
          <a href="/path">
            <Button size="lg" className="text-2xl py-8 px-12 rounded-full shadow-xl hover:scale-110 transition-transform bg-[#62B4A5] hover:bg-[#4a8f82]">
              Inizia 🦜
            </Button>
          </a>
        </div>
      </motion.div>
    </main>
  );
}