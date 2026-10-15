export const contactPageSchema = {
  name: 'contactPage',
  title: 'Contact Page & Location Settings',
  type: 'document',
  fields: [
    // 0. Page Hero Banner Media
    {
      name: 'banner',
      title: 'Hero Banner',
      type: 'object',
      fields: [
        { name: 'title', title: 'Banner Title', type: 'string', initialValue: 'Contact Us' },
        {
          name: 'image',
          title: 'Banner Background Photograph',
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              description: 'Accessible description for screen readers.',
              validation: (Rule: any) => Rule.required(),
            },
          ],
        },
      ],
    },
    // 1. Editorial & Contact Introduction
    {
      name: 'eyebrow',
      title: 'Section Eyebrow',
      type: 'string',
      initialValue: "LET'S TALK",
    },
    {
      name: 'headline',
      title: 'Main Headline',
      type: 'string',
      initialValue: 'Tell us what you need done.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'supportingParagraph',
      title: 'Introductory Copy',
      type: 'text',
      rows: 3,
      initialValue:
        "Need cleaning, moving or storage in Ottawa? Tell us about the job, where it's needed and your preferred date. We'll review your enquiry and respond with the next steps.",
    },

    // 2. Verified Contact Options (Strictly Factual)
    {
      name: 'businessEmail',
      title: 'Verified Business Email',
      type: 'string',
      description:
        'Leave blank until an official Laurrel business email is confirmed and monitored. Do not use personal or placeholder accounts.',
    },
    {
      name: 'businessPhone',
      title: 'Verified Business Phone',
      type: 'string',
      description:
        'Leave blank until an official Laurrel business telephone line is active. Do not invent temporary numbers.',
    },

    // 3. Form Configuration
    {
      name: 'formHeading',
      title: 'Form Heading',
      type: 'string',
      initialValue: 'Send us a message.',
    },
    {
      name: 'formButtonText',
      title: 'Submit Button Label',
      type: 'string',
      initialValue: 'Send Message',
    },

    // 4. Location & Google Maps Configuration (Mode A vs Mode B)
    {
      name: 'hasPublicOffice',
      title: 'Public Office Availability (Mode A)',
      type: 'boolean',
      initialValue: false,
      description:
        'CRITICAL: Leave DISABLED (False) unless Laurrel has a verified, public office address that customers can visit. Mode B (Service-area business) will be used while this is off.',
    },
    {
      name: 'officeAddress',
      title: 'Verified Public Office Address',
      type: 'string',
      description:
        'Exact verified street address (e.g. 123 Elgin Street, Ottawa, ON). Only used if Public Office is enabled.',
      hidden: ({ parent }: any) => !parent?.hasPublicOffice,
    },
    {
      name: 'googleMapsPlaceId',
      title: 'Google Maps Place ID',
      type: 'string',
      description:
        'Optional Google Maps Place ID for precise map pin placement. Only used if Public Office is enabled.',
      hidden: ({ parent }: any) => !parent?.hasPublicOffice,
    },
    {
      name: 'locationHeading',
      title: 'Location Section Heading',
      type: 'string',
      initialValue: 'Ottawa & National Capital Region',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'serviceRegionDescription',
      title: 'General Service-Region Description',
      type: 'text',
      rows: 2,
      initialValue:
        'Centrally coordinating cleaning, moving, and storage arrangements across Ottawa, Ontario and the National Capital Region.',
    },
    {
      name: 'confirmedServiceAreas',
      title: 'Confirmed Service Areas',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Specific confirmed cities or communities (e.g. Ottawa, Kanata, Nepean, Gloucester, Orleans).',
      initialValue: ['Ottawa', 'National Capital Region'],
    },
  ],
};
