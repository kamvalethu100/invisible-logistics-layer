import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode: string = 'ZAR') {
  // Map country/currency to common locales
  const localeMap: Record<string, string> = {
    'ZAR': 'en-ZA',
    'NGN': 'en-NG',
    'KES': 'en-KE',
  };

  return new Intl.NumberFormat(localeMap[currencyCode] || 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}
