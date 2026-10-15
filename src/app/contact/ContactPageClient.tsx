'use client';

import React, { useState } from 'react';
import { MapPin, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageBanner } from '@/components/layout/PageBanner';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
import { siteConfig, ContactPageConfig } from '@/content/site';

interface ContactPageClientProps {
  content?: ContactPageConfig;
}

type EnquiryType = 'General enquiry' | 'Cleaning' | 'Moving' | 'Storage' | 'Multiple services';

export const ContactPageClient: React.FC<ContactPageClientProps> = ({
  content = siteConfig.contactPage,
}) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enquiryType, setEnquiryType] = useState<EnquiryType>('General enquiry');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [submissionResult, setSubmissionResult] = useState<{
    delivered: boolean;
    message: string;
  } | null>(null);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Please provide your full name.';
    }

    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!message.trim() || message.trim().length < 5) {
      errors.message = 'Please provide your message (at least 5 characters).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
          enquiryAbout: enquiryType,
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
        delivered: Boolean(data.delivered),
        message: data.message || 'Your message has been received.',
      });
      setIsSubmitting(false);
    } catch (err) {
      console.error('[ContactPageClient] Error:', err);
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
    setEnquiryType('General enquiry');
    setMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#202024] antialiased">
      {/* 1. Global Navigation Header */}
      <SiteHeader onOpenQuote={() => setIsQuoteModalOpen(true)} />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* REUSABLE FULL-BLEED PHOTOGRAPHIC PAGE BANNER              */}
        {/* ========================================================= */}
        <PageBanner
          title={content.banner.title}
          breadcrumb={content.banner.breadcrumb}
          imageSrc={content.banner.imageSrc}
          altText={content.banner.altText}
          pillBreadcrumb={true}
        />

        {/* ========================================================= */}
        {/* TWO-COLUMN CONTACT US EDITORIAL & OPEN FORM ARCHITECTURE  */}
        {/* ========================================================= */}
        <div className="w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
              
              {/* Left Column: Editorial Introduction & Dark Contact Panels (~55% width) */}
              <div className="lg:col-span-7 flex flex-col items-start">
                <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-3 block">
                  {content.eyebrow}
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12] mb-6">
                  {content.headline}
                </h1>

                <p className="text-base sm:text-lg lg:text-[18px] text-[#202024]/85 leading-relaxed font-normal mb-10 max-w-xl">
                  {content.supportingParagraph}
                </p>

                {/* Dark Contact Panels matching Solshine Reference Geometry */}
                <div className="w-full max-w-xl">
                  {/* Top Wide Dark Panel: Service Region */}
                  <div className="w-full bg-[#18181B] text-white rounded-[22px] p-7 sm:p-8 text-center flex flex-col items-center justify-center mb-4 border border-black/10 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3">
                      <MapPin className="w-5 h-5 text-[#C8E80B]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-1.5">
                      {content.serviceRegionTitle}
                    </h3>
                    <p className="text-sm text-white/75 leading-relaxed max-w-md font-normal">
                      {content.serviceRegionDescription}
                    </p>
                  </div>

                  {/* Bottom Two Dark Panels Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {/* Left Small Dark Card */}
                    <div className="bg-[#18181B] text-white rounded-[20px] p-6 text-center flex flex-col items-center justify-center border border-black/10 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-2.5">
                        <Mail className="w-4 h-4 text-[#C8E80B]" />
                      </div>
                      <h4 className="text-base font-semibold text-white tracking-tight mb-1">
                        Online Dispatch Queue
                      </h4>
                      <p className="text-xs text-white/70 leading-relaxed font-normal">
                        Enquiries reviewed daily by our Ottawa service queue
                      </p>
                    </div>

                    {/* Right Small Dark Card */}
                    <div className="bg-[#18181B] text-white rounded-[20px] p-6 text-center flex flex-col items-center justify-center border border-black/10 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-2.5">
                        <Phone className="w-4 h-4 text-[#C8E80B]" />
                      </div>
                      <h4 className="text-base font-semibold text-white tracking-tight mb-1">
                        Direct Enquiry System
                      </h4>
                      <p className="text-xs text-white/70 leading-relaxed font-normal">
                        Prompt callback arranged upon request
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Open Form directly on page canvas (~45% width) */}
              <div className="lg:col-span-5 w-full pt-1">
                {submissionResult ? (
                  <div className="py-8 px-6 sm:px-8 bg-white rounded-[24px] border border-[#202024]/10 shadow-xs flex flex-col items-start space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#C8E80B] text-[#18181B] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-[#18181B]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-[#18181B] tracking-tight">
                      Message Sent
                    </h2>
                    <p className="text-base text-[#202024]/85 leading-relaxed font-normal">
                      {submissionResult.message}
                    </p>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 text-xs font-bold uppercase tracking-wider text-[#390044] hover:underline cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="flex flex-col space-y-5">
                    {/* Form Heading */}
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight mb-1">
                      {content.form.heading}
                    </h2>

                    {/* General Error Banner */}
                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Anti-spam Honeypot */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="contact-form-website">Website</label>
                      <input
                        type="text"
                        id="contact-form-website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="contact-full-name"
                        className="block text-xs font-medium text-[#18181B]/80 mb-1.5"
                      >
                        Full name *
                      </label>
                      <input
                        type="text"
                        id="contact-full-name"
                        name="name"
                        required
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                        }}
                        className={`w-full h-[52px] sm:h-[54px] px-4 rounded-xl bg-white border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors ${
                          fieldErrors.name ? 'border-rose-400' : 'border-[#202024]/15'
                        }`}
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-[#18181B]/80 mb-1.5"
                      >
                        Email address *
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        name="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                        }}
                        className={`w-full h-[52px] sm:h-[54px] px-4 rounded-xl bg-white border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors ${
                          fieldErrors.email ? 'border-rose-400' : 'border-[#202024]/15'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
                      )}
                    </div>

                    {/* Phone Number (Optional) */}
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-xs font-medium text-[#18181B]/80 mb-1.5"
                      >
                        Phone number <span className="text-xs text-[#202024]/50 font-normal">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        placeholder="Your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-[52px] sm:h-[54px] px-4 rounded-xl bg-white border border-[#202024]/15 text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors"
                      />
                    </div>

                    {/* Enquiry Type (Accessible Native Select) */}
                    <div>
                      <label
                        htmlFor="contact-enquiry-type"
                        className="block text-xs font-medium text-[#18181B]/80 mb-1.5"
                      >
                        Enquiry type
                      </label>
                      <select
                        id="contact-enquiry-type"
                        name="enquiryType"
                        value={enquiryType}
                        onChange={(e) => setEnquiryType(e.target.value as EnquiryType)}
                        className="w-full h-[52px] sm:h-[54px] px-4 rounded-xl bg-white border border-[#202024]/15 text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors cursor-pointer"
                      >
                        <option value="General enquiry">General enquiry</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Moving">Moving</option>
                        <option value="Storage">Storage</option>
                        <option value="Multiple services">Multiple services</option>
                      </select>
                    </div>

                    {/* Your Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-medium text-[#18181B]/80 mb-1.5"
                      >
                        Your message *
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        placeholder="Tell us about the job, where it's needed and your preferred date."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: undefined }));
                        }}
                        className={`w-full p-4 rounded-xl bg-white border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors resize-none ${
                          fieldErrors.message ? 'border-rose-400' : 'border-[#202024]/15'
                        }`}
                      />
                      {fieldErrors.message && (
                        <p className="text-xs text-rose-600 mt-1">{fieldErrors.message}</p>
                      )}
                    </div>

                    {/* Submit Button: Compact Black Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center bg-[#18181B] hover:bg-[#390044] text-white px-7 py-3.5 rounded-full text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <span>{content.form.buttonText}</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 10: FULL-WIDTH FACTUAL OTTAWA SERVICE REGION PANEL  */}
        {/* ========================================================= */}
        <div className="w-full max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pb-20">
          <div className="bg-[#F2F1ED] rounded-[24px] p-8 sm:p-12 border border-[#202024]/8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#C8E80B] text-[#18181B] flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-[#18181B]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#18181B] tracking-tight mb-2">
              Ottawa & National Capital Region Service
            </h3>
            <p className="text-sm sm:text-base text-[#202024]/75 max-w-xl leading-relaxed font-normal mb-4">
              Centrally coordinating cleaning, moving, and storage across Ottawa, Kanata, Nepean, Gloucester, Orleans, and surrounding communities.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#390044]">
              <span className="px-3 py-1 rounded-full bg-white/70">Ottawa</span>
              <span className="px-3 py-1 rounded-full bg-white/70">Kanata</span>
              <span className="px-3 py-1 rounded-full bg-white/70">Nepean</span>
              <span className="px-3 py-1 rounded-full bg-white/70">Gloucester</span>
              <span className="px-3 py-1 rounded-full bg-white/70">Orleans</span>
            </div>
          </div>
        </div>

      </main>

      {/* Global Footer */}
      <SiteFooter onOpenQuote={() => setIsQuoteModalOpen(true)} />

      {/* Quote / Planning Inquiry Modal */}
      <QuoteInquiryModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
