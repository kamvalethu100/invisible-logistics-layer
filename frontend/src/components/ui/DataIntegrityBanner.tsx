import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataCategory } from './DataCategoryBadge';

interface DataIntegrityBannerProps {
  activeCategory: DataCategory;
  className?: string;
}

export const DataIntegrityBanner: React.FC<DataIntegrityBannerProps> = ({
  activeCategory,
  className,
}) => {
  if (activeCategory === 'real') {
    return (
      <div className={cn('bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-center gap-2 text-green-800 text-xs font-medium', className)}>
        <ShieldCheck className="w-4 h-4" />
        Viewing Verified Production Environment. All metrics are audit-ready.
      </div>
    );
  }

  return (
    <div className={cn('bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-800 text-xs font-medium', className)}>
      <AlertTriangle className="w-4 h-4" />
      Transparency Notice: You are currently viewing {activeCategory === 'test' ? 'Test' : 'Simulated'} data. These metrics are excluded from production growth reports.
    </div>
  );
};
