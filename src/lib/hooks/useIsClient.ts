import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false while rendering on the server, true once hydrated in the browser
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
