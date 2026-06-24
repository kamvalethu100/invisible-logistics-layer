'use client';

import React from 'react';
import { Home, ClipboardList, TrendingUp, User, LogOut, Shield, Crown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_NAME, COMPANY_NAME } from '@/lib/constants';

const navItems = [
  { icon: Home, label: 'Home', href: '/driver/dashboard' },
  { icon: ClipboardList, label: 'History', href: '/driver/history' },
  { icon: TrendingUp, label: 'Earnings', href: '/driver/earnings' },
];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!user || user.role !== 'driver') return null;

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-5 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <Link href="/" className="text-xl font-black text-blue-600 tracking-tight">
          {APP_NAME} <span className="text-gray-300 font-normal">|</span> <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Driver</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <div className="flex items-center gap-1">
              {user.is_premium && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              <span className="text-xs font-bold text-gray-900">{user.name}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium truncate mb-1">
              {COMPANY_NAME}
            </p>
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-[8px] font-black uppercase px-1 py-0.5 rounded flex items-center gap-0.5 border",
                user.verification_status === 'VERIFIED' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-400 border-gray-200"
              )}>
                <Shield className={cn("w-2 h-2", user.verification_status === 'VERIFIED' ? "text-green-600" : "text-gray-400")} />
                {user.verification_status}
              </span>
            </div>
          </div>
          <div className="flex items-center px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Online</span>
          </div>
          <button onClick={logout} className="text-gray-300 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 flex justify-around p-4 fixed bottom-0 left-0 right-0 z-10 shadow-lg">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center transition-all duration-200",
              pathname === item.href ? "text-blue-600 scale-110" : "text-gray-400"
            )}
          >
            <item.icon className={cn("w-6 h-6", pathname === item.href ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
            <span className={cn("text-[10px] mt-1 uppercase font-black tracking-tighter", pathname === item.href ? "block" : "hidden")}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
