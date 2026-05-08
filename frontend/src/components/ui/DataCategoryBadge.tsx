import React from 'react';
import { cn } from '@/lib/utils';

export type DataCategory = 'real' | 'test' | 'simulated';

interface DataCategoryBadgeProps {
  category: DataCategory;
  className?: string;
}

const categoryConfig = {
  real: {
    label: 'Verified Production',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  test: {
    label: 'Test Data',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  simulated: {
    label: 'Simulated',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export const DataCategoryBadge: React.FC<DataCategoryBadgeProps> = ({ category, className }) => {
  const config = categoryConfig[category] || categoryConfig.test;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
