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

  if (!session || !session.accessToken || session.error) {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFF]">
      {/* Sidebar - Fixed width of 72 (288px) or 64 (256px) */}
      <Sidebar userName={session.user?.name ?? session.user?.email ?? 'Admin'} />
      
      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300">
        {/* Header sits at the top of the main section */}
        <Header />
        
        {/* Main Content Area */}
        <main className="p-4 md:p-8 pt-2 max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  );
}
