'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { COMPANY_NAME, APP_NAME } from '@/lib/constants';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'business' | 'driver'>('business');
  const [countryCode, setCountryCode] = useState('ZA');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/register', { 
        email, 
        password, 
        name, 
        role,
        country_code: countryCode 
      });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-black text-blue-600 mb-2 inline-block">
            {APP_NAME}
          </Link>
          <p className="text-gray-500 font-medium">Join the Logistics Revolution</p>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
          <h1 className="text-2xl font-bold mb-8 text-gray-900 text-center">Create your account</h1>
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setRole('business')}
                    className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${role === 'business' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    Business
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${role === 'driver' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    Driver
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all font-medium"
                  required
                >
                  <option value="ZA">South Africa</option>
                  <option value="KE">Kenya</option>
                  <option value="NG">Nigeria</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {role === 'business' ? 'Business Name' : 'Full Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'business' ? 'e.g. Acme Corp' : 'e.g. John Doe'}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all"
                required
              />
            </div>

            <Button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100">
              Create Account
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Already have an account? <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">Login</Link>
            </p>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-gray-400 font-medium tracking-wide uppercase">
          Official platform of {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}
