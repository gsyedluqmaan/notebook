"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type NavbarProps = {
  center?: React.ReactNode;
  right?: React.ReactNode;
};

export default function Navbar({ center, right }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200/80 px-6 py-0 flex items-center h-14 shrink-0">
      {/* LEFT — Brand */}
      <div className="flex items-center gap-2 min-w-0 w-40">
        <div className="w-7 h-7 rounded-lg bg-[#0790e8]/10 border border-[#0790e8]/20 flex items-center justify-center shrink-0">
          <svg
            className="w-3.5 h-3.5 text-[#0790e8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
        <Link
          href="/"
          className="text-sm font-bold text-gray-900 tracking-tight hover:text-[#0790e8] transition-colors duration-150"
        >
          Notebook
        </Link>
      </div>

      {/* CENTER */}
      <div className="flex-1 flex justify-center px-4">
        <div className="text-sm font-semibold text-gray-700 truncate max-w-xs">
          {center}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 min-w-0 w-40 justify-end">
        {right}

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-150"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
