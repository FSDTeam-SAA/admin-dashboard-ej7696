// @/components/admin/header.tsx
"use client";

import { Avatar } from "@radix-ui/react-avatar";
import { Search } from "lucide-react";
import Image from "next/image";

/**
 * Refined Header with custom linear-gradient background.
 * Matches: linear-gradient(90.17deg, #DDE8FF 0.18%, #FFFFFF 41.93%, #DEE9FF 69.76%, #FFFFFF 100%)
 */
export default function Header() {
  return (
    <header
      style={{
        background:
          "linear-gradient(90.17deg, #DDE8FF 0.18%, #FFFFFF 41.93%, #DEE9FF 69.76%, #FFFFFF 100%)",
      }}
      className="flex items-center justify-between px-8 py-5 w-full border-b border-blue-100/50"
    >
      {/* Search Input Section */}
      <div className="relative w-full max-w-[340px]">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          placeholder="Search users"
          className="w-full pl-11 pr-4 py-2 bg-white/40 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-slate-500"
        />
      </div>

      {/* User Profile Section */}
      <div className="flex items-center gap-4">
        <span className="text-[14px] font-bold text-slate-800">
         Admin
        </span>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <Avatar
            asChild
            className="w-full h-full object-cover"
          >
            <Image
              src="/admin-avatar.jpg"
              alt="Admin Avatar"
              width={40}
              height={40}
            />
          </Avatar>
        </div>
      </div>
    </header>
  );
}
