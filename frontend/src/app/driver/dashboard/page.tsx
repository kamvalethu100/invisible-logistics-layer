'use client';

import React, { useEffect, useState } from 'react';
import { Navigation, DollarSign, List, Bell, Loader2, Shield, AlertCircle, CheckCircle2, User, MapPin, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { VerificationFlow } from '@/components/ui/VerificationFlow';
import { formatCurrency } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { DataIntegrityBanner } from '@/components/ui/DataIntegrityBanner';
import { IssueReportModal } from '@/components/ui/IssueReportModal';
import { cn } from '@/lib/utils';

interface JobOffer {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  price: number;
  data_category?: DataCategory;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { toast } = useToast();
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<DataCategory>('real');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [showPodScreen, setShowPodScreen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [signalStrength, setSignalStrength] = useState<'strong' | 'weak' | 'none'>('strong');

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
      const active = delRes.data.find((d: any) => d.status !== 'pending' && d.status !== 'delivered' && d.status !== 'cancelled');
      if (active) setActiveJob(active);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch driver data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(category);
  }, [category]);

  useEffect(() => {
    if (!socket) return;

    socket.on('job_offer', (job: JobOffer) => {
      console.log('New job offer received', job);
      setOffer(job);
    });

    socket.on('status_update', (update: any) => {
      console.log('Status update received', update);
      if (update.status === 'delivered') {
        setActiveJob(null);
      } else {
        setActiveJob((prev: any) => prev ? { ...prev, status: update.status } : null);
      }
    });

    // Adaptive Location Updates Interval
    const intervalTime = activeJob ? 5000 : 30000; // 5s when on a trip, 30s when idle
    
    const locationInterval = setInterval(() => {
      if (socket && connected) {
        // Mock Signal Strength Fluctuation
        const rand = Math.random();
        if (rand > 0.95) setSignalStrength('none');
        else if (rand > 0.8) setSignalStrength('weak');
        else setSignalStrength('strong');

        // In a real app, we would use navigator.geolocation.getCurrentPosition
        const mockLat = -33.9249 + (Math.random() - 0.5) * 0.01;
        const mockLng = 18.4241 + (Math.random() - 0.5) * 0.01;
        socket.emit('update_location', { lat: mockLat, lng: mockLng });
        console.log(`Sent location update (${activeJob ? 'ACTIVE' : 'IDLE'}):`, { mockLat, mockLng });
      } else {
        setSignalStrength('none');
      }
    }, intervalTime);

    return () => {
      socket.off('job_offer');
      socket.off('status_update');
      clearInterval(locationInterval);
    };
  }, [socket, activeJob]);

  const acceptJob = async () => {
    if (!offer) return;
    
    // Optimistic Update
    const currentOffer = offer;
    setActiveJob(offer);
    setOffer(null);
    
    try {
      await api.patch(`/api/deliveries/${currentOffer.id}/accept`);
      toast('Job Accepted', 'You have successfully accepted the job.', 'success');
    } catch (err) {
      console.error('Failed to accept job', err);
      toast('Accept Failed', 'Job might have been taken by another driver.', 'error');
      // Rollback
      setActiveJob(null);
      setOffer(currentOffer);
    }
  };

  const updateStatus = async (status: string, metadata?: any) => {
    if (!activeJob) return;
    
    // Optimistic Update
    const prevJob = { ...activeJob };
    setActiveJob((prev: any) => ({ ...prev, status }));
    
    if (status === 'delivered') {
      setShowPodScreen(false);
      setRecipientName('');
    }

    try {
      await api.patch(`/api/deliveries/${activeJob.id}/status`, { status, metadata });
      if (status === 'delivered') {
        toast('Success!', 'Package delivered successfully.', 'success');
        setActiveJob(null);
        // Refresh stats
        fetchData(category);
      } else if (status === 'picked_up') {
        toast('Picked Up', 'Delivery is now in transit.', 'info');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      toast('Update Failed', 'Failed to update status. Please try again.', 'error');
      // Rollback
      setActiveJob(prevJob);
      if (status === 'delivered') {
        setShowPodScreen(true);
      }
    }
  };

  return (
    <div className="space-y-6">
      <DataIntegrityBanner activeCategory={category} className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 text-slate-900">
            Driver Dashboard
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full border border-slate-200">
              {signalStrength === 'strong' ? (
                <Wifi className="w-3.5 h-3.5 text-green-600" />
              ) : signalStrength === 'weak' ? (
                <Wifi className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tight",
                signalStrength === 'strong' ? "text-green-700" :
                signalStrength === 'weak' ? "text-amber-700" : "text-red-700"
              )}>
                GPS {signalStrength}
              </span>
            </div>
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="text-xs font-medium text-gray-400 hover:text-amber-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-amber-50"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </h1>
          <p className="text-gray-500 text-sm">You are currently online.</p>
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

      {/* Stats */}
      <div className={cn(
        "rounded-2xl p-6 text-white shadow-lg transition-colors",
        category === 'real' ? "bg-green-600 shadow-green-200" : "bg-amber-600 shadow-amber-200"
      )}>
        <div className="flex justify-between items-center mb-4">
          <p className="text-green-100 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            Earnings Today 
            {category === 'real' && <Shield className="w-4 h-4 text-green-200" />}
          </p>
          <DollarSign className="w-6 h-6 text-green-200" />
        </div>
        <p className="text-4xl font-bold">{formatCurrency(stats?.total_earnings || 0, user?.currency_code)}</p>
        <div className="mt-4 flex gap-4 text-sm text-green-100">
          <p><span className="font-bold">{stats?.completed_jobs || 0}</span> Jobs completed</p>
          <DataCategoryBadge category={category} className="bg-white/20 border-white/30 text-white" />
        </div>
      </div>

      <VerificationFlow />

      {/* Active Job */}
      {activeJob && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-500 overflow-hidden">
          <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
            <h2 className="font-semibold text-green-800 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Active Job
            </h2>
            <span className="text-xs font-bold text-green-600 uppercase bg-white px-2 py-0.5 rounded-full border border-green-200">
              {activeJob.status.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="p-6">
            {!showPodScreen ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                       <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pickup From</p>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{activeJob.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Deliver To</p>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{activeJob.dropoff_address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeJob.status === 'assigned' && (
                    <Button onClick={() => updateStatus('picked_up')} disabled={loading} className="flex-1 h-12 text-lg">
                      Mark as Picked Up
                    </Button>
                  )}
                  {activeJob.status === 'picked_up' && (
                    <Button onClick={() => setShowPodScreen(true)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-lg">
                      Finish Delivery
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2 text-center">
                   <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                   <h3 className="font-bold text-blue-900">Proof of Delivery</h3>
                   <p className="text-xs text-blue-700">Confirm you've reached {activeJob.dropoff_address}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name</label>
                  <input 
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Enter name of person who received package"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPodScreen(false)} className="flex-1">Back</Button>
                  <Button 
                    onClick={() => updateStatus('delivered', { recipient_name: recipientName })} 
                    disabled={loading || !recipientName.trim()} 
                    className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Delivery'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Job Offer */}
      {offer && !activeJob && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-500 overflow-hidden animate-bounce-slow">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
            <h2 className="font-semibold text-blue-800 flex items-center">
              <span className="animate-pulse mr-2 h-2 w-2 rounded-full bg-blue-600"></span>
              New Job Offer
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">Pickup</p>
                <p className="text-sm font-medium">{offer.pickup_address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">Drop-off</p>
                <p className="text-sm font-medium">{offer.dropoff_address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={acceptJob} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : `Accept Job (${formatCurrency(offer.price, user?.currency_code)})`}
              </Button>
              <Button onClick={() => setOffer(null)} variant="outline" className="px-6">Decline</Button>
            </div>
          </div>
        </div>
      )}

      {!offer && !activeJob && (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
          Waiting for job offers...
        </div>
      )}

      <IssueReportModal 
        isOpen={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        category={category} 
        context="Driver Dashboard"
      />
    </div>
  );
}
