'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, CheckCircle, Clock, XCircle, Loader2, ArrowDownCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/api/payments');
        setPayments(res.data);
      } catch (err) {
        console.error('Failed to fetch payments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getProviderIcon = (provider: string) => {
    return provider === 'MPESA' ? <Smartphone className="w-4 h-4 text-green-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />;
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <ArrowDownCircle className="w-5 h-5 text-gray-400" />
          Payment History
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Provider</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic text-sm">No payment records found.</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {payment.type === 'PREMIUM_SUBSCRIPTION' ? 'Growth Subscription' : 'Wallet Top-up'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(payment.provider)}
                      <span className="text-gray-600">{payment.provider}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(payment.status)}
                      <span className={cn(
                        "font-medium",
                        payment.status === 'COMPLETED' ? "text-green-700" :
                        payment.status === 'PENDING' ? "text-amber-700" : "text-red-700"
                      )}>
                        {payment.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
