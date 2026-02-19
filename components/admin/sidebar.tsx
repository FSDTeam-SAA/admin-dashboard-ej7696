'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutGrid,
  BookOpen,
  Users,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  Headset,
  CreditCard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Image from 'next/image';

const menuItems = [
  { icon: LayoutGrid, label: 'Dashboard Overview', href: '/admin' },
  { icon: BookOpen, label: 'Exam Content', href: '/admin/exams' },
  { icon: Users, label: 'User Management', href: '/admin/users' },
  { icon: TrendingUp, label: 'Revenue', href: '/admin/revenue' },
  { icon: Star, label: 'Review', href: '/admin/review' }, // ✅ updated
  { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions' }, // ✅ updated
  { icon: Bell, label: 'Announcement', href: '/admin/announcements' },
  { icon: Headset, label: 'Support', href: '/admin/support' }, // ✅ updated
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function Sidebar({ userName = 'Admin' }: { userName?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, #E5EEFF 20.91%, #EDF3FF 41.83%, #DEE9FF 69.71%, #FFFFFF 100%)',
        }}
        className={`fixed left-0 top-0 h-screen w-72 border-r border-blue-100 text-slate-700 flex flex-col transition-all duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="pt-10 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="mb-2"
            priority
          />
          <p className="text-sm font-semibold text-slate-600">{userName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-2 mt-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#254391] text-white shadow-lg shadow-blue-900/20'
                    : 'hover:bg-blue-50 text-slate-600'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#254391]'
                  }`}
                />
                <span className={`font-semibold text-[15px] ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-6 border-t border-blue-100/50">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-4 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center border border-blue-50">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Sign Out</h3>
            <p className="text-slate-500 mt-2">
              Are you sure you want to log out of the admin dashboard?
            </p>

            <div className="flex gap-3 mt-8">
              <Button
                variant="ghost"
                className="flex-1 hover:bg-slate-100 text-slate-600 font-semibold"
                onClick={() => setShowLogoutModal(false)}
              >
                No, Cancel
              </Button>

              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
                onClick={handleLogout}
              >
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
