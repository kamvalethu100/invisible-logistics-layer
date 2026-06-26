'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, Package, Shield, AlertTriangle, Search, Filter, Layers } from 'lucide-react';
import { useAdminFilter } from '@/context/AdminFilterContext';
import { cn } from '@/lib/utils';

export default function GlobalTrackingMap() {
  const { countryCode, currentRegion, city, category } = useAdminFilter();
  const [zoom, setZoom] = useState(12);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'issues'>('all');

  // Simulated active deliveries for the map
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    // Generate simulated deliveries based on region
    const count = countryCode === 'ZA' ? 12 : countryCode === 'NG' ? 25 : 18;
    const items = Array.from({ length: count }).map((_, i) => ({
      id: `DEL-${i + 100}`,
      lat: currentRegion.center[0] + (Math.random() - 0.5) * 0.1,
      lng: currentRegion.center[1] + (Math.random() - 0.5) * 0.1,
      status: Math.random() > 0.8 ? 'issue' : Math.random() > 0.4 ? 'in-transit' : 'pickup',
      driver: `Driver ${Math.random().toString(36).substring(7).toUpperCase()}`,
      business: `Biz ${i + 1}`,
    }));
    setDeliveries(items);
  }, [countryCode, currentRegion]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-4">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live Intelligence Map</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
               {currentRegion.countryName} • {city} • {category}
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'active', label: 'Active Only' },
            { id: 'issues', label: 'Critical Issues' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 bg-slate-200 rounded-3xl relative overflow-hidden border-4 border-white shadow-inner">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-[#e5e7eb] opacity-50 flex items-center justify-center">
             <div className="grid grid-cols-12 grid-rows-12 w-full h-full gap-4 p-8 pointer-events-none">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border border-slate-300/30 rounded-lg"></div>
                ))}
             </div>
          </div>

          {/* Region Label */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-white px-6 py-2 rounded-full shadow-2xl z-10">
             <p className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                {city === 'All' ? currentRegion.countryName : city} Operational View
             </p>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-10">
             <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 font-bold text-slate-900 hover:bg-slate-50">+</button>
             <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 font-bold text-slate-900 hover:bg-slate-50">-</button>
             <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-50">
               <Layers className="w-5 h-5" />
             </button>
          </div>

          {/* Delivery Markers */}
          {deliveries.filter(d => activeTab === 'all' || (activeTab === 'issues' && d.status === 'issue') || (activeTab === 'active' && d.status !== 'issue')).map((d) => (
            <div 
              key={d.id}
              className="absolute group cursor-pointer transition-all hover:scale-110"
              style={{ 
                top: `${50 + (d.lat - currentRegion.center[0]) * 500}%`, 
                left: `${50 + (d.lng - currentRegion.center[1]) * 500}%` 
              }}
            >
               <div className={cn(
                 "w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse",
                 d.status === 'issue' ? "bg-red-500" : d.status === 'pickup' ? "bg-amber-500" : "bg-green-500"
               )}></div>
               
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <p className="text-[10px] font-bold truncate">{d.driver}</p>
                  <p className="text-[8px] text-slate-400">{d.id}</p>
                  <div className="mt-1 pt-1 border-t border-slate-700 flex items-center justify-between">
                     <span className="text-[8px] uppercase font-black">{d.status}</span>
                  </div>
               </div>
            </div>
          ))}

          {/* Pulse Effect for Region Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/5 rounded-full border border-blue-500/10 animate-ping"></div>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-400" />
              Regional Logistics
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {deliveries.slice(0, 8).map(d => (
               <div key={d.id} className="p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-bold text-slate-900">{d.id}</p>
                        <p className="text-[10px] text-slate-400">{d.driver}</p>
                     </div>
                     <span className={cn(
                       "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                       d.status === 'issue' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                     )}>
                        {d.status}
                     </span>
                  </div>
               </div>
             ))}
          </div>

          <div className="p-4 bg-slate-900 m-4 rounded-2xl text-white">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Health</span>
                <Shield className="w-4 h-4 text-green-400" />
             </div>
             <p className="text-2xl font-black">98.4%</p>
             <p className="text-[10px] text-slate-400 mt-1">Real-time matching success in {currentRegion.countryCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
