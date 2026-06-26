'use client';

import React, { useEffect, useState } from 'react';
import { 
  Target, 
  Users, 
  Truck, 
  ChevronRight, 
  Filter, 
  Plus, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import api from '@/lib/api';
import { DataCategoryBadge, DataCategory } from '@/components/ui/DataCategoryBadge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { LeadStatusModal } from '@/components/ui/LeadStatusModal';
import { useAdminFilter } from '@/context/AdminFilterContext';

interface Lead {
  id: string;
  type: 'SME' | 'Driver';
  name: string;
  location: string;
  contact_method: string;
  status: 'CONTACTED' | 'INTERESTED' | 'QUALIFIED' | 'SIGNED' | 'PENDING';
  category: DataCategory;
  notes: string;
  updated_at: string;
}

export default function OutreachFunnel() {
  const { countryCode, city, category } = useAdminFilter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/leads`, {
        params: { country: countryCode, city, category }
      });
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads from API, using mock data', err);
      const mockLeads: Lead[] = [
        { id: 'SME-001', type: 'SME', name: 'Ethiopian Restaurant', location: 'Melville, JHB', contact_method: 'WhatsApp', status: 'SIGNED', category, notes: 'Agreement signed 2025-05-10', updated_at: '2025-05-10T10:00:00Z' },
        { id: 'SME-002', type: 'SME', name: 'Boutique Fashion Retail', location: 'Rosebank, JHB', contact_method: 'WhatsApp', status: 'QUALIFIED', category, notes: 'Discovery call completed - strong interest', updated_at: '2025-05-10T14:30:00Z' },
        { id: 'SME-003', type: 'SME', name: 'Bulk Spices Wholesaler', location: 'Faraday Street, JHB', contact_method: 'WhatsApp', status: 'INTERESTED', category, notes: 'Interested in learning more - discovery scheduled', updated_at: '2025-05-10T09:00:00Z' },
        { id: 'SME-004', type: 'SME', name: 'Organic Food Café', location: 'Greenside, JHB', contact_method: 'WhatsApp', status: 'CONTACTED', category, notes: 'Initial message sent', updated_at: '2025-05-08T11:00:00Z' },
        { id: 'DRV-001', type: 'Driver', name: 'Driver M001', location: 'Melville', contact_method: 'WhatsApp', status: 'SIGNED', category, notes: 'Agreement signed 2025-05-10', updated_at: '2025-05-10T11:00:00Z' },
        { id: 'DRV-002', type: 'Driver', name: 'Driver M002', location: 'Rosebank', contact_method: 'WhatsApp', status: 'QUALIFIED', category, notes: 'Interview completed - strong interest', updated_at: '2025-05-10T16:00:00Z' },
        { id: 'DRV-003', type: 'Driver', name: 'Driver M003', location: 'Sandton', contact_method: 'WhatsApp', status: 'CONTACTED', category, notes: 'No response - follow-up Day 3 sent', updated_at: '2025-05-11T10:00:00Z' },
        { id: 'DRV-004', type: 'Driver', name: 'Driver M004', location: 'Randburg', contact_method: 'WhatsApp', status: 'CONTACTED', category, notes: 'No response - follow-up Day 3 sent', updated_at: '2025-05-11T10:30:00Z' },
      ];
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [countryCode, city, category]);

  const funnelSteps = [
    { label: 'Contacted', status: 'CONTACTED', color: 'bg-slate-200' },
    { label: 'Interested', status: 'INTERESTED', color: 'bg-blue-200' },
    { label: 'Qualified', status: 'QUALIFIED', color: 'bg-indigo-200' },
    { label: 'Signed', status: 'SIGNED', color: 'bg-green-200' },
  ];

  const getStepCount = (status: string) => {
    const statusOrder = ['CONTACTED', 'INTERESTED', 'QUALIFIED', 'SIGNED'];
    const currentIndex = statusOrder.indexOf(status);
    return leads.filter(l => {
      const leadIndex = statusOrder.indexOf(l.status);
      return leadIndex >= currentIndex;
    }).length;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Outreach Funnel: {countryCode}
          </h1>
          <p className="text-slate-500">Tracking {city === 'All' ? 'all regions' : city} acquisition performance.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </header>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {funnelSteps.map((step, idx) => {
          const count = getStepCount(step.status);
          const prevCount = idx > 0 ? getStepCount(funnelSteps[idx-1].status) : count;
          const dropoff = idx > 0 ? (prevCount > 0 ? Math.round((count / prevCount) * 100) : 0) : 100;

          return (
            <div key={step.status} className="relative group">
              <div className={cn(
                "p-6 rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:shadow-md",
                "bg-white"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{step.label}</p>
                  {idx > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {dropoff}% conv.
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-slate-900">{count}</p>
                  <p className="text-sm text-slate-400 mb-1 font-medium">leads</p>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                   <div 
                    className={cn("h-full rounded-full transition-all duration-1000", step.color.replace('bg-', 'bg-opacity-100 bg-'))} 
                    style={{ width: `${(count / (getStepCount('CONTACTED') || 1)) * 100}%` }}
                   />
                </div>
              </div>
              {idx < funnelSteps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-slate-100 rounded-full items-center justify-center shadow-sm">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            Lead Management
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
               <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Action</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin inline-block text-slate-300" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No leads found for this category.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          lead.type === 'SME' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {lead.type === 'SME' ? <Users className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                          <p className="text-[10px] text-slate-400">{lead.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DataCategoryBadge category={lead.category} />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         {lead.contact_method === 'WhatsApp' ? (
                           <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                         ) : lead.contact_method === 'Email' ? (
                           <Mail className="w-3.5 h-3.5 text-blue-500" />
                         ) : (
                           <Phone className="w-3.5 h-3.5 text-slate-400" />
                         )}
                         <span className="text-xs text-slate-600 font-medium">{lead.contact_method}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        lead.status === 'SIGNED' ? "bg-green-100 text-green-700" :
                        lead.status === 'QUALIFIED' ? "bg-indigo-100 text-indigo-700" :
                        lead.status === 'INTERESTED' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-xs text-slate-600 truncate font-medium">{lead.notes}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(lead.updated_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsModalOpen(true);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         Update
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadStatusModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onUpdate={fetchLeads}
      />
    </div>
  );
}
