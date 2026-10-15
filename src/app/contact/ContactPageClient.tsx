'use client';

import React, { useState } from 'react';
import { Send, MapPin, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageBanner } from '@/components/layout/PageBanner';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
import { siteConfig, ContactPageConfig } from '@/content/site';

interface ContactPageClientProps {
  content?: ContactPageConfig;
}

type EnquiryTopic = 'Cleaning' | 'Moving' | 'Storage' | 'Multiple Services' | 'General Enquiry';

export const ContactPageClient: React.FC<ContactPageClientProps> = ({
  content = siteConfig.contactPage,
}) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enquiryAbout, setEnquiryAbout] = useState<EnquiryTopic>('Cleaning');
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
      errors.name = 'Please provide your full name (at least 2 characters).';
    }

    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address (e.g. name@example.com).';
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
          enquiryAbout,
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
        {/* TWO-COLUMN CONTACT US EDITORIAL & FORM ARCHITECTURE       */}
        {/* ========================================================= */}
        <div className="w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
              
              {/* Left Column: Context, Region & Contact Options (~50%) */}
              <div className="lg:col-span-6 flex flex-col items-start pt-1">
                <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-3">
                  {content.sectionLabel}
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12] mb-6">
                  {content.headline}
                </h1>

                <div className="space-y-4 text-base sm:text-lg lg:text-[19px] text-[#202024]/85 leading-relaxed font-normal mb-10">
                  <p>{content.paragraph1}</p>
                  <p>{content.paragraph2}</p>
                </div>

                {/* Service Region Card */}
                <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 border border-[#202024]/10 shadow-xs mb-6 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#C8E80B] text-[#18181B] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-6 h-6 text-[#18181B]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#390044] block mb-1">
                      SERVICE REGION
                    </span>
                    <h3 className="text-xl font-semibold text-[#18181B] tracking-tight mb-1">
                      {content.serviceRegion}
                    </h3>
                    <p className="text-sm text-[#202024]/75 leading-relaxed font-normal">
                      Serving central Ottawa, Kanata, Nepean, Gloucester, Orleans and surrounding National Capital Region locations.
                    </p>
                  </div>
                </div>

                {/* Contact Notice Card (Factual Integrity per AGENTS.md) */}
                <div className="w-full bg-[#F2F1ED] rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 border border-[#202024]/10 shadow-xs flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#18181B] text-[#C8E80B] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-6 h-6 text-[#C8E80B]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#390044] block mb-1">
                      VERIFIED CONTACT NOTICE
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-[#18181B] tracking-tight mb-1">
                      Direct Dispatch Communication
                    </h3>
                    <p className="text-sm text-[#202024]/75 leading-relaxed font-normal">
                      {content.contactOptionsNotice} Initial enquiries are promptly reviewed by our Ottawa service queue.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Send Us a Message Form Card (~50%) */}
              <div className="lg:col-span-6 bg-white rounded-[32px] sm:rounded-[36px] p-8 sm:p-10 xl:p-12 border border-[#202024]/10 shadow-xs">
                {submissionResult ? (
                  <div className="py-6 flex flex-col items-start space-y-4">
                    <div className="w-14 h-14 rounded-full bg-[#C8E80B] text-[#18181B] flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-[#18181B]" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight">
                      Message Sent
                    </h2>
                    <p className="text-base text-[#202024]/85 leading-relaxed font-normal">
                      {submissionResult.message}
                    </p>

                    {!submissionResult.delivered && (
                      <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-[#202024]/10 text-xs sm:text-sm text-[#202024]/75 leading-relaxed">
                        <strong>Pre-launch status:</strong> External email credentials (Resend/SMTP) are pending in environment configuration. Your message is safely recorded in development dispatch.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 text-xs font-bold uppercase tracking-wider text-[#390044] hover:underline cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="flex flex-col space-y-6">
                    {/* Header */}
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight">
                        {content.form.heading}
                      </h2>
                      <p className="text-sm sm:text-base text-[#202024]/75 leading-relaxed mt-2 font-normal">
                        {content.form.subheading}
                      </p>
                    </div>

                    {/* General Error Banner */}
                    {errorMessage && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5">
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
                        className="block text-xs font-semibold text-[#18181B] mb-1.5"
                      >
                        Full name <span className="text-rose-500">*</span>
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
                        className={`w-full px-4 py-3.5 rounded-2xl bg-[#F8F7F4] border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors ${
                          fieldErrors.name ? 'border-rose-400' : 'border-[#202024]/12'
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
                        className="block text-xs font-semibold text-[#18181B] mb-1.5"
                      >
                        Email address <span className="text-rose-500">*</span>
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
                        className={`w-full px-4 py-3.5 rounded-2xl bg-[#F8F7F4] border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors ${
                          fieldErrors.email ? 'border-rose-400' : 'border-[#202024]/12'
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
                        className="block text-xs font-semibold text-[#18181B] mb-1.5"
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
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#F8F7F4] border border-[#202024]/12 text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors"
                      />
                    </div>

                    {/* What is your enquiry about? */}
                    <div>
                      <label
                        htmlFor="contact-enquiry-about"
                        className="block text-xs font-semibold text-[#18181B] mb-2"
                      >
                        What is your enquiry about?
                      </label>
                      <div
                        role="group"
                        aria-label="Enquiry Topic"
                        className="flex flex-wrap gap-2"
                      >
                        {(
                          ['Cleaning', 'Moving', 'Storage', 'Multiple Services', 'General Enquiry'] as EnquiryTopic[]
                        ).map((topic) => {
                          const isSelected = enquiryAbout === topic;
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => setEnquiryAbout(topic)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C8E80B] text-[#18181B] font-semibold shadow-2xs'
                                  : 'bg-[#F2F1ED] hover:bg-[#EAE8E2] text-[#202024]'
                              }`}
                              aria-pressed={isSelected}
                            >
                              {topic}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Your Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-semibold text-[#18181B] mb-1.5"
                      >
                        Your message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        placeholder="Describe what you have planned, where the work will take place and your preferred date."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: undefined }));
                        }}
                        className={`w-full px-4 py-3.5 rounded-2xl bg-[#F8F7F4] border text-sm text-[#18181B] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-colors resize-none ${
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
                        className="inline-flex items-center justify-center gap-2.5 bg-[#18181B] hover:bg-[#390044] active:scale-[0.99] text-white px-8 py-4 rounded-full text-sm sm:text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs w-full sm:w-auto"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>{content.form.buttonText}</span>
                            <Send className="w-4 h-4 text-white" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

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
