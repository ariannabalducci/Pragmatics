"use client";

import { useRouter } from "next/navigation";
import { Button } from "./button";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}
