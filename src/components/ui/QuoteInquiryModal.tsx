'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Truck, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface QuoteInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: 'cleaning' | 'moving' | 'storage' | 'general';
}

type ServiceType = 'cleaning' | 'moving' | 'storage';

export const QuoteInquiryModal: React.FC<QuoteInquiryModalProps> = ({
  isOpen,
  onClose,
  initialService = 'general',
}) => {
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [details, setDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    delivered: boolean;
    message: string;
  } | null>(null);

  // Sync initial service when opened
  useEffect(() => {
    if (isOpen) {
      if (initialService !== 'general') {
        setSelectedServices([initialService]);
      } else {
        setSelectedServices(['cleaning']);
      }
      setFormError(null);
      setSubmissionResult(null);
    }
  }, [isOpen, initialService]);

  // Handle escape key & scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleService = (service: ServiceType) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== service));
      }
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (name.trim().length < 2) {
      setFormError('Please enter your name.');
      return;
    }

    if (contact.trim().length < 5) {
      setFormError('Please enter a valid phone number or email address.');
      return;
    }

    if (selectedServices.length === 0) {
      setFormError('Please select at least one service category.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/enquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          services: selectedServices,
          preferredDate: preferredDate.trim(),
          details: details.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Unable to submit enquiry. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmissionResult({
        delivered: data.delivered,
        message: data.message,
      });
    } catch {
      setFormError('Connection error. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202024]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-[#FFFFFF] rounded-3xl shadow-2xl border border-black/10 overflow-hidden z-10 transition-all max-h-[90vh] flex flex-col p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-black/5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#390044] block mb-1">
              Ottawa, Ontario
            </span>
            <h2 id="quote-modal-title" className="text-2xl font-extrabold text-[#390044] tracking-tight">
              Request a Service Quote
            </h2>
            <p className="text-sm text-[#575757] mt-1">
              Tell us what you need and your preferred timing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#575757] hover:bg-black/5 hover:text-[#202024] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 py-4 pr-1">
          {submissionResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#C8E80B]/25 flex items-center justify-center text-[#390044]">
                <CheckCircle2 className="w-7 h-7 text-[#557A00]" />
              </div>
              <h3 className="text-xl font-bold text-[#390044]">Enquiry Received</h3>
              <p className="text-sm text-[#575757] max-w-md mx-auto leading-relaxed">
                {submissionResult.message}
              </p>
              <div className="pt-4">
                <Button variant="primary" size="md" onClick={onClose} icon={false}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#575757] mb-2">
                  Required Service(s)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleService('cleaning')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all font-semibold text-xs gap-1.5 ${
                      selectedServices.includes('cleaning')
                        ? 'border-[#390044] bg-[#390044]/5 text-[#390044]'
                        : 'border-black/10 hover:border-black/20 bg-white text-[#575757]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Cleaning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleService('moving')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all font-semibold text-xs gap-1.5 ${
                      selectedServices.includes('moving')
                        ? 'border-[#390044] bg-[#390044]/5 text-[#390044]'
                        : 'border-black/10 hover:border-black/20 bg-white text-[#575757]'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Moving</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleService('storage')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all font-semibold text-xs gap-1.5 ${
                      selectedServices.includes('storage')
                        ? 'border-[#390044] bg-[#390044]/5 text-[#390044]'
                        : 'border-black/10 hover:border-black/20 bg-white text-[#575757]'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Storage</span>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#202024] mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-sm text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#390044]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202024] mb-1">
                    Phone or Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Contact info"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-sm text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#390044]"
                  />
                </div>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-semibold text-[#202024] mb-1">
                  Preferred Date or Timeline (Optional)
                </label>
                <input
                  type="text"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  placeholder="e.g. Next month, end of the week, or specific date"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-sm text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#390044]"
                />
              </div>

              {/* Service Details */}
              <div>
                <label className="block text-xs font-semibold text-[#202024] mb-1">
                  Details of the Job (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Property size, locations, or special considerations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-sm text-[#202024] focus:outline-none focus:ring-2 focus:ring-[#390044] resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex justify-end gap-3 border-t border-black/5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  icon={false}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={false}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
