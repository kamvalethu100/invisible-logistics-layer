'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { MapPin, ArrowLeft, Loader2, Truck, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Delivery {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  price: number;
  driver_id: string | null;
  payment_status: 'pending' | 'initiated' | 'completed';
}

export default function DeliveryDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const { socket, connected } = useSocket();

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

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  const handleProceedToPay = async () => {
    setProcessingPayment(true);
    try {
      await api.patch(`/api/deliveries/${id}/initiate-payment`);
      await fetchDelivery(); // Refresh to see updated status and banking details
    } catch (err) {
      console.error('Failed to initiate payment', err);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setProcessingPayment(false);
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
    { key: 'pending', label: 'Requested', icon: Package },
    { key: 'assigned', label: 'Driver Assigned', icon: Truck },
    { key: 'picked_up', label: 'Picked Up', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === delivery.status) !== -1 
    ? steps.findIndex(s => s.key === delivery.status) 
    : 0;

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
           <p className="text-xs font-bold text-gray-400 uppercase">Total Value</p>
           <p className="text-lg font-bold text-blue-600">{formatCurrency(delivery.price, user?.currency_code)}</p>
        </div>
      </header>

      {/* SETTLEMENT GATE */}
      {delivery.status === 'pending' && delivery.payment_status === 'pending' && (
        <div className="bg-blue-600 p-8 rounded-2xl shadow-xl text-white">
          <h2 className="text-2xl font-bold mb-4">Payment Summary</h2>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b border-blue-500 pb-2">
              <span>Load Value</span>
              <span>{formatCurrency(delivery.price * 0.8, user?.currency_code)}</span>
            </div>
            <div className="flex justify-between border-b border-blue-500 pb-2">
              <span>LogistiQS Fee (Platform)</span>
              <span>{formatCurrency(delivery.price * 0.2, user?.currency_code)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl">
              <span>Total Payable</span>
              <span>{formatCurrency(delivery.price, user?.currency_code)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full py-6 text-lg font-bold bg-white text-blue-600 hover:bg-gray-100"
            onClick={handleProceedToPay}
            disabled={processingPayment}
          >
            {processingPayment ? <Loader2 className="animate-spin mr-2" /> : null}
            PROCEED TO PAY
          </Button>
          <p className="text-center text-xs text-blue-100 mt-4">
            Clicking "Proceed to Pay" will authorize the load and reveal settlement banking details.
          </p>
        </div>
      )}

      {delivery.status === 'pending' && delivery.payment_status === 'initiated' && (
        <div className="bg-emerald-50 p-8 rounded-2xl border-2 border-emerald-500 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mr-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900">Payment Initiated</h2>
              <p className="text-sm text-emerald-700">Please complete the EFT to activate driver matching.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-emerald-200 space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">Official LOGISTIQS Banking Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-gray-500">Bank:</span>
              <span className="font-medium">Capitec Bank SA</span>
              
              <span className="text-gray-500">Account Number:</span>
              <span className="font-medium">2549975711</span>
              
              <span className="text-gray-500">Branch Code:</span>
              <span className="font-medium">470010</span>
              
              <span className="text-gray-500">Branch Name:</span>
              <span className="font-medium">CAPITEC BANK</span>
              
              <span className="text-gray-500">SWIFT Code:</span>
              <span className="font-medium">CABLZAJJ</span>
              
              <span className="text-gray-500 font-bold text-emerald-600">EFT Reference:</span>
              <span className="font-bold text-emerald-600 underline">LOGISTIQS-{delivery.id.slice(0,8).toUpperCase()}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-emerald-100 rounded-lg text-xs text-emerald-800 leading-relaxed">
            <strong>Important Rules:</strong> No load is confirmed until EFT payment is initiated and verified. Your delivery is currently in the "Pending Payment" phase. Driver assignment will begin automatically once settlement is tracked using the <strong>LOGISTIQS</strong> reference.
          </div>
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
