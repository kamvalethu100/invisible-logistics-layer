'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COMPANY_NAME, APP_NAME } from '@/lib/constants';
import { getCookie } from 'cookies-next';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentCity, setCurrentCity] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'business') {
        router.push('/business/dashboard');
      } else {
        router.push('/driver/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check for regional subdomain/cookie
    const region = getCookie('logistiqs-region');
    if (region === 'jhb') {
      setCurrentCity('Johannesburg');
    } else if (region === 'nairobi') {
      setCurrentCity('Nairobi');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm flex flex-col text-center">
        <div className="mb-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            Premium Logistics Orchestration
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-gray-900 tracking-tight">
          {APP_NAME}
        </h1>
        <p className="text-2xl text-gray-500 mb-4 max-w-2xl font-medium">
          The Invisible Logistics Layer for SMEs.
        </p>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl">
          Powered by <span className="font-semibold text-gray-600">{COMPANY_NAME}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <div className="group bg-white p-10 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 flex flex-col h-full hover:border-blue-200 transition-all duration-300">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">For Businesses</h2>
          <p className="text-gray-500 mb-8 flex-grow text-lg leading-relaxed">
            Request deliveries in <span className="text-blue-600 font-bold">under 30 seconds</span>. 
            Connect with verified drivers in <span className="text-blue-600 font-bold">7 minutes</span>.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/auth/login"
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-center hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Enterprise Login
            </Link>
            <Link 
              href="/auth/register"
              className="w-full py-4 border-2 border-gray-100 text-gray-900 rounded-2xl font-bold text-center hover:bg-gray-50 transition-all"
            >
              Register Business
            </Link>
          </div>
        </div>

        <div className="group bg-white p-10 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 flex flex-col h-full hover:border-blue-200 transition-all duration-300">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">For Drivers</h2>
          <p className="text-gray-500 mb-8 flex-grow text-lg leading-relaxed">
            Join the elite LogistiQS network. Get matched with high-priority business deliveries instantly.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/auth/login"
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Driver Portal
            </Link>
            <Link 
              href="/auth/register"
              className="w-full py-4 border-2 border-gray-100 text-gray-900 rounded-2xl font-bold text-center hover:bg-gray-50 transition-all"
            >
              Apply to Drive
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl text-center">
        <div>
          <div className="text-4xl font-black text-gray-900 mb-2">7 min</div>
          <p className="text-gray-500 font-medium">Avg. Driver Match Time</p>
        </div>
        <div>
          <div className="text-4xl font-black text-gray-900 mb-2">40 min</div>
          <p className="text-gray-500 font-medium">Avg. Delivery Completion</p>
        </div>
        <div>
          <div className="text-4xl font-black text-gray-900 mb-2">100%</div>
          <p className="text-gray-500 font-medium">Verified Professional Drivers</p>
        </div>
      </div>

      {/* Corporate Identity Section */}
      <section className="mt-32 w-full max-w-5xl border-t border-gray-100 pt-16 mb-16">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Enterprise Infrastructure</h3>
          <p className="text-2xl font-bold text-gray-900 mb-6">{COMPANY_NAME}</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-gray-400 text-sm font-medium">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Registered in South Africa
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Full Compliance Framework
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Professional Indemnity
             </div>
          </div>
        </div>
      </section>
    </main>
  );
}
