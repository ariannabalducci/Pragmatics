"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CongratulationsContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/path";

  return (
    <main className="flex flex-col items-center justify-center overflow-hidden min-h-screen">
        <Image
            src="/parrot.gif"
            alt="Parrot Animation"
            width={1000}
            height={1000}
            unoptimized
            className="object-contain w-full max-w-[250px] h-auto"
        />
      <h1 className="text-6xl lg:text-8xl font-bold text-center -translate-y-15 [text-shadow:2px_2px_4px_rgba(0,0,0,0.1)]">Good Job!!!</h1>
      <a href={returnTo}><Button>Back to Map</Button></a>
    </main>
  );
}

export default function Congratulations() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <CongratulationsContent />
    </Suspense>
  );
}
