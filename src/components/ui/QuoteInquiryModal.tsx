'use client';

import React, { useEffect } from 'react';
import { X, Sparkles, Truck, Package, Info, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

interface QuoteInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: 'cleaning' | 'moving' | 'storage' | 'general';
}

export const QuoteInquiryModal: React.FC<QuoteInquiryModalProps> = ({
  isOpen,
  onClose,
  initialService = 'general',
}) => {
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
      <div className="relative w-full max-w-lg bg-[#FFFFFF] rounded-2xl shadow-2xl border border-black/10 overflow-hidden z-10 transition-all transform scale-100 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-black/5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#390044]/5 text-[#390044] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#557A00]" />
              Ottawa, Ontario
            </div>
            <h2 id="quote-modal-title" className="text-2xl font-bold text-[#390044] tracking-tight">
              Request a Service Quote
            </h2>
            <p className="text-sm text-[#575757] mt-1">
              Select your services in Ottawa and tell us your timeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#575757] hover:bg-black/5 hover:text-[#202024] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Service Category Selector */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#575757]">
            Select Required Service(s)
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-[#390044] bg-[#390044]/5 text-[#390044] font-semibold text-xs gap-1.5 transition-all"
            >
              <Sparkles className="w-5 h-5 text-[#557A00]" />
              <span>Cleaning</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-black/10 hover:border-[#390044]/50 bg-white text-[#202024] font-semibold text-xs gap-1.5 transition-all"
            >
              <Truck className="w-5 h-5 text-[#390044]" />
              <span>Moving</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-black/10 hover:border-[#390044]/50 bg-white text-[#202024] font-semibold text-xs gap-1.5 transition-all"
            >
              <Package className="w-5 h-5 text-[#390044]" />
              <span>Storage</span>
            </button>
          </div>

          {/* Form Fields Preview */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#202024] mb-1">
                Your Name
              </label>
              <input
                type="text"
                disabled
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-lg border border-black/15 bg-neutral-50 text-sm text-[#202024] cursor-not-allowed opacity-80"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202024] mb-1">
                Contact Phone or Email
              </label>
              <input
                type="text"
                disabled
                placeholder="name@example.com / 613-xxx-xxxx"
                className="w-full px-3.5 py-2.5 rounded-lg border border-black/15 bg-neutral-50 text-sm text-[#202024] cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Honest Status Notice */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-black/10 flex items-start gap-3 text-xs text-[#575757] leading-relaxed">
            <Info className="w-4 h-4 text-[#390044] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#202024] block mb-0.5">Phase 01 Interface Preview</strong>
              Our live automated dispatch and booking system is being integrated in Phase 02. For immediate inquiries in Ottawa, please use the contact option or email us once launched.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-black/5">
          <Button variant="outline" size="sm" onClick={onClose} icon={false}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            icon={false}
          >
            Got it, thanks
          </Button>
        </div>
      </div>
    </div>
  );
};
