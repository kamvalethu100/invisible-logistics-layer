'use client';

import React, { useEffect, useState } from 'react';
import { History, Search, Filter, MapPin, Calendar, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { cn } from '@/lib/utils';

interface Delivery {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  price: number;
  created_at: string;
  data_category?: DataCategory;
}

export default function DriverHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<DataCategory | 'all'>('all');

  useEffect(() => {
    if (user?.data_category) {
      setCategory(user.data_category as DataCategory);
    }
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const url = category === 'all' ? '/api/deliveries/history' : `/api/deliveries/history?category=${category}`;
        const res = await api.get(url);
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [category]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job History</h1>
          <p className="text-gray-500">Review your completed and cancelled jobs.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {(['all', 'real', 'test', 'simulated'] as (DataCategory | 'all')[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all capitalize",
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

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No job history found for {category === 'all' ? 'any category' : category}.</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">Job #{item.id.slice(0, 8)}</p>
                      <DataCategoryBadge category={item.data_category || 'test'} />
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">R {item.price.toFixed(2)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'delivered' ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Delivered</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Cancelled</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 mr-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{item.pickup_address}</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <p className="text-sm text-gray-900 font-medium truncate">{item.dropoff_address}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
