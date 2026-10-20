'use client';

import React from 'react';
import { ExternalLink, Navigation } from 'lucide-react';

export interface ContactLocationMapProps {
  hasPublicOffice?: boolean;
  officeAddress?: string;
  googleMapsPlaceId?: string;
  locationHeading?: string;
  serviceRegionDescription?: string;
}

export const ContactLocationMap: React.FC<ContactLocationMapProps> = ({
  hasPublicOffice = false,
  officeAddress,
  googleMapsPlaceId,
  locationHeading = 'Ottawa & National Capital Region',
  serviceRegionDescription = 'Centrally coordinating cleaning, moving, and storage arrangements across Ottawa, Ontario and the National Capital Region.',
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Determine Mode A (verified public office) vs Mode B (service-area business)
  const isModeA = Boolean(hasPublicOffice && officeAddress && officeAddress.trim().length > 0);

  // Generate Google Maps Embed URL
  let embedUrl = '';
  if (isModeA && officeAddress) {
    if (apiKey) {
      embedUrl = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        apiKey
      )}&q=${encodeURIComponent(officeAddress)}${
        googleMapsPlaceId ? `&place_id=${encodeURIComponent(googleMapsPlaceId)}` : ''
      }`;
    } else {
      embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
        officeAddress
      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
  } else {
    // Mode B: Service-area business (Ottawa view, no fake office marker)
    if (apiKey) {
      embedUrl = `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(
        apiKey
      )}&center=45.4215,-75.6972&zoom=12`;
    } else {
      embedUrl = `https://maps.google.com/maps?q=Ottawa%2C+ON%2C+Canada&t=&z=12&ie=UTF8&iwloc=&output=embed`;
    }
  }

  // External action link: Mode A gets directions to office; Mode B opens Ottawa context map
  const externalLinkUrl = isModeA && officeAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeAddress)}`
    : 'https://www.google.com/maps/search/?api=1&query=Ottawa%2C+ON';

  const externalLinkLabel = isModeA && officeAddress
    ? 'Get Directions'
    : 'View Ottawa on Google Maps';

  return (
    <section
      aria-labelledby="contact-location-heading"
      className="w-full max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pb-20 sm:pb-24"
    >
      {/* Restrained Section Header without decorative cards or floating badges */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-[#49056B] mb-2 block">
            SERVICE REGION
          </span>
          <h2
            id="contact-location-heading"
            className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight"
          >
            {locationHeading}
          </h2>
          <p className="text-sm sm:text-base text-[#202024]/75 mt-1.5 max-w-xl leading-relaxed font-normal">
            {serviceRegionDescription}
          </p>
        </div>

        {/* Action Link (Get Directions only for Mode A; Location context for Mode B) */}
        <div className="flex-shrink-0">
          <a
            href={externalLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#18181B] bg-white border border-[#202024]/15 hover:border-[#18181B] hover:text-[#49056B] px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B]"
          >
            {isModeA ? (
              <Navigation className="w-3.5 h-3.5 text-[#49056B] group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 text-[#49056B] group-hover:translate-x-0.5 transition-transform" />
            )}
            <span>{externalLinkLabel}</span>
          </a>
        </div>
      </div>

      {/* Real Interactive Google Map */}
      <div className="w-full h-[320px] sm:h-[390px] lg:h-[460px] rounded-2xl overflow-hidden border border-[#202024]/12 bg-[#EFECE6] shadow-xs relative">
        <iframe
          title={isModeA ? 'Laurrel Services Verified Office Location' : 'Laurrel Services Ottawa Service Area'}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
};
