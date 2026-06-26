'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, AlertCircle, Upload, Save, Loader2, FileText, Landmark, XCircle } from 'lucide-react';
import { Button } from './Button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { compressImage, blobToBase64 } from '@/lib/imageCompression';

export function VerificationFlow() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/verification/status');
      setStatus(res.data.status);
      if (res.data.metadata) {
          setFormData(res.data.metadata);
      }
    } catch (err) {
      console.error('Failed to fetch verification status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/verification/submit', formData);
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = e.target.name;
    setLoading(true);
    try {
      // Compress image client-side to save bandwidth
      const compressedBlob = await compressImage(file);
      const base64 = await blobToBase64(compressedBlob);
      
      setFormData({ ...formData, [name]: base64 });
      console.log(`Compressed ${file.name}: ${Math.round(file.size / 1024)}KB -> ${Math.round(compressedBlob.size / 1024)}KB`);
    } catch (err) {
      console.error('Compression failed', err);
      setError('Failed to process image. Please try another.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (status === 'VERIFIED') {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex items-center gap-4">
        <div className="bg-green-100 p-3 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
            Fully Verified
            <Shield className="w-4 h-4" />
          </h3>
          <p className="text-sm text-green-700">Your account has been verified. You now have full access to production features and real marketplace deliveries.</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex items-center gap-4">
        <div className="bg-amber-100 p-3 rounded-full">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-900">Verification Pending</h3>
          <p className="text-sm text-amber-700">We are currently reviewing your documents. This usually takes 24-48 hours. We will notify you once your status is updated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Account Verification
        </h3>
        <p className="text-sm text-gray-500">To enable real deliveries and payments, please complete your {user?.role === 'business' ? 'KYB' : 'KYC'} verification.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.role === 'business' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">CIPC Registration Number</label>
                <input 
                  type="text" name="cipc_registration_number" required
                  value={formData.cipc_registration_number || ''} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 2021/123456/07"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Director ID Number</label>
                <input 
                  type="text" name="director_id_number" required
                  value={formData.director_id_number || ''} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Proof of Business Address</label>
                <div className="relative">
                  <input
                    type="file" name="proof_of_business_address" required accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.proof_of_business_address && <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">VAT Certificate (Optional)</label>
                <div className="relative">
                  <input
                    type="file" name="vat_certificate" accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.vat_certificate && <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">ID Number</label>
                <input 
                  type="text" name="id_number" required
                  value={formData.id_number || ''} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">License Number</label>
                <input 
                  type="text" name="license_number" required
                  value={formData.license_number || ''} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Registration</label>
                <input 
                  type="text" name="vehicle_registration" required
                  value={formData.vehicle_registration || ''} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Proof of Residence</label>
                <div className="relative">
                  <input
                    type="file" name="proof_of_residence" required accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.proof_of_residence && <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Bank Account Header (Optional)</label>
                <div className="relative">
                  <input
                    type="file" name="bank_account_header" accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.bank_account_header && <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Submit for Review
          </Button>
        </div>
      </form>
      
      {status === 'REJECTED' && (
        <div className="p-4 bg-red-50 border-t border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700 font-medium">Your previous submission was rejected. Please review your details and re-submit.</p>
        </div>
      )}
    </div>
  );
}
