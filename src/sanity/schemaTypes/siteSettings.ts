export const siteSettingsSchema = {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    },
    {
      name: 'location',
      title: 'Primary Service Location',
      type: 'string',
    },
    {
      name: 'logo',
      title: 'Brand Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'navigation',
      title: 'Navigation Links',
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
