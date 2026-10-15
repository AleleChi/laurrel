'use client';

import React, { useState } from 'react';
import { MapPin, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageBanner } from '@/components/layout/PageBanner';
import { ContactLocationMap } from '@/components/contact/ContactLocationMap';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  SubmitButton,
  FormError,
} from '@/components/forms';
import { EnquiryPayload } from '@/lib/types/enquiry';
import { validateEnquiry } from '@/lib/validation/enquiry';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<{
    delivered: boolean;
    referenceId?: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload: EnquiryPayload = {
      intent: 'general_contact',
      source: 'web_contact_page',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      enquiryAbout: enquiryType,
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
        delivered: Boolean(data.delivered),
        referenceId: data.referenceId,
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
              
              {/* Left Column: Editorial Introduction & Straightforward Typographic Contact Details (~55% width) */}
              <div className="lg:col-span-7 flex flex-col items-start pr-0 lg:pr-6">
                <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-3 block">
                  {content.eyebrow}
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12] mb-6">
                  {content.headline}
                </h1>

                <p className="text-base sm:text-lg lg:text-[18px] text-[#202024]/85 leading-relaxed font-normal mb-8 max-w-xl">
                  {content.supportingParagraph}
                </p>

                {/* Straightforward Typographic Contact Information (No decorative cards or fake systems) */}
                <div className="w-full max-w-xl border-t border-[#202024]/10 pt-6 space-y-6">
                  {/* Verified Business Email (Clickable mailto:) if available */}
                  {content.businessEmail && content.businessEmail.trim().length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#202024]/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-[#390044]" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-[#202024]/60 mb-0.5">
                          Email Enquiries
                        </span>
                        <a
                          href={`mailto:${content.businessEmail}`}
                          className="text-base font-semibold text-[#18181B] hover:text-[#390044] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded"
                        >
                          {content.businessEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Verified Business Phone (Clickable tel:) if available */}
                  {content.businessPhone && content.businessPhone.trim().length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#202024]/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-[#390044]" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-[#202024]/60 mb-0.5">
                          Phone Enquiries
                        </span>
                        <a
                          href={`tel:${content.businessPhone}`}
                          className="text-base font-semibold text-[#18181B] hover:text-[#390044] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded"
                        >
                          {content.businessPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Verified Office Address if Mode A */}
                  {content.hasPublicOffice && content.officeAddress && content.officeAddress.trim().length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#202024]/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-[#390044]" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-[#202024]/60 mb-0.5">
                          Public Office Location
                        </span>
                        <p className="text-base font-semibold text-[#18181B]">
                          {content.officeAddress}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Operational Notes: Form as Primary Contact Method */}
                  <div className="flex items-start gap-3.5 pt-2">
                    <div className="w-2 h-2 rounded-full bg-[#390044] mt-2 flex-shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-[#202024]/60 mb-0.5">
                        Direct Enquiries
                      </span>
                      <p className="text-sm sm:text-base text-[#202024]/85 leading-relaxed font-normal">
                        Use the enquiry form to share your property details, scheduling requirements, or service combinations. Our Ottawa team reviews requests directly.
                      </p>
                    </div>
                  </div>

                  {/* Verified Geographic Region */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 rounded-full bg-[#390044] mt-2 flex-shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-[#202024]/60 mb-0.5">
                        Service Region
                      </span>
                      <p className="text-sm sm:text-base text-[#202024]/85 leading-relaxed font-normal">
                        Centrally serving residential and commercial properties across Ottawa, Ontario and the National Capital Region.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Open Form directly on page canvas (~45% width) */}
              <div id="contact-form-container" className="lg:col-span-5 w-full pt-1">
                {submissionResult ? (
                  <div id="contact-form-success" className="py-8 px-6 sm:px-8 bg-white rounded-[24px] border border-[#202024]/10 shadow-xs flex flex-col items-start space-y-4">
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
                  <form id="contact-form" onSubmit={handleSubmit} noValidate className="flex flex-col space-y-5">
                    {/* Form Heading */}
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight mb-1">
                      {content.form.heading}
                    </h2>

                    <FormError message={errorMessage} />

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
                    <FormField
                      id="contact-full-name"
                      label="Full name"
                      required
                      error={fieldErrors.name}
                    >
                      <FormInput
                        type="text"
                        id="contact-full-name"
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

                    {/* Email Address */}
                    <FormField
                      id="contact-email"
                      label="Email address"
                      required
                      error={fieldErrors.email}
                    >
                      <FormInput
                        type="email"
                        id="contact-email"
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

                    {/* Phone Number (Optional) */}
                    <FormField
                      id="contact-phone"
                      label="Phone number"
                      optional
                      error={fieldErrors.phone}
                    >
                      <FormInput
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        placeholder="Your phone number"
                        value={phone}
                        hasError={Boolean(fieldErrors.phone)}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
                        }}
                      />
                    </FormField>

                    {/* Enquiry Type (Accessible Native Select) */}
                    <FormField id="contact-enquiry-type" label="Enquiry type">
                      <FormSelect
                        id="contact-enquiry-type"
                        name="enquiryType"
                        value={enquiryType}
                        onChange={(e) => setEnquiryType(e.target.value as EnquiryType)}
                        options={[
                          { value: 'General enquiry', label: 'General enquiry' },
                          { value: 'Cleaning', label: 'Cleaning' },
                          { value: 'Moving', label: 'Moving' },
                          { value: 'Storage', label: 'Storage' },
                          { value: 'Multiple services', label: 'Multiple services' },
                        ]}
                      />
                    </FormField>

                    {/* Your Message */}
                    <FormField
                      id="contact-message"
                      label="Your message"
                      required
                      error={fieldErrors.details || fieldErrors.message}
                    >
                      <FormTextarea
                        id="contact-message"
                        name="message"
                        required
                        rows={4}
                        placeholder="Tell us about the job, where it's needed and your preferred date."
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
                      >
                        {content.form.buttonText}
                      </SubmitButton>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* REAL GOOGLE MAPS SERVICE AREA INTEGRATION                 */}
        {/* ========================================================= */}
        <ContactLocationMap
          hasPublicOffice={content.hasPublicOffice}
          officeAddress={content.officeAddress}
          googleMapsPlaceId={content.googleMapsPlaceId}
          locationHeading={content.locationHeading}
          serviceRegionDescription={content.serviceRegionDescription}
        />

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
