'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Truck, 
  MapPin,
  Calendar,
  Loader2,
  ExternalLink,
  Crown,
  Shield
} from 'lucide-react';
import api from '@/lib/api';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAdminFilter } from '@/context/AdminFilterContext';

interface Participant {
  id: string;
  type: 'SME' | 'Driver';
  name: string;
  location: string;
  status: string;
  onboarding_step: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  verification_status?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  is_premium?: boolean;
  fleet_type?: 'INDEPENDENT' | 'FLEET_OWNED';
  category: DataCategory;
  joined_at: string;
  last_activity: string;
}

export default function PilotCohortManagement() {
  const { countryCode, city, category } = useAdminFilter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/cohort`, {
        params: { country: countryCode, city, category }
      });
      setParticipants(res.data);
    } catch (err) {
      console.error('Failed to fetch cohort data, using mock', err);
      const mockParticipants: Participant[] = [
        { 
          id: 'SME-001', type: 'SME', name: 'Ethiopian Restaurant', location: 'Melville', 
          status: 'SIGNED', onboarding_step: 'COMPLETED', category, 
          joined_at: '2025-05-09', last_activity: '2025-05-10T10:00:00Z' 
        },
        { 
          id: 'DRV-001', type: 'Driver', name: 'Driver M001', location: 'Melville', 
          status: 'SIGNED', onboarding_step: 'VERIFIED', verification_status: 'VERIFIED', fleet_type: 'INDEPENDENT',
          category, joined_at: '2025-05-09', last_activity: '2025-05-10T11:00:00Z' 
        },
        { 
          id: 'SME-002', type: 'SME', name: 'Boutique Fashion Retail', location: 'Rosebank', 
          status: 'QUALIFIED', onboarding_step: 'IN_PROGRESS', category, 
          joined_at: '2025-05-11', last_activity: '2025-05-12T09:00:00Z' 
        },
        { 
          id: 'DRV-002', type: 'Driver', name: 'Driver M002', location: 'Rosebank', 
          status: 'QUALIFIED', onboarding_step: 'IN_PROGRESS', verification_status: 'PENDING', fleet_type: 'FLEET_OWNED',
          category, joined_at: '2025-05-12', last_activity: '2025-05-12T08:00:00Z' 
        },
      ];
      setParticipants(mockParticipants);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [countryCode, city, category]);

  const stats = [
    { label: 'Total Enrolled', value: participants.length, icon: Users2, color: 'text-blue-600' },
    { label: 'Verified Ready', value: participants.filter(p => p.onboarding_step === 'VERIFIED').length, icon: UserCheck, color: 'text-green-600' },
    { label: 'Pending Onboarding', value: participants.filter(p => p.onboarding_step !== 'VERIFIED').length, icon: Clock, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-blue-600" />
            Pilot Cohort: {countryCode}
          </h1>
          <p className="text-slate-500">Managing {city === 'All' ? 'all regions' : city} participants.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-50 p-2 rounded-lg">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SME List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
             <CheckCircle2 className="w-4 h-4 text-amber-500" />
             Businesses (SMEs)
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : participants.filter(p => p.type === 'SME').length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">No businesses confirmed yet.</div>
            ) : (
              participants.filter(p => p.type === 'SME').map(sme => (
                <ParticipantCard key={sme.id} participant={sme} />
              ))
            )}
          </div>
        </div>

        {/* Driver List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
             <CheckCircle2 className="w-4 h-4 text-blue-500" />
             Drivers
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : participants.filter(p => p.type === 'Driver').length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">No drivers confirmed yet.</div>
            ) : (
              participants.filter(p => p.type === 'Driver').map(drv => (
                <ParticipantCard key={drv.id} participant={drv} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantCard({ participant }: { participant: Participant }) {
  const steps = [
    { label: 'Discovery', step: 'PENDING' },
    { label: 'Legal/Signed', step: 'IN_PROGRESS' },
    { label: 'App Setup', step: 'COMPLETED' },
    { label: 'Ready', step: 'VERIFIED' },
  ];

  const currentStepIdx = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].indexOf(participant.onboarding_step);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            participant.type === 'SME' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
          )}>
            {participant.type === 'SME' ? <Users2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 flex items-center gap-1">
                {participant.name}
                {participant.is_premium && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              </p>
              {participant.verification_status && (
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-0.5",
                  participant.verification_status === 'VERIFIED' ? "bg-green-100 text-green-700" : 
                  participant.verification_status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                )}>
                  <Shield className="w-2 h-2" />
                  {participant.verification_status}
                </div>
              )}
            </div>
            <div className="flex items-center text-[10px] text-slate-400 font-medium">
              <MapPin className="w-3 h-3 mr-1" />
              {participant.location}
              {participant.fleet_type && (
                <span className="ml-2 px-1 border-l border-slate-200 pl-2 italic">
                  {participant.fleet_type.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
        <DataCategoryBadge category={participant.category as any} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
           <span className="text-slate-400">Onboarding Progress</span>
           <span className={cn(
             participant.onboarding_step === 'VERIFIED' ? "text-green-600" : "text-blue-600"
           )}>
             {participant.onboarding_step.replace('_', ' ')}
           </span>
        </div>
        <div className="flex gap-1.5 h-1.5">
           {steps.map((_, idx) => (
             <div 
              key={idx} 
              className={cn(
                "flex-1 rounded-full",
                idx <= currentStepIdx ? (participant.onboarding_step === 'VERIFIED' ? "bg-green-500" : "bg-blue-500") : "bg-slate-100"
              )} 
             />
           ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
         <div className="flex items-center gap-4">
           <div className="text-[10px] text-slate-400">
             <Calendar className="w-3 h-3 inline mr-1" />
             Joined {new Date(participant.joined_at).toLocaleDateString()}
           </div>
         </div>
         <button className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
           Manage Profile
           <ExternalLink className="w-3 h-3" />
         </button>
      </div>
    </div>
  );
}
