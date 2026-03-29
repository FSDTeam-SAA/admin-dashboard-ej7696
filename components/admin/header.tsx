// @/components/admin/header.tsx
"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "react-query";
import { api } from "@/lib/api";

/**
 * Refined Header with custom linear-gradient background.
 * Matches: linear-gradient(90.17deg, #DDE8FF 0.18%, #FFFFFF 41.93%, #DEE9FF 69.76%, #FFFFFF 100%)
 */
export default function Header() {
  const { data: profileData } = useQuery(
    "admin-profile-header",
    api.getProfile,
    {
      staleTime: 1000 * 60 * 5,
    },
  );

  const profile = useMemo(() => {
    const payload = profileData?.data?.data ?? profileData?.data ?? {};
    const user = payload?.user ?? payload;
    const avatarValue =
      user?.avatar?.url ||
      user?.avatar?.secure_url ||
      user?.avatar?.path ||
      user?.avatar ||
      user?.image ||
      "";

    return {
      name: user?.name || "Admin",
      avatar: avatarValue || "/admin-avatar.jpg",
    };
  }, [profileData]);

  return (
    <header
      style={{
        background:
          "linear-gradient(90.17deg, #DDE8FF 0.18%, #FFFFFF 41.93%, #DEE9FF 69.76%, #FFFFFF 100%)",
      }}
      className="flex items-center justify-end px-8 py-5 w-full border-b border-blue-100/50"
    >
      {/* User Profile Section */}
      <div className="flex items-center gap-4">
        <span className="text-[14px] font-bold text-slate-800">
          {profile.name}
        </span>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img
            src={profile.avatar}
            alt="Admin Avatar"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
