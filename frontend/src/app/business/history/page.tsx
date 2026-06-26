'use client';

import React, { useEffect, useState } from 'react';
import { History, Search, Filter, MapPin, Calendar, Loader2, ArrowDownCircle } from 'lucide-react';
import { PaymentHistory } from '@/components/ui/PaymentHistory';
import { formatCurrency } from '@/lib/utils';
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

export default function BusinessHistory() {
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
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
        <p className="text-gray-500">View and manage your past delivery requests.</p>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by address or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          {(['all', 'real', 'test', 'simulated'] as (DataCategory | 'all')[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all capitalize",
                category === cat 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Delivery Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin inline-block text-gray-400" />
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No history found for {category === 'all' ? 'any category' : category}.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 text-sm">#{item.id.slice(0, 8)}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.dropoff_address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DataCategoryBadge category={item.data_category || 'test'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {formatCurrency(item.price, user?.currency_code)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentHistory />
    </div>
  );
}
