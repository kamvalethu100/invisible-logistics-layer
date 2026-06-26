'use client';

import React from 'react';
import { LayoutDashboard, PlusCircle, History, Settings, LogOut, User, Shield, Crown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_NAME, COMPANY_NAME } from '@/lib/constants';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/business/dashboard' },
  { icon: PlusCircle, label: 'New Delivery', href: '/business/new-delivery' },
  { icon: History, label: 'History', href: '/business/history' },
];

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!user || user.role !== 'business') return null;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100">
        <div className="p-8">
          <Link href="/" className="text-2xl font-black text-blue-600 tracking-tight">
            {APP_NAME}
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-4 rounded-2xl transition-all duration-200",
                pathname === item.href 
                  ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", pathname === item.href ? "text-white" : "text-gray-400")} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-50">
          <div className="flex items-center px-4 py-4 mb-4 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3 text-blue-600 shadow-sm border border-gray-100">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
                {user.name}
                {user.is_premium && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              </p>
              <div className="flex flex-col">
                <p className="text-[10px] text-gray-400 font-medium truncate mb-1">
                  {COMPANY_NAME}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <span className={cn(
                     "text-[8px] font-black uppercase px-1 py-0.5 rounded flex items-center gap-0.5 border",
                     user.verification_status === 'VERIFIED' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-200 text-gray-400 border-gray-200"
                   )}>
                     <Shield className={cn("w-2 h-2", user.verification_status === 'VERIFIED' ? "text-green-600" : "text-gray-400")} />
                     {user.verification_status}
                   </span>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-red-600 font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-black text-blue-600 tracking-tight">
            {APP_NAME}
          </Link>
          <button onClick={logout} className="text-gray-400">
             <LogOut className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around p-3 sticky bottom-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center transition-colors",
                pathname === item.href ? "text-blue-600" : "text-gray-600"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
