'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DataCategory = 'real' | 'test' | 'simulated';

export interface Region {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  cities: string[];
  center: [number, number]; // [lat, lng]
}

export const REGIONS: Region[] = [
  {
    countryCode: 'ZA',
    countryName: 'South Africa',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    center: [-26.2041, 28.0473], // JHB
  },
  {
    countryCode: 'NG',
    countryName: 'Nigeria',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    cities: ['Lagos', 'Abuja', 'Port Harcourt'],
    center: [6.5244, 3.3792], // Lagos
  },
  {
    countryCode: 'KE',
    countryName: 'Kenya',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    cities: ['Nairobi', 'Mombasa', 'Kisumu'],
    center: [-1.2921, 36.8219], // Nairobi
  },
];

interface AdminFilterContextType {
  countryCode: string;
  city: string;
  category: DataCategory;
  setCountryCode: (code: string) => void;
  setCity: (city: string) => void;
  setCategory: (category: DataCategory) => void;
  currentRegion: Region;
}

const AdminFilterContext = createContext<AdminFilterContextType | undefined>(undefined);

export function AdminFilterProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_country_code') || 'ZA';
    }
    return 'ZA';
  });
  const [city, setCity] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_city') || 'All';
    }
    return 'All';
  });
  const [category, setCategory] = useState<DataCategory>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('admin_category') as DataCategory) || 'real';
    }
    return 'real';
  });

  useEffect(() => {
    localStorage.setItem('admin_country_code', countryCode);
  }, [countryCode]);

  useEffect(() => {
    localStorage.setItem('admin_city', city);
  }, [city]);

  useEffect(() => {
    localStorage.setItem('admin_category', category);
  }, [category]);

  const currentRegion = REGIONS.find((r) => r.countryCode === countryCode) || REGIONS[0];

  // Reset city when country changes, but only if the city doesn't belong to the new country
  useEffect(() => {
    if (city !== 'All' && !currentRegion.cities.includes(city)) {
      setCity('All');
    }
  }, [countryCode, currentRegion, city]);

  return (
    <AdminFilterContext.Provider
      value={{
        countryCode,
        city,
        category,
        setCountryCode,
        setCity,
        setCategory,
        currentRegion,
      }}
    >
      {children}
    </AdminFilterContext.Provider>
  );
}

export function useAdminFilter() {
  const context = useContext(AdminFilterContext);
  if (context === undefined) {
    throw new Error('useAdminFilter must be used within an AdminFilterProvider');
  }
  return context;
}
