'use client';

import React, { useState } from 'react';
import { Crown, Check, Zap, ArrowRight, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { Button } from './Button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

export function PremiumUpgrade() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const amount = user?.country_code === 'KE' ? 3500 : 499;
      const res = await api.post('/api/payments/initiate', {
        amount,
        type: 'PREMIUM_SUBSCRIPTION',
        metadata: { plan: 'Growth' }
      });
      
      // In a real app, redirect to checkout_url
      // For this demo/MVP, we'll open it in a new tab or just simulate success
      window.open(res.data.checkout_url, '_blank');
      
      // Simulate webhook success after a few seconds for testing purposes
      setTimeout(async () => {
          await api.post(`/api/payments/webhook/${res.data.payment_id}`, { success: true });
          alert('Payment simulated successfully! Refreshing status...');
          window.location.reload();
      }, 5000);
      
    } catch (err) {
      console.error('Failed to initiate upgrade', err);
      alert('Failed to initiate upgrade');
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_premium) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Premium Member</span>
          </div>
          <h3 className="text-xl font-bold mb-1">Growth Tier Active</h3>
          <p className="text-indigo-100 text-sm">Enjoying 10% discount and priority matching on all deliveries.</p>
        </div>
        <Crown className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 rotate-12" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Upgrade to Growth Tier</h3>
        </div>
        
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            <span>10% discount on all delivery rates</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Priority driver matching</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Advanced delivery analytics</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Dedicated support line</span>
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 p-6 md:w-64 flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-gray-100">
        <div className="mb-4">
          <span className="text-3xl font-black text-gray-900">
            {formatCurrency(user?.country_code === 'KE' ? 3500 : 499, user?.currency_code || 'ZAR')}
          </span>
          <span className="text-gray-500 text-sm ml-1">/mo</span>
        </div>
        
        <Button 
            onClick={handleUpgrade} 
            disabled={loading}
            className="w-full gap-2 mb-3 bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
          Upgrade Now
        </Button>
        
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
           {user?.country_code === 'KE' ? (
             <>
               <Smartphone className="w-3 h-3" />
               Secure M-Pesa Payment
             </>
           ) : (
             <>
               <CreditCard className="w-3 h-3" />
               Secure Paystack Payment
             </>
           )}
        </div>
      </div>
    </div>
  );
}
