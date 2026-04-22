"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, UserCog } from "lucide-react";

export default function AuthTherapistPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <main className="min-h-screen bg-[#F0F7F7]" />;

  const handleSelectProfile = (profile: "THERAPIST" | "CHILD") => {
    if (profile === "THERAPIST") {
      router.push("/therapist/login");
    } else {
      router.push("/login");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center overflow-hidden min-h-screen bg-[#F0F7F7] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center w-full max-w-5xl"
      >
        <Image
          src="/parrot.gif"
          alt="Parrot Animation"
          width={360}
          height={360}
          unoptimized
          priority
          style={{ height: "auto" }}
          className="object-contain w-full max-w-[260px] mb-6 drop-shadow-xl"
        />

        <h1 className="text-4xl lg:text-6xl font-black text-center text-[#4a8f82] mb-4">
          Praggymatics
        </h1>

        <p className="text-xl lg:text-2xl font-bold text-slate-500 mb-12 text-center max-w-2xl">
          Scegli il profilo con cui vuoi accedere: studente o logopedista.
        </p>

        <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-stretch">
          <motion.div whileHover={{ scale: 1.03 }} className="flex-1">
            <button
              onClick={() => handleSelectProfile("CHILD")}
              className="w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-transparent hover:border-[#62B4A5] transition-all group"
            >
              <div className="w-20 h-20 bg-[#EFF8F8] rounded-full flex items-center justify-center group-hover:bg-[#62B4A5] transition-colors">
                <Users className="w-10 h-10 text-[#62B4A5] group-hover:text-white" strokeWidth={3} />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-[#62B4A5] mb-2">Accedi come Ragazzo</h2>
                <p className="text-slate-500 font-medium">
                  Vai alla tua avventura, scegli la modalità e inizia gli esercizi.
                </p>
              </div>
            </button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} className="flex-1">
            <button
              onClick={() => handleSelectProfile("THERAPIST")}
              className="w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-transparent hover:border-[#8e6fad] transition-all group"
            >
              <div className="w-20 h-20 bg-[#f4eff8] rounded-full flex items-center justify-center group-hover:bg-[#8e6fad] transition-colors">
                <UserCog className="w-10 h-10 text-[#8e6fad] group-hover:text-white" strokeWidth={3} />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-[#8e6fad] mb-2">Accedi come Logopedista</h2>
                <p className="text-slate-500 font-medium">
                  Gestisci i tuoi pazienti, vedi gli appuntamenti e monitora i progressi.
                </p>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
