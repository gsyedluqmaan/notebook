"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide navbar on auth pages AND whiteboard
  const hideNavbar =
    pathname.startsWith("/auth") || pathname.startsWith("/whiteboard");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}
