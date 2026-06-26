'use client';

import React from 'react';
import { LayoutDashboard, PlusCircle, History, Settings, LogOut, User, Shield, Crown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">FlowGrid Biz</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-md transition-colors",
                pathname === item.href 
                  ? "bg-blue-50 text-blue-600 font-semibold" 
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
                {user.name}
                {user.is_premium && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              </p>
              <div className="flex flex-col">
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <span className={cn(
                     "text-[8px] font-black uppercase px-1 py-0.5 rounded flex items-center gap-0.5 border",
                     user.verification_status === 'VERIFIED' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-400 border-gray-200"
                   )}>
                     <Shield className={cn("w-2 h-2", user.verification_status === 'VERIFIED' ? "text-green-600" : "text-gray-400")} />
                     {user.verification_status}
                   </span>
                   {user.is_premium && (
                     <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                       PREMIUM
                     </span>
                   )}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600 tracking-tight">FlowGrid Biz</h1>
          <button onClick={logout} className="text-gray-600">
             <LogOut className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
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
