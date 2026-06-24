'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, Loader2, MapPin, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { DataIntegrityBanner } from '@/components/ui/DataIntegrityBanner';
import { cn, formatCurrency } from '@/lib/utils';

interface EarningItem {
  id: string;
  amount: number;
  date: string;
  destination: string;
  data_category?: DataCategory;
}

export default function DriverEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any>(null);
  const [history, setHistory] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<DataCategory>('real');

  useEffect(() => {
    const fetchEarnings = async (currentCategory: DataCategory) => {
      setLoading(true);
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get(`/api/deliveries/stats?category=${currentCategory}`),
          api.get(`/api/deliveries/history?category=${currentCategory}`)
        ]);
        
        setHistory(historyRes.data.map((item: any) => ({
          id: item.id,
          amount: item.price,
          date: item.updated_at || item.created_at,
          destination: item.dropoff_address,
          data_category: item.data_category
        })));
        
        setEarnings({
          total: statsRes.data.total_earnings || 0,
          today: statsRes.data.total_earnings || 0, // Fallback
          week: statsRes.data.total_earnings || 0,
        });
      } catch (err) {
        console.error('Failed to fetch earnings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings(category);
  }, [category]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <DataIntegrityBanner activeCategory={category} className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-500 text-sm">Track your daily and weekly performance.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {(['real', 'test', 'simulated'] as DataCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize",
                category === cat 
                  ? "bg-green-600 text-white shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Hero Stats */}
      <div className={cn(
        "rounded-3xl p-8 text-white shadow-xl transition-colors relative overflow-hidden",
        category === 'real' ? "bg-green-600 shadow-green-100" : "bg-amber-600 shadow-amber-100"
      )}>
        <p className="text-green-100 text-sm font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
          Total Balance 
          {category === 'real' && <Shield className="w-4 h-4 text-green-200" />}
        </p>
        <div className="flex items-baseline gap-1">
           <span className="text-5xl font-bold">{formatCurrency(earnings?.total || 0, user?.currency_code)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/20">
          <div>
            <p className="text-white/70 text-xs uppercase font-bold">Today</p>
            <p className="text-xl font-bold">{formatCurrency(earnings?.today || 0, user?.currency_code)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs uppercase font-bold">This Week</p>
            <p className="text-xl font-bold">{formatCurrency(earnings?.week || 0, user?.currency_code)}</p>
          </div>
        </div>
        <div className="absolute top-4 right-4">
           <DataCategoryBadge category={category} className="bg-white/20 border-white/30 text-white" />
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Weekly Stats
          </h2>
          <select className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 outline-none font-semibold text-gray-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-32 flex items-end justify-between gap-2">
          {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
            <div key={i} className="flex-1 bg-green-100 rounded-t-lg relative group cursor-pointer hover:bg-green-500 transition-colors" style={{ height: `${h}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatCurrency(h*5, user?.currency_code)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-gray-400 uppercase">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>

      {/* Recent Payouts/Jobs */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4 px-1">Recent Jobs</h2>
        <div className="space-y-3">
          {history.length === 0 ? (
             <p className="text-center py-8 text-gray-500 text-sm bg-white rounded-2xl border border-dashed border-gray-200">No jobs completed yet.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group hover:border-green-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.amount, user?.currency_code)}</p>
                      <DataCategoryBadge category={item.data_category || category} />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center mt-0.5">
                       <MapPin className="w-3 h-3 mr-1" />
                       {item.destination}
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
