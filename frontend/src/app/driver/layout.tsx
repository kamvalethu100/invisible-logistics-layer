'use client';

import React from 'react';
import { Home, ClipboardList, TrendingUp, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600 tracking-tight">FlowGrid Driver</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-700">Online</span>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 flex justify-around p-3 fixed bottom-0 left-0 right-0 z-10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center transition-colors",
              pathname === item.href ? "text-green-600 font-semibold" : "text-gray-600"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
