'use client';

import React, { useState, useEffect } from 'react';
import { X, Gift, Shield, Rocket, ChevronRight, Check } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

export function WalkthroughModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_walkthrough');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem('has_seen_walkthrough', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
        <div className="relative p-8 text-center">
          <button 
            onClick={close}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                <Rocket className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Welcome to {APP_NAME}!</h2>
                <p className="text-gray-500">Let's get you ready for your first delivery with a quick walkthrough of our key features.</p>
              </div>
              <Button onClick={() => setStep(2)} className="w-full h-12 text-lg gap-2">
                Let's Go <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Goods Insurance</h2>
                <p className="text-gray-500 text-sm">Every package is precious. You can now opt-in for <strong>Goods Insurance</strong> on every request to protect against loss or damage.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-left border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                   <Check className="w-4 h-4 text-green-500" />
                   <span className="text-xs font-bold text-gray-700">Peace of Mind</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">Simply check the 'Add Goods Insurance' box when creating a new delivery. Coverage is instant!</p>
              </div>
              <Button onClick={() => setStep(3)} className="w-full h-12 text-lg gap-2">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <Gift className="w-10 h-10 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Refer & Earn</h2>
                <p className="text-gray-500 text-sm">Grow with {APP_NAME}! Invite other businesses and earn credits for every successful delivery they make.</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-sm font-bold text-amber-900 mb-1">Get 50% Off</p>
                <p className="text-[10px] text-amber-700">Your next 5 deliveries are 50% off for every business that registers using your referral link.</p>
              </div>
              <Button onClick={close} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                Finish Walkthrough
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  step === s ? "w-8 bg-blue-600" : "bg-gray-200"
                )} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
