'use client';

import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, MapPin, Loader2, Shield, Info, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { DataIntegrityBanner } from '@/components/ui/DataIntegrityBanner';
import { IssueReportModal } from '@/components/ui/IssueReportModal';
import { cn } from '@/lib/utils';

import Link from 'next/link';

interface Delivery {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  price: number;
  data_category?: DataCategory;
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<DataCategory>('real');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (user?.data_category) {
      setCategory(user.data_category as DataCategory);
    }
  }, [user]);

  const fetchData = async (currentCategory: DataCategory) => {
    setLoading(true);
    try {
      const [delRes, statsRes] = await Promise.all([
        api.get(`/api/deliveries?category=${currentCategory}`),
        api.get(`/api/deliveries/stats?category=${currentCategory}`)
      ]);
      setDeliveries(delRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(category);
  }, [category]);

  useEffect(() => {
    if (!socket) return;

    // Listen for any status updates
    socket.on('status_update', (update: { deliveryId: string, status: string }) => {
      console.log('Real-time update:', update);
      setDeliveries((prev) => 
        prev.map((d) => 
          d.id === update.deliveryId ? { ...d, status: update.status } : d
        )
      );
    });

    // Also listen for new job accepted (if we want to refresh everything or just update status)
    // Actually the backend sends status_update for that too.

    return () => {
      socket.off('status_update');
    };
  }, [socket]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <DataIntegrityBanner activeCategory={category} className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6" />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Business Dashboard
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="text-xs font-medium text-gray-400 hover:text-amber-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-amber-50"
              title="Report an Issue"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </h1>
          <p className="text-gray-500">Welcome back! Here's an overview of your deliveries.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {(['real', 'test', 'simulated'] as DataCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize",
                category === cat 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Data Integrity Info Card */}
      {category === 'real' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900">Verified Production Mode</p>
            <p className="text-xs text-blue-700">All data shown below is verified production activity. These metrics are used for official growth and performance reporting.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              Active Deliveries
              <Info className="w-3 h-3 cursor-help text-gray-400" />
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats?.active_deliveries || 0}</p>
          </div>
          {category === 'real' && <div className="absolute top-0 right-0 p-1"><Shield className="w-4 h-4 text-green-500 opacity-20" /></div>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="bg-amber-100 p-3 rounded-lg mr-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.total_requests || 0}</p>
          </div>
          {category === 'real' && <div className="absolute top-0 right-0 p-1"><Shield className="w-4 h-4 text-green-500 opacity-20" /></div>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="bg-green-100 p-3 rounded-lg mr-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">R {(stats?.total_spent || 0).toFixed(2)}</p>
          </div>
          {category === 'real' && <div className="absolute top-0 right-0 p-1"><Shield className="w-4 h-4 text-green-500 opacity-20" /></div>}
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            Active Deliveries
            <DataCategoryBadge category={category} />
          </h2>
          <button onClick={() => fetchData(category)} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No {category} deliveries found.</div>
          ) : (
            deliveries.map((delivery) => (
              <Link 
                key={delivery.id} 
                href={`/business/deliveries/${delivery.id}`}
                className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">Order #{delivery.id.slice(0, 8)}</p>
                      <DataCategoryBadge category={delivery.data_category || category} />
                    </div>
                    <p className="text-sm text-gray-500">To: {delivery.dropoff_address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-gray-900 font-bold mt-1">R {delivery.price.toFixed(2)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      
      <IssueReportModal 
        isOpen={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        category={category} 
        context="Business Dashboard"
      />
    </div>
  );
}
