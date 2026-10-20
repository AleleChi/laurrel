'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  FormField,
  FormInput,
  FormTextarea,
  ServiceMultiSelect,
  SubmitButton,
  FormError,
} from '@/components/forms';
import { ServiceCategory, EnquiryPayload } from '@/lib/types/enquiry';
import { validateEnquiry } from '@/lib/validation/enquiry';

export type ServiceOption = ServiceCategory;

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
  const [selectedServices, setSelectedServices] = useState<ServiceCategory[]>(['cleaning']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    delivered: boolean;
    referenceId?: string;
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

  const handleServicesChange = (next: ServiceCategory[]) => {
    setSelectedServices(next);
    if (fieldErrors.services) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.services;
        return copy;
      });
    }
    if (onServiceContextChange) {
      onServiceContextChange(next.length === 3 ? 'all' : next[0] || 'all');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload: EnquiryPayload = {
      intent: 'service_sidebar',
      source: 'web_services_sidebar',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      services: selectedServices,
      message: message.trim(),
      details: message.trim(),
      website: honeypot.trim() || undefined,
    };

    const validation = validateEnquiry(payload);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      if (validation.errors._bot) {
        setErrorMessage(validation.errors._bot);
      } else {
        setErrorMessage('Please review the highlighted fields before submitting.');
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/enquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
        referenceId: data.referenceId,
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
      className="w-full bg-white rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 xl:p-9 border border-[#202024]/10 shadow-xs"
    >
      {submissionResult ? (
        <div className="py-4 flex flex-col items-start space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FE6000] text-[#18181B] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#18181B]" />
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-[#18181B] tracking-tight">
              Enquiry Received
            </h3>
            {submissionResult.referenceId && (
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#49056B] mt-1">
                Ref: {submissionResult.referenceId}
              </p>
            )}
          </div>

          <p className="text-sm sm:text-base text-[#202024]/85 leading-relaxed font-normal">
            {submissionResult.message}
          </p>

          <button
            type="button"
            onClick={handleReset}
            className="mt-2 text-xs font-bold uppercase tracking-wider text-[#49056B] hover:underline cursor-pointer"
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

          <FormError message={errorMessage} />

          {/* Service Category Context Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#18181B]/85 tracking-wide">
                Services Required <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-[#202024]/55">Select required</span>
            </div>

            <ServiceMultiSelect
              selectedServices={selectedServices}
              onChange={handleServicesChange}
              hasError={Boolean(fieldErrors.services)}
              className="grid grid-cols-1 gap-2"
            />
            {fieldErrors.services && (
              <p role="alert" className="text-xs text-rose-600 font-medium">
                {fieldErrors.services}
              </p>
            )}
          </div>

          {/* Anti-spam honeypot */}
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
          <FormField
            id="sidebar-form-name"
            label="Name"
            required
            error={fieldErrors.name}
          >
            <FormInput
              type="text"
              id="sidebar-form-name"
              name="name"
              required
              placeholder="Your full name"
              value={name}
              hasError={Boolean(fieldErrors.name)}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
              }}
            />
          </FormField>

          {/* 2. Email Field */}
          <FormField
            id="sidebar-form-email"
            label="Email address"
            required
            error={fieldErrors.email}
          >
            <FormInput
              type="email"
              id="sidebar-form-email"
              name="email"
              required
              placeholder="name@example.com"
              value={email}
              hasError={Boolean(fieldErrors.email)}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
              }}
            />
          </FormField>

          {/* 3. Phone Number Field (Optional) */}
          <FormField
            id="sidebar-form-phone"
            label="Phone number"
            optional
            error={fieldErrors.phone}
          >
            <FormInput
              type="tel"
              id="sidebar-form-phone"
              name="phone"
              placeholder="(613) 555-0199"
              value={phone}
              hasError={Boolean(fieldErrors.phone)}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
              }}
            />
          </FormField>

          {/* 4. Message Field */}
          <FormField
            id="sidebar-form-message"
            label="Message"
            required
            error={fieldErrors.details || fieldErrors.message}
          >
            <FormTextarea
              id="sidebar-form-message"
              name="message"
              required
              rows={3}
              placeholder="Tell us about the service, location and preferred date."
              value={message}
              hasError={Boolean(fieldErrors.details || fieldErrors.message)}
              onChange={(e) => {
                setMessage(e.target.value);
                if (fieldErrors.details || fieldErrors.message) {
                  setFieldErrors((p) => ({ ...p, details: '', message: '' }));
                }
              }}
            />
          </FormField>

          {/* Submit Button */}
          <div className="pt-2">
            <SubmitButton
              isSubmitting={isSubmitting}
              submittingText="Sending..."
              variant="dark"
              className="w-full sm:w-auto"
            >
              {submitButtonText}
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
};
