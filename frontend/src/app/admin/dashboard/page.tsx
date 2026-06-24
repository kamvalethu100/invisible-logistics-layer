'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Truck, Package, ShieldCheck, Target, Users2, Loader2, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useAdminFilter } from '@/context/AdminFilterContext';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { countryCode, city, category, currentRegion } = useAdminFilter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/stats', {
          params: { country: countryCode, city, category }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
        // Mock data with multi-currency support
        setStats({
          totalBusinesses: countryCode === 'ZA' ? 42 : countryCode === 'NG' ? 120 : 85,
          totalDrivers: countryCode === 'ZA' ? 18 : countryCode === 'NG' ? 45 : 32,
          activeDeliveries: countryCode === 'ZA' ? 15 : countryCode === 'NG' ? 38 : 24,
          totalRevenue: countryCode === 'ZA' ? 45200 : countryCode === 'NG' ? 850000 : 320000,
          verifiedRate: '100%',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [countryCode, city, category]);

  const statCards = [
    { label: 'Total Businesses', value: stats?.totalBusinesses || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Drivers', value: stats?.totalDrivers || 0, icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Deliveries', value: stats?.activeDeliveries || 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { 
      label: 'Regional Revenue', 
      value: formatCurrency(stats?.totalRevenue || 0, currentRegion.currencyCode), 
      icon: Landmark, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500 text-sm italic">
            Displaying data for {currentRegion.countryName} {city !== 'All' ? `(${city})` : ''} — {category.toUpperCase()} environment
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Currency</p>
          <p className="text-sm font-black text-slate-900">{currentRegion.currencyCode} ({currentRegion.currencySymbol})</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center animate-pulse">
              <div className="bg-slate-100 p-3 rounded-lg mr-4 w-12 h-12"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-24"></div>
                <div className="h-6 bg-slate-100 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : (
          statCards.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center group hover:shadow-md transition-all">
              <div className={`${stat.bg} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/health" className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-bold text-gray-900">Operational Health</p>
              <p className="text-sm text-gray-500">Monitor system latency and success rates.</p>
            </Link>
            <Link href="/admin/failures" className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-bold text-gray-900">Failure Logs</p>
              <p className="text-sm text-gray-500">View detailed error reports and matching timeouts.</p>
            </Link>
            <Link href="/admin/funnel" className="block p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-indigo-600" />
                <p className="font-bold text-indigo-900">Outreach Funnel</p>
              </div>
              <p className="text-sm text-indigo-700">Track conversion from contacted to signed.</p>
            </Link>
            <Link href="/admin/cohort" className="block p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Users2 className="w-4 h-4 text-blue-600" />
                <p className="font-bold text-blue-900">Pilot Cohort</p>
              </div>
              <p className="text-sm text-blue-700">Manage technical onboarding of participants.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
