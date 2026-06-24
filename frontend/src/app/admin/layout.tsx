'use client';

import React from 'react';
import { Activity, ShieldAlert, BarChart3, LogOut, User, LayoutDashboard, Target, Users2, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AdminFilterProvider } from '@/context/AdminFilterContext';
import { GlobalFilterBar } from '@/components/ui/GlobalFilterBar';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/context/ToastContext';
import { APP_NAME } from '@/lib/constants';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin/dashboard' },
  { icon: MapIcon, label: 'Live Tracking', href: '/admin/map' },
  { icon: Target, label: 'Outreach Funnel', href: '/admin/funnel' },
  { icon: Users2, label: 'Cohort Management', href: '/admin/cohort' },
  { icon: Activity, label: 'Operational Health', href: '/admin/health' },
  { icon: ShieldAlert, label: 'Failure Logs', href: '/admin/failures' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const { socket, connected } = useSocket();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!socket || !user || user.role !== 'admin') return;

    socket.on('status_update', (update: { deliveryId: string, status: string, data_category?: string }) => {
      if (update.status === 'assigned') {
        toast(
          'Job Accepted', 
          `Driver has accepted delivery #${update.deliveryId.slice(0, 8)} [${(update.data_category || 'REAL').toUpperCase()}]`, 
          'notification'
        );
      }
    });

    return () => {
      socket.off('status_update');
    };
  }, [socket, user, toast]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading Admin Panel...</div>;
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You do not have administrative privileges.</p>
          <Link href="/" className="mt-6 inline-block text-blue-600 font-semibold hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <AdminFilterProvider>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300">
          <div className="p-6">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" />
              <span>{APP_NAME} <span className="text-blue-400 font-black">OPS</span></span>
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-all",
                  pathname === item.href 
                    ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3 text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
            <h1 className="text-lg font-bold tracking-tight">{APP_NAME} Ops</h1>
            <button onClick={logout} className="text-slate-400">
               <LogOut className="w-6 h-6" />
            </button>
          </header>

          <GlobalFilterBar />

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminFilterProvider>
  );
}
