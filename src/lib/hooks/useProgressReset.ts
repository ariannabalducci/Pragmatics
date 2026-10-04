/**
 * Clears the child's cached progress from localStorage when the therapist
 * has reset it (progressResetAt is newer than the last reset seen locally).
 * Used by every "path-*" page.
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
          PROGRESS_KEYS.forEach((key) => localStorage.removeItem(key));
          localStorage.setItem(LAST_RESET_KEY, String(resetAt));
        }
      } catch (err) {
        console.error("Error checking for a progress reset:", err);
      }
    };

    checkReset();
  }, []);
}
