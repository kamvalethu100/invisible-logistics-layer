'use client';

import React from 'react';
import { ShieldAlert, Filter, Search, Download } from 'lucide-react';
import { DataCategoryBadge } from '@/components/ui/DataCategoryBadge';

export default function FailureLogs() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Failure Logs</h1>
          <p className="text-gray-500 text-sm">Detailed audit trail of operational incidents.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 flex items-center gap-2">
             <Filter className="w-4 h-4" />
             Filter
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center text-gray-500">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-gray-900">Failure audit trail</p>
          <p className="text-sm mt-1">Detailed logs will appear here as incidents are captured by the matching engine.</p>
          <p className="text-xs text-gray-400 mt-4 italic">Currently monitoring REAL, TEST, and SIMULATED categories.</p>
        </div>
      </div>
    </div>
  );
}
