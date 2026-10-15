'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, CornerDownRight } from 'lucide-react';
import {
  AccessibleDialog,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  ServiceMultiSelect,
  FormError,
  SubmitButton,
} from '@/components/forms';
import {
  ServiceCategory,
  EnquiryPayload,
  CleaningServiceDetails,
  MovingServiceDetails,
  StorageServiceDetails,
} from '@/lib/types/enquiry';
import { validateEnquiry } from '@/lib/validation/enquiry';

export interface QuoteInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: ServiceCategory | 'general';
  initialServices?: ServiceCategory[];
}

export const QuoteInquiryModal: React.FC<QuoteInquiryModalProps> = ({
  isOpen,
  onClose,
  initialService = 'general',
  initialServices,
}) => {
  // Primary customer details
  const [selectedServices, setSelectedServices] = useState<ServiceCategory[]>(['cleaning']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [details, setDetails] = useState('');

  // Conditional service specifics: Cleaning
  const [cleaningPropertyType, setCleaningPropertyType] = useState('Detached house');
  const [cleaningPropertySize, setCleaningPropertySize] = useState('');
  const [cleaningRequirements, setCleaningRequirements] = useState('');

  // Conditional service specifics: Moving
  const [movingFrom, setMovingFrom] = useState('');
  const [movingTo, setMovingTo] = useState('');
  const [movingBelongingsSize, setMovingBelongingsSize] = useState('');
  const [movingAccess, setMovingAccess] = useState('');

  // Conditional service specifics: Storage
  const [storageDuration, setStorageDuration] = useState('1 to 3 months');
  const [storageItemsType, setStorageItemsType] = useState('');
  const [storageAccessRequirements, setStorageAccessRequirements] = useState('');

  // Anti-spam honeypot
  const [honeypot, setHoneypot] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<{
    delivered: boolean;
    referenceId?: string;
    message: string;
  } | null>(null);

  // Sync initial services when opened
  useEffect(() => {
    if (isOpen) {
      if (initialServices && initialServices.length > 0) {
        setSelectedServices(initialServices);
      } else if (initialService && initialService !== 'general') {
        setSelectedServices([initialService]);
      } else {
        setSelectedServices(['cleaning']);
      }
      setFormError(null);
      setFieldErrors({});
      setSubmissionResult(null);
    }
  }, [isOpen, initialService, initialServices]);

  const handleServicesChange = (services: ServiceCategory[]) => {
    setSelectedServices(services);
    if (fieldErrors.services) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.services;
        return next;
      });
    }
  };

  const handleResetFormFields = () => {
    setName('');
    setEmail('');
    setPhone('');
    setServiceLocation('');
    setPreferredDate('');
    setDetails('');
    setCleaningPropertySize('');
    setCleaningRequirements('');
    setMovingFrom('');
    setMovingTo('');
    setMovingBelongingsSize('');
    setMovingAccess('');
    setStorageItemsType('');
    setStorageAccessRequirements('');
    setFormError(null);
    setFieldErrors({});
  };

  const handleStartNew = () => {
    handleResetFormFields();
    setSubmissionResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Build conditional details
    const cleaningDetails: CleaningServiceDetails | undefined = selectedServices.includes('cleaning')
      ? {
          propertyType: cleaningPropertyType,
          propertySize: cleaningPropertySize.trim() || undefined,
          cleaningRequirements: cleaningRequirements.trim() || undefined,
        }
      : undefined;

    const movingDetails: MovingServiceDetails | undefined = selectedServices.includes('moving')
      ? {
          movingFrom: movingFrom.trim() || undefined,
          movingTo: movingTo.trim() || undefined,
          belongingsSize: movingBelongingsSize.trim() || undefined,
          accessConsiderations: movingAccess.trim() || undefined,
        }
      : undefined;

    const storageDetails: StorageServiceDetails | undefined = selectedServices.includes('storage')
      ? {
          storageDuration: storageDuration.trim() || undefined,
          storageItemsType: storageItemsType.trim() || undefined,
          accessRequirements: storageAccessRequirements.trim() || undefined,
        }
      : undefined;

    const payload: EnquiryPayload = {
      intent: 'quote_request',
      source: 'web_quote_modal',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      services: selectedServices,
      serviceLocation: serviceLocation.trim(),
      preferredDate: preferredDate.trim() || undefined,
      details: details.trim(),
      serviceDetails: {
        cleaning: cleaningDetails,
        moving: movingDetails,
        storage: storageDetails,
      },
      website: honeypot.trim() || undefined,
    };

    // Client-side validation
    const validation = validateEnquiry(payload);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      if (validation.errors._bot) {
        setFormError(validation.errors._bot);
      } else {
        setFormError('Please review the highlighted fields before submitting.');
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Unable to submit enquiry. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmissionResult({
        delivered: Boolean(data.delivered),
        referenceId: data.referenceId,
        message: data.message || 'Your quote request has been received.',
      });
      handleResetFormFields();
    } catch {
      setFormError('Network connection issue. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCleaning = selectedServices.includes('cleaning');
  const hasMoving = selectedServices.includes('moving');
  const hasStorage = selectedServices.includes('storage');

  return (
    <AccessibleDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="quote-dialog-title"
      descriptionId="quote-dialog-description"
      eyebrow="Ottawa, Ontario"
      title="Request a Service Quote"
      description="Tell us what you need, where and when."
      maxWidth="max-w-2xl"
    >
      {submissionResult ? (
        <div className="py-6 sm:py-8 flex flex-col items-start space-y-4 text-left">
          <div className="w-12 h-12 rounded-full bg-[#C8E80B] text-[#18181B] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#18181B]" />
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-[#18181B] tracking-tight">
              Quote Request Received
            </h3>
            {submissionResult.referenceId && (
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#390044] mt-1">
                Reference: {submissionResult.referenceId}
              </p>
            )}
          </div>

          <p className="text-sm sm:text-base text-[#202024]/85 leading-relaxed font-normal">
            {submissionResult.message}
          </p>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartNew}
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl border border-black/15 hover:border-black/30 hover:bg-black/[0.03] text-[#202024] text-sm font-medium transition-colors cursor-pointer"
            >
              Submit Another Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#18181B] hover:bg-[#390044] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form id="quote-inquiry-form" onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormError message={formError} />

          {/* Honeypot field (hidden from legitimate visitors) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="quote-website-trap">Website</label>
            <input
              type="text"
              id="quote-website-trap"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* 1. Required Service Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-semibold text-[#18181B]/85 tracking-wide">
                Services Required <span className="text-rose-600">*</span>
              </span>
              <span className="text-[11px] text-[#202024]/55">Select all that apply</span>
            </div>

            <ServiceMultiSelect
              selectedServices={selectedServices}
              onChange={handleServicesChange}
              hasError={Boolean(fieldErrors.services)}
            />
            {fieldErrors.services && (
              <p role="alert" className="text-xs text-rose-600 font-medium">
                {fieldErrors.services}
              </p>
            )}
          </div>

          {/* 2. Customer Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <FormField
              id="quote-full-name"
              label="Full name"
              required
              error={fieldErrors.name}
            >
              <FormInput
                id="quote-full-name"
                name="name"
                placeholder="Jane Doe"
                autoComplete="name"
                value={name}
                hasError={Boolean(fieldErrors.name)}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                }}
              />
            </FormField>

            <FormField
              id="quote-email"
              label="Email address"
              required
              error={fieldErrors.email}
            >
              <FormInput
                type="email"
                id="quote-email"
                name="email"
                placeholder="jane@example.com"
                autoComplete="email"
                value={email}
                hasError={Boolean(fieldErrors.email)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="quote-phone"
              label="Phone number"
              optional
              error={fieldErrors.phone}
            >
              <FormInput
                type="tel"
                id="quote-phone"
                name="phone"
                placeholder="(613) 555-0199"
                autoComplete="tel"
                value={phone}
                hasError={Boolean(fieldErrors.phone)}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
                }}
              />
            </FormField>

            <FormField
              id="quote-location"
              label="Service location or postal code"
              required
              error={fieldErrors.serviceLocation}
            >
              <FormInput
                type="text"
                id="quote-location"
                name="serviceLocation"
                placeholder="e.g. K1P 1J1 or Westboro, Ottawa"
                value={serviceLocation}
                hasError={Boolean(fieldErrors.serviceLocation)}
                onChange={(e) => {
                  setServiceLocation(e.target.value);
                  if (fieldErrors.serviceLocation) {
                    setFieldErrors((p) => ({ ...p, serviceLocation: '' }));
                  }
                }}
              />
            </FormField>
          </div>

          {/* 3. Preferred Date / Timeframe */}
          <FormField
            id="quote-preferred-date"
            label="Preferred date or timeframe"
            optional
            hint="Exact date or general target"
          >
            <FormInput
              type="text"
              id="quote-preferred-date"
              name="preferredDate"
              placeholder="e.g. End of next month, mid-April, or specific weekday"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
            />
          </FormField>

          {/* 4. Conditional Service Specifics */}
          {(hasCleaning || hasMoving || hasStorage) && (
            <div className="pt-2 pb-1 space-y-4">
              <div className="border-t border-[#202024]/10 pt-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#390044] mb-3">
                  Service Specifics
                </span>
              </div>

              {/* Cleaning specifics */}
              {hasCleaning && (
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#202024]/10 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#18181B] uppercase tracking-wide">
                      Cleaning Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField id="cleaning-property-type" label="Property type" optional>
                      <FormSelect
                        id="cleaning-property-type"
                        value={cleaningPropertyType}
                        onChange={(e) => setCleaningPropertyType(e.target.value)}
                        options={[
                          { value: 'Detached house', label: 'Detached house' },
                          { value: 'Townhouse / Semi', label: 'Townhouse / Semi' },
                          { value: 'Condo / Apartment', label: 'Condo / Apartment' },
                          { value: 'Commercial office', label: 'Commercial office' },
                          { value: 'Other property', label: 'Other property' },
                        ]}
                      />
                    </FormField>

                    <FormField id="cleaning-property-size" label="Approximate size" optional>
                      <FormInput
                        id="cleaning-property-size"
                        placeholder="e.g. 3 bedrooms, 2 baths or ~1,600 sq ft"
                        value={cleaningPropertySize}
                        onChange={(e) => setCleaningPropertySize(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <FormField id="cleaning-requirements" label="Cleaning requirements" optional>
                    <FormInput
                      id="cleaning-requirements"
                      placeholder="e.g. Move-in deep clean, post-renovation dust, handover"
                      value={cleaningRequirements}
                      onChange={(e) => setCleaningRequirements(e.target.value)}
                    />
                  </FormField>
                </div>
              )}

              {/* Moving specifics */}
              {hasMoving && (
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#202024]/10 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#18181B] uppercase tracking-wide">
                      Moving Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField id="moving-from" label="Moving from" optional>
                      <FormInput
                        id="moving-from"
                        placeholder="Origin address or neighbourhood"
                        value={movingFrom}
                        onChange={(e) => setMovingFrom(e.target.value)}
                      />
                    </FormField>

                    <FormField id="moving-to" label="Moving to" optional>
                      <FormInput
                        id="moving-to"
                        placeholder="Destination address or neighbourhood"
                        value={movingTo}
                        onChange={(e) => setMovingTo(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField id="moving-belongings" label="Belongings size" optional>
                      <FormInput
                        id="moving-belongings"
                        placeholder="e.g. 2-bedroom home, partial load"
                        value={movingBelongingsSize}
                        onChange={(e) => setMovingBelongingsSize(e.target.value)}
                      />
                    </FormField>

                    <FormField id="moving-access" label="Building access" optional>
                      <FormInput
                        id="moving-access"
                        placeholder="e.g. 2nd floor stairs, elevator booked"
                        value={movingAccess}
                        onChange={(e) => setMovingAccess(e.target.value)}
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Storage specifics */}
              {hasStorage && (
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#202024]/10 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#18181B] uppercase tracking-wide">
                      Storage Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField id="storage-duration" label="Expected duration" optional>
                      <FormSelect
                        id="storage-duration"
                        value={storageDuration}
                        onChange={(e) => setStorageDuration(e.target.value)}
                        options={[
                          { value: 'Less than 1 month', label: 'Less than 1 month' },
                          { value: '1 to 3 months', label: '1 to 3 months' },
                          { value: '3 to 6 months', label: '3 to 6 months' },
                          { value: '6+ months (long term)', label: '6+ months (long term)' },
                          { value: 'Flexible / Uncertain', label: 'Flexible / Uncertain' },
                        ]}
                      />
                    </FormField>

                    <FormField id="storage-access" label="Access requirements" optional>
                      <FormInput
                        id="storage-access"
                        placeholder="e.g. Regular access or sealed safe storage"
                        value={storageAccessRequirements}
                        onChange={(e) => setStorageAccessRequirements(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <FormField id="storage-items-type" label="Type or quantity of items" optional>
                    <FormInput
                      id="storage-items-type"
                      placeholder="e.g. Boxed household items, furniture from 1 room"
                      value={storageItemsType}
                      onChange={(e) => setStorageItemsType(e.target.value)}
                    />
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* 5. Core Details / Message */}
          <FormField
            id="quote-details"
            label="Details of the job"
            required
            error={fieldErrors.details}
          >
            <FormTextarea
              id="quote-details"
              name="details"
              rows={3}
              placeholder="Tell us what needs doing, any special care required, or questions you have."
              value={details}
              hasError={Boolean(fieldErrors.details)}
              onChange={(e) => {
                setDetails(e.target.value);
                if (fieldErrors.details) setFieldErrors((p) => ({ ...p, details: '' }));
              }}
            />
          </FormField>

          {/* 6. Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl border border-black/15 hover:border-black/30 hover:bg-black/[0.03] text-[#202024] text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <SubmitButton
              isSubmitting={isSubmitting}
              submittingText="Sending Quote Request..."
              variant="dark"
              className="!h-11 !px-6 text-sm"
            >
              Submit Quote Request
            </SubmitButton>
          </div>
        </form>
      )}
    </AccessibleDialog>
  );
};
