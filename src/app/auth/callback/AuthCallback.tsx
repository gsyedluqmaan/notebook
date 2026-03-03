"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleCallback = useCallback(async () => {
    try {
      const token = searchParams?.get("token");

      if (token) {
        localStorage.setItem("token", token);

        // Use window.location for reliable redirect
        window.location.href = "/";
        return;
      }
    } catch (error) {
      console.error("Callback error:", error);
    }
  }, [searchParams]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      Logging you in...
    </div>
  );
}
