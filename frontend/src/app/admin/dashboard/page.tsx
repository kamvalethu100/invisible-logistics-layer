'use client';

import React from 'react';
import { LayoutDashboard, Users, Truck, Package, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 text-sm">System-wide metrics and management.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Businesses', value: '42', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Drivers', value: '18', icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Deliveries', value: '15', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Verified Production', value: '100%', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`${stat.bg} p-3 rounded-lg mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/admin/health" className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-bold text-gray-900">Operational Health</p>
              <p className="text-sm text-gray-500">Monitor system latency and success rates.</p>
            </Link>
            <Link href="/admin/failures" className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-bold text-gray-900">Failure Logs</p>
              <p className="text-sm text-gray-500">View detailed error reports and matching timeouts.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
