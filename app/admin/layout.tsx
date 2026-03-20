// @/app/admin/layout.tsx
import React from "react";
import { auth } from '@/auth';
import { Sidebar } from '@/components/admin/sidebar';
import { redirect } from 'next/navigation';
import Header from "@/components/admin/header";

export const metadata = {
  title: "Admin Dashboard - Inspector's Path",
  description: 'Manage your exam platform',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || !session.accessToken) {
    redirect('/auth/login');
  }

  return (
    // h-screen and overflow-hidden prevent the whole page from scrolling
    <div className="admin-dashboard-theme flex h-screen bg-[#F8FAFF] overflow-hidden">
      
      {/* Sidebar - Remains fixed on the left */}
      <Sidebar userName={session.user?.name ?? session.user?.email ?? 'Admin'} />
      
      {/* Content Wrapper - This container handles the layout for the right side */}
      <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 min-w-0">
        
        {/* Header - Stays at the top because the parent is flex-col and not scrolling */}
        <Header />
        
        {/* Main Content Area - This is the ONLY part that scrolls */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-2">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
