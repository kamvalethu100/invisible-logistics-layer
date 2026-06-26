'use client';

import React from 'react';
import { Globe, MapPin, Database, ChevronDown } from 'lucide-react';
import { useAdminFilter, REGIONS, DataCategory } from '@/context/AdminFilterContext';
import { cn } from '@/lib/utils';

export function GlobalFilterBar() {
  const { 
    countryCode, setCountryCode, 
    city, setCity, 
    category, setCategory,
    currentRegion 
  } = useAdminFilter();

  return (
    <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap items-center gap-4 shadow-sm sticky top-0 z-30">
      {/* Country Filter */}
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Country:</span>
        <select 
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-slate-100"
        >
          {REGIONS.map((r) => (
            <option key={r.countryCode} value={r.countryCode}>
              {r.countryName}
            </option>
          ))}
        </select>
      </div>

      {/* City Filter */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
        <MapPin className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Region:</span>
        <select 
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-slate-100"
        >
          <option value="All">All Cities</option>
          {currentRegion.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Environment Filter */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-auto">
        <Database className="w-4 h-4 text-slate-400" />
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['real', 'test', 'simulated'] as DataCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                category === cat 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
