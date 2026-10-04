/**
 * Hook che controlla se il terapista ha richiesto un reset dei progressi.
 * Se il progressResetAt nel DB è più recente dell'ultimo reset salvato localmente,
 * cancella tutte le chiavi di progresso dal localStorage.
 *
 * Usato in tutte le pagine "path-*" del bambino.
 */
"use client";

import { useEffect } from "react";

const PROGRESS_KEYS = [
  "completed_feelings",
  "completed_reactions",
  "completed_why",
  "completed_cloze",
  "testedExercises",
];

const LAST_RESET_KEY = "last_progress_reset";

export function useProgressReset() {
  useEffect(() => {
    const checkReset = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) return;

        const user = JSON.parse(userStr);
        if (!user?.id) return;

        // Usa la route dedicata al bambino
        const res = await fetch(`/api/student/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        const resetAtStr: string | null = data.progressResetAt;
        if (!resetAtStr) return;

        const resetAt = new Date(resetAtStr).getTime();
        const lastReset = parseInt(localStorage.getItem(LAST_RESET_KEY) || "0", 10);

        if (resetAt > lastReset) {
          // Il terapista ha fatto reset → puliamo tutto
          PROGRESS_KEYS.forEach((key) => localStorage.removeItem(key));
          localStorage.setItem(LAST_RESET_KEY, String(resetAt));
          console.log("Progressi resettati dal terapista.");
        }
      } catch (err) {
        console.error("Errore controllo reset progressi:", err);
      }
    };

    checkReset();
  }, []);
}
