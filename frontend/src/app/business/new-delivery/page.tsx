'use client';

import React, { useState } from 'react';
import { MapPin, Package, Zap, ChevronRight, Loader2, Shield } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';

export default function NewDelivery() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [packageSize, setPackageSize] = useState<'small' | 'medium' | 'large'>('small');
  const [urgency, setUrgency] = useState<'standard' | 'express'>('standard');
  const [insuranceOptIn, setInsuranceOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  
  const userCategory = (user as any)?.data_category || 'test';

  const calculatePrice = () => {
    const baseFees = { small: 5, medium: 10, large: 20 };
    const distance = 5.2; // Based on mock coordinates
    const ratePerKm = 1.5;
    const urgencyMultiplier = urgency === 'express' ? 1.5 : 1.0;
    const surgeMultiplier = 1.0; 
    
    const price = (baseFees[packageSize] + (distance * ratePerKm)) * surgeMultiplier * urgencyMultiplier;
    return insuranceOptIn ? price + 5 : price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock coordinates for MVP flow
      const mockCoords = {
        pickup_lat: -33.9249,
        pickup_lng: 18.4241,
        dropoff_lat: -33.9587,
        dropoff_lng: 18.4612,
      };

      await api.post('/api/deliveries', {
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        package_size: packageSize,
        urgency,
        ...mockCoords,
      });

      router.push('/business/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request a Delivery</h1>
          <p className="text-gray-500">Enter the details below to get an instant quote.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Creating as</p>
          <DataCategoryBadge category={userCategory} />
        </div>
      </header>

      {userCategory === 'real' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-900">Verified Production Request</p>
            <p className="text-xs text-green-700">This delivery will be visible to real drivers and subject to production audits.</p>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Pickup Location
            </label>
            <input 
              type="text" 
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Store address or name"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-red-600" />
              Drop-off Location
            </label>
            <input 
              type="text" 
              required
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Customer address"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <label className="text-sm font-bold text-gray-700 flex items-center">
              <Package className="w-4 h-4 mr-2 text-gray-600" />
              Package Size
            </label>
            <select 
              value={packageSize}
              onChange={(e) => setPackageSize(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="small">Small (e.g. Letter, small bag)</option>
              <option value="medium">Medium (e.g. Box, multiple bags)</option>
              <option value="large">Large (e.g. Furniture, many boxes)</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <label className="text-sm font-bold text-gray-700 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-amber-500" />
              Urgency Level
            </label>
            <select 
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="standard">Standard (within 2 hours)</option>
              <option value="express">Express (Instant dispatch)</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={insuranceOptIn}
              onChange={(e) => setInsuranceOptIn(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Add Goods Insurance (+{formatCurrency(5, user?.currency_code)})
              </p>
              <p className="text-xs text-gray-500">Protect your package against damage or loss up to {formatCurrency(1000, user?.currency_code)}.</p>
            </div>
          </label>
        </div>

        <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-blue-100 font-medium">Estimated Price</span>
            <div className="text-right">
               <span className="text-2xl font-bold">{formatCurrency(calculatePrice(), user?.currency_code)}</span>
               <p className="text-[10px] text-blue-200 uppercase font-bold tracking-tighter">Normal Pricing Active</p>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-white text-blue-600 rounded-lg font-bold flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <>
                Confirm Delivery Request
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-center mt-3 text-blue-100">
            Every delivery requires manual EFT verification before driver activation.
          </p>
        </div>
      </form>
    </div>
  );
}
