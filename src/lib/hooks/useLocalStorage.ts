import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Reads a localStorage value; null on the server and when the key is missing.
export function useLocalStorage(key: string) {
  return useSyncExternalStore(subscribe, () => localStorage.getItem(key), () => null);
}
