'use client';

import React, { useState } from 'react';
import { AlertCircle, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './Button';
import api from '@/lib/api';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'real' | 'test' | 'simulated';
  context?: string;
}

export function IssueReportModal({ isOpen, onClose, category, context }: IssueReportModalProps) {
  const [issueType, setIssueType] = useState('bug');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/feedback/report', {
        type: issueType,
        description,
        category,
        context,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setDescription('');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit issue', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-gray-900">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Report an Issue
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center animate-in slide-in-from-bottom-4 duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Thank You!</h4>
              <p className="text-gray-500 mt-2">Your feedback helps us improve the {category} experience.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Type</label>
                <select 
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="bug">Technical Bug</option>
                  <option value="delay">Delivery Delay</option>
                  <option value="driver_issue">Driver Behavior</option>
                  <option value="app_feedback">General Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what happened..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none transition-all"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 font-medium">
                  This report will be tagged as <span className="uppercase font-bold">{category}</span> and sent to the operations team for review.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Report'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
