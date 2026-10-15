'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export type ServiceOption = 'cleaning' | 'moving' | 'storage';

interface SidebarEnquiryFormProps {
  heading?: string;
  supportingText?: string;
  submitButtonText?: string;
  serviceContext?: ServiceOption | 'all';
  onServiceContextChange?: (service: ServiceOption | 'all') => void;
}

export const SidebarEnquiryForm: React.FC<SidebarEnquiryFormProps> = ({
  heading = 'Tell us what you need.',
  supportingText = "Share a few details about the service you're planning, and we'll review your enquiry.",
  submitButtonText = 'Send Enquiry',
  serviceContext = 'cleaning',
  onServiceContextChange,
}) => {
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>(['cleaning']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-spam honeypot

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
    services?: string;
  }>({});
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    delivered: boolean;
    message: string;
  } | null>(null);

  // Sync service selection when external serviceContext changes
  useEffect(() => {
    if (serviceContext === 'all') {
      setSelectedServices(['cleaning', 'moving', 'storage']);
    } else if (serviceContext) {
      setSelectedServices([serviceContext]);
    }
  }, [serviceContext]);

  const handleToggleService = (service: ServiceOption) => {
    let next: ServiceOption[];
    if (selectedServices.includes(service)) {
      if (selectedServices.length > 1) {
        next = selectedServices.filter((s) => s !== service);
      } else {
        return; // Keep at least one selected
      }
    } else {
      next = [...selectedServices, service];
    }
    setSelectedServices(next);
    if (fieldErrors.services) {
      setFieldErrors((prev) => ({ ...prev, services: undefined }));
    }
    if (onServiceContextChange) {
      onServiceContextChange(next.length === 3 ? 'all' : next[0]);
    }
  };

  const handleSelectAllServices = () => {
    setSelectedServices(['cleaning', 'moving', 'storage']);
    if (onServiceContextChange) {
      onServiceContextChange('all');
    }
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Please provide your full name (at least 2 characters).';
    }

    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address (e.g. name@example.com).';
    }

    if (selectedServices.length === 0) {
      errors.services = 'Please select at least one service.';
    }

    if (!message.trim() || message.trim().length < 5) {
      errors.message = 'Please share a few details about what you need (at least 5 characters).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Honeypot check for bots
    if (honeypot.trim().length > 0) {
      setErrorMessage('Invalid submission detected.');
      return;
    }

    if (!validate()) {
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
          email: email.trim(),
          phone: phone.trim() || undefined,
          services: selectedServices,
          message: message.trim(),
          website: honeypot.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Unable to submit enquiry. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmissionResult({
        success: true,
        delivered: Boolean(data.delivered),
        message: data.message || 'Your enquiry has been received.',
      });
      setIsSubmitting(false);
    } catch (err) {
      console.error('[SidebarEnquiryForm] Error:', err);
      setErrorMessage('Connection error. Please check your network and try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setErrorMessage(null);
    setFieldErrors({});
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <div
      id="sidebar-enquiry-form"
      className="w-full bg-white rounded-[36px] p-6 sm:p-8 xl:p-9 border border-[#202024]/10 shadow-xs"
    >
      {submissionResult ? (
        <div className="py-4 flex flex-col items-start space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#C8E80B] text-[#18181B] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#18181B]" />
          </div>
          <h3 className="text-2xl font-semibold text-[#18181B] tracking-tight">
            Enquiry Received
          </h3>
          <p className="text-sm sm:text-base text-[#202024]/85 leading-relaxed font-normal">
            {submissionResult.message}
          </p>

          {!submissionResult.delivered && (
            <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-[#202024]/10 text-xs text-[#202024]/75 leading-relaxed">
              <strong>Pre-launch status:</strong> Live delivery provider credentials (Resend/SMTP) are pending in environment configuration. Your message is safely queued in development dispatch.
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="mt-2 text-xs font-bold uppercase tracking-wider text-[#390044] hover:underline cursor-pointer"
          >
            Submit Another Enquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col space-y-5">
          {/* Form Header */}
          <div>
            <h3 className="text-2xl sm:text-[26px] font-semibold text-[#18181B] tracking-[-0.02em] leading-snug">
              {heading}
            </h3>
            <p className="text-sm sm:text-[15px] text-[#202024]/75 leading-relaxed mt-2 font-normal">
              {supportingText}
            </p>
          </div>

          {/* Service Category Context Selector */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-[#202024]/70 mb-2">
              Service Needed
            </label>
            <div
              role="group"
              aria-label="Select service category"
              className="flex flex-wrap gap-2"
            >
              {(['cleaning', 'moving', 'storage'] as ServiceOption[]).map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleToggleService(service)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C8E80B] text-[#18181B] font-semibold shadow-2xs'
                        : 'bg-[#F2F1ED] hover:bg-[#EAE8E2] text-[#202024]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {service}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleSelectAllServices}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedServices.length === 3
                    ? 'bg-[#18181B] text-white font-semibold'
                    : 'bg-[#F2F1ED] hover:bg-[#EAE8E2] text-[#202024]'
                }`}
                aria-pressed={selectedServices.length === 3}
              >
                All Services
              </button>
            </div>
            {fieldErrors.services && (
              <p className="text-xs text-rose-600 mt-1.5">{fieldErrors.services}</p>
            )}
          </div>

          {/* General Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Anti-spam honeypot field (hidden from real users) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="sidebar-form-website">Website</label>
            <input
              type="text"
              id="sidebar-form-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* 1. Name Field */}
          <div>
            <label
              htmlFor="sidebar-form-name"
              className="block text-xs font-semibold text-[#18181B] mb-1.5"
            >
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="sidebar-form-name"
              name="name"
              required
              placeholder="Your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
              }}
              className={`w-full px-4 py-3 rounded-2xl bg-[#F8F7F4] border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors ${
                fieldErrors.name ? 'border-rose-400' : 'border-[#202024]/12'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* 2. Email Field */}
          <div>
            <label
              htmlFor="sidebar-form-email"
              className="block text-xs font-semibold text-[#18181B] mb-1.5"
            >
              Email address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              id="sidebar-form-email"
              name="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              className={`w-full px-4 py-3 rounded-2xl bg-[#F8F7F4] border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors ${
                fieldErrors.email ? 'border-rose-400' : 'border-[#202024]/12'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* 3. Phone Number Field (Optional) */}
          <div>
            <label
              htmlFor="sidebar-form-phone"
              className="block text-xs font-semibold text-[#18181B] mb-1.5"
            >
              Phone number <span className="text-xs text-[#202024]/50 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              id="sidebar-form-phone"
              name="phone"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F7F4] border border-[#202024]/12 text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors"
            />
          </div>

          {/* 4. Message Field */}
          <div>
            <label
              htmlFor="sidebar-form-message"
              className="block text-xs font-semibold text-[#18181B] mb-1.5"
            >
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="sidebar-form-message"
              name="message"
              required
              rows={3}
              placeholder="Tell us about the service, location and preferred date."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: undefined }));
              }}
              className={`w-full px-4 py-3 rounded-2xl bg-[#F8F7F4] border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors resize-none ${
                fieldErrors.message ? 'border-rose-400' : 'border-[#202024]/12'
              }`}
            />
            {fieldErrors.message && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2.5 bg-[#18181B] hover:bg-[#390044] active:scale-[0.99] text-white px-7 py-3.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{submitButtonText}</span>
                  <Send className="w-3.5 h-3.5 text-white" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
