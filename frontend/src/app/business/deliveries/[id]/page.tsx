'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { MapPin, ArrowLeft, Loader2, Truck, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Delivery {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  price: number;
  driver_id: string | null;
}

export default function DeliveryDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const { socket, connected } = useSocket();

  const [initiatingPayment, setInitiatingPayment] = useState(false);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await api.get(`/api/deliveries/${id}`);
        setDelivery(res.data);
      } catch (err) {
        console.error('Failed to fetch delivery', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, [id]);

  const initiatePayment = async () => {
    setInitiatingPayment(true);
    try {
      const res = await api.patch(`/api/deliveries/${id}/initiate-payment`, {
        payment_method: 'EFT'
      });
      setDelivery(res.data);
    } catch (err: any) {
      console.error('Failed to initiate payment', err);
      alert(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setInitiatingPayment(false);
    }
  };

  useEffect(() => {
    if (!socket || !id) return;

    // Join tracking room
    socket.emit('track_delivery', id);

    socket.on('status_update', (update: { deliveryId: string, status: string }) => {
      if (update.deliveryId === id) {
        setDelivery((prev: any) => prev ? { ...prev, status: update.status } : null);
      }
    });

    socket.on('location_update', (location: { lat: number, lng: number }) => {
      console.log('Live location update:', location);
      setDriverLocation(location);
    });

    return () => {
      socket.off('status_update');
      socket.off('location_update');
    };
  }, [socket, id]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!delivery) return <div className="p-8 text-center text-red-500">Delivery not found.</div>;

  const steps = [
    { key: 'PENDING_PAYMENT_VERIFICATION', label: 'Payment Pending', icon: Package },
    { key: 'pending', label: 'Finding Driver', icon: Package },
    { key: 'assigned', label: 'Driver Assigned', icon: Truck },
    { key: 'picked_up', label: 'Picked Up', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === delivery.status) !== -1 
    ? steps.findIndex(s => s.key === delivery.status) 
    : (delivery.status === 'awaiting_payment' ? 0 : 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order #{delivery.id.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500">Real-time tracking and status</p>
        </div>
        <div className="text-right">
           <p className="text-xs font-bold text-gray-400 uppercase">Price</p>
           <p className="text-lg font-bold text-blue-600">{formatCurrency(delivery.price, user?.currency_code)}</p>
        </div>
      </header>

      {delivery.status === 'PENDING_PAYMENT_VERIFICATION' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Payment Required</h2>
          </div>
          <p className="text-sm text-amber-800">
            This delivery is locked until payment is verified. Please click the button below to initiate the EFT process and view settlement details.
          </p>
          
          {(delivery as any).payment_status === 'pending' ? (
            <Button 
              onClick={initiatePayment} 
              disabled={initiatingPayment}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {initiatingPayment ? <Loader2 className="animate-spin mr-2" /> : null}
              Confirm & Pay {formatCurrency(delivery.price, user?.currency_code)}
            </Button>
          ) : (
            <div className="bg-white p-4 rounded-lg border border-amber-100 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">EFT Settlement Details</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Bank:</span>
                <span className="font-bold text-gray-900">Capitec Bank</span>
                <span className="text-gray-500">Account:</span>
                <span className="font-bold text-gray-900">2549975711</span>
                <span className="text-gray-500">Branch:</span>
                <span className="font-bold text-gray-900">470010</span>
                <span className="text-gray-500">Reference:</span>
                <span className="font-bold text-blue-700">FLOWGRID</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 italic">
                  * Please email your Proof of Payment (POP) to <span className="font-bold">kamva100@proton.me</span>. Manual verification takes 5-15 mins.
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <p className="text-xs font-medium text-blue-800">Awaiting Manual Verification...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracking Map Placeholder */}
      <div className="bg-slate-200 aspect-[16/9] rounded-2xl shadow-inner relative overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/18.4241,-33.9249,12/800x450?access_token=mock')] bg-cover opacity-50 grayscale"></div>
        <div className="z-10 text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white">
           <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-bounce" />
           <p className="font-bold text-slate-900">Live Map View</p>
           {driverLocation ? (
             <p className="text-xs text-slate-500 mt-1">Driver is currently in transit</p>
           ) : (
             <p className="text-xs text-slate-500 mt-1">Waiting for signal...</p>
           )}
        </div>
        
        {/* Animated Path Simulation */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/2 left-1/4 w-1/2 h-1 border-b-2 border-dashed border-blue-400 opacity-30"></div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            return (
              <div key={step.key} className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-[10px] mt-2 font-medium ${isCompleted ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</p>
              </div>
            );
          })}
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0 mx-6">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Route</h3>
          <div className="space-y-4">
             <div className="flex items-start">
               <MapPin className="w-4 h-4 text-blue-600 mt-1 mr-3 shrink-0" />
               <div>
                 <p className="text-xs text-gray-400 uppercase">Pickup</p>
                 <p className="text-sm font-medium">{delivery.pickup_address}</p>
               </div>
             </div>
             <div className="flex items-start">
               <MapPin className="w-4 h-4 text-red-600 mt-1 mr-3 shrink-0" />
               <div>
                 <p className="text-xs text-gray-400 uppercase">Drop-off</p>
                 <p className="text-sm font-medium">{delivery.dropoff_address}</p>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Live Status</h3>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-blue-600 capitalize">{delivery.status.replace(/_/g, ' ')}</p>
            {driverLocation && (
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 font-mono">
                Driver Lat: {driverLocation.lat.toFixed(4)}, Lng: {driverLocation.lng.toFixed(4)}
              </div>
            )}
            {!driverLocation && delivery.status !== 'pending' && delivery.status !== 'delivered' && (
              <p className="text-xs text-gray-500 italic">Waiting for driver location update...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
