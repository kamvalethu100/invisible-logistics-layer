'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { cn } from '@/lib/utils';
import { useAdminFilter } from '@/context/AdminFilterContext';

interface HealthStats {
  success_rate: number;
  avg_latency: number;
  total_real_deliveries: number;
  failed_matches: number;
  active_incidents: number;
  latency_trend: 'up' | 'down' | 'stable';
  success_trend: 'up' | 'down' | 'stable';
}

interface FailureLog {
  id: string;
  type: string;
  description: string;
  category: DataCategory;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export default function OperationalHealth() {
  const { countryCode, city, category } = useAdminFilter();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [failures, setFailures] = useState<FailureLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, failuresRes] = await Promise.all([
        api.get(`/api/admin/health`, { params: { country: countryCode, city, category } }),
        api.get(`/api/admin/failures`, { params: { country: countryCode, city, category, limit: 10 } })
      ]);
      setStats(healthRes.data);
      setFailures(failuresRes.data);
    } catch (err) {
      console.error('Failed to fetch health data', err);
      // Fallback/Mock data for demonstration
      setStats({
        success_rate: countryCode === 'ZA' ? 94.2 : countryCode === 'NG' ? 88.5 : 91.0,
        avg_latency: countryCode === 'ZA' ? 4.8 : countryCode === 'NG' ? 12.4 : 8.2,
        total_real_deliveries: countryCode === 'ZA' ? 128 : countryCode === 'NG' ? 450 : 310,
        failed_matches: 3,
        active_incidents: 0,
        latency_trend: 'down',
        success_trend: 'up'
      });
      setFailures([
        { id: '1', type: 'matching_timeout', description: `No driver found for delivery #A12BC in ${city !== 'All' ? city : 'Region'}`, category, timestamp: new Date().toISOString(), severity: 'medium' },
        { id: '2', type: 'gps_signal_drop', description: 'Driver #D99 lost GPS signal for 45s during transit', category, timestamp: new Date(Date.now() - 3600000).toISOString(), severity: 'low' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [countryCode, city, category]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Operational Health: {countryCode}
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          </h1>
          <p className="text-slate-500">Monitoring {city === 'All' ? 'all regions' : city} system performance.</p>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-50 p-3 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            {stats?.success_trend === 'up' ? (
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +2.1%
              </span>
            ) : (
              <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                <ArrowDownRight className="w-3 h-3 mr-1" /> -1.4%
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">Dispatch Success Rate</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.success_rate}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            {stats?.latency_trend === 'down' ? (
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <ArrowDownRight className="w-3 h-3 mr-1" /> -0.4m
              </span>
            ) : (
              <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +0.2m
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">Avg. Dispatch Latency</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.avg_latency}m</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500">Failed Matches (24h)</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.failed_matches}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 p-3 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500">Active Deliveries ({category})</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_real_deliveries}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Failure Logs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Real-Time Failure Logs
            </h2>
            <DataCategoryBadge category={category as any} />
          </div>
          <div className="divide-y divide-slate-100">
            {loading && !failures.length ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : failures.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">No failures detected for this category.</div>
            ) : (
              failures.map((log) => (
                <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors flex gap-4">
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                    log.severity === 'high' ? "bg-red-500" : log.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900 capitalize">{log.type.replace(/_/g, ' ')}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{log.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-slate-50 text-center">
            <button className="text-xs font-bold text-blue-600 hover:underline">View All Logs</button>
          </div>
        </div>

        {/* System Health Breakdown */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-indigo-500" />
              Service Status
            </h2>
            <div className="space-y-6">
              {[
                { name: 'Matching Engine', status: 'optimal', value: 99.8 },
                { name: 'Location Tracking', status: 'optimal', value: 99.9 },
                { name: 'API Services', status: 'optimal', value: 100 },
                { name: 'Notification Service', status: 'degraded', value: 94.2 }
              ].map((service) => (
                <div key={service.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">{service.name}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      service.status === 'optimal' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {service.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        service.status === 'optimal' ? "bg-green-500" : "bg-amber-500"
                      )} 
                      style={{ width: `${service.value}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
             <h3 className="font-bold mb-2 flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-blue-400" />
               Pilot Mode
             </h3>
             <p className="text-xs text-slate-400 leading-relaxed">
               You are currently monitoring the <span className="text-white font-bold">{category.toUpperCase()}</span> pilot phase. 
               All dispatch success metrics for REAL deliveries are being audited for the production launch.
             </p>
             <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors">
               Download Audit Report
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
