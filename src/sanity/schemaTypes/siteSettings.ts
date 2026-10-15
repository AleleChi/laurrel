export const siteSettingsSchema = {
  name: 'siteSettings',
  title: 'Global Site Settings & Business Info',
  type: 'document',
  fields: [
    {
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      initialValue: 'LAURREL SERVICES',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      initialValue: 'Clean spaces. Smooth moves. Secure storage.',
    },
    {
      name: 'location',
      title: 'Primary Service Location',
      type: 'string',
      initialValue: 'Ottawa, Ontario',
    },
    {
      name: 'logo',
      title: 'Brand Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          initialValue: 'Laurrel Services Logo',
        },
      ],
    },
    {
      name: 'businessInfo',
      title: 'Verified Business Contact Details',
      type: 'object',
      fields: [
        {
          name: 'phone',
          title: 'Direct Business Phone',
          type: 'string',
          description: 'Official customer enquiry telephone number',
        },
        {
          name: 'email',
          title: 'Direct Business Email',
          type: 'string',
          description: 'Official intake mailbox (e.g. info@laurrelservices.ca)',
        },
        {
          name: 'serviceArea',
          title: 'Service Coverage Description',
          type: 'string',
          initialValue: 'Ottawa & the National Capital Region (NCR)',
        },
        {
          name: 'officeAddress',
          title: 'Business Address (Leave blank if dispatch-only)',
          type: 'string',
        },
      ],
    },
    {
      name: 'footer',
      title: 'Global Website Footer',
      type: 'object',
      fields: [
        {
          name: 'aboutSummary',
          title: 'About Summary Copy',
          type: 'text',
          rows: 3,
          initialValue:
            'Laurrel Services coordinates residential and commercial cleaning, careful moving, and secure storage arrangements across Ottawa and the surrounding National Capital Region.',
        },
        {
          name: 'serviceRegionLabel',
          title: 'Service Region Badge Label',
          type: 'string',
          initialValue: 'Ottawa & NCR',
        },
        {
          name: 'coordinationLabel',
          title: 'Coordination Badge Label',
          type: 'string',
          initialValue: '1 Point of Contact',
        },
        {
          name: 'estimatesLabel',
          title: 'Estimates Badge Action Text',
          type: 'string',
          initialValue: 'Online Request',
        },
        {
          name: 'copyrightNotice',
          title: 'Copyright Notice',
          type: 'string',
          initialValue: '© 2026 Laurrel Services. All rights reserved. Ottawa, Ontario, Canada.',
        },
      ],
    },
    {
      name: 'seo',
      title: 'Global SEO Defaults',
      type: 'object',
      fields: [
        {
          name: 'defaultMetaTitle',
          title: 'Default Browser / Search Title',
          type: 'string',
          initialValue: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
        },
        {
          name: 'defaultMetaDescription',
          title: 'Default Search Description',
          type: 'text',
          rows: 3,
          initialValue:
            'Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.',
        },
        {
          name: 'ogImage',
          title: 'Social Share Image (Open Graph)',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alternative Text', type: 'string' }],
        },
      ],
    },
    {
      name: 'navigation',
      title: 'Header Navigation Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'href', title: 'URL / Path', type: 'string' },
          ],
        },
      ],
    },
  ],
};
