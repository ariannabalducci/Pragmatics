"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && !pathname.startsWith('/therapist')) {
      document.body.classList.add('uppercase');
    } else {
      document.body.classList.remove('uppercase');
    }
  }, [pathname]);

  return <SessionProvider>{children}</SessionProvider>;
}
