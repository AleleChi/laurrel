export const homeServicesSchema = {
  name: 'homeServices',
  title: 'Homepage Services Highlight Section',
  type: 'document',
  fields: [
    {
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
      description: 'Small uppercase label at top-left (e.g. OUR SERVICES)',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'headline',
      title: 'Main Headline (H2)',
      type: 'string',
      description: 'Large editorial headline spanning the left column',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'cta',
      title: 'Explore Services CTA',
      type: 'object',
      fields: [
        { name: 'label', title: 'CTA Label', type: 'string', validation: (Rule: any) => Rule.required() },
        { name: 'href', title: 'CTA Destination (e.g. /services)', type: 'string', validation: (Rule: any) => Rule.required() },
      ],
    },
    {
      name: 'services',
      title: 'Service Rows',
      type: 'array',
      description: 'Exactly three services: Cleaning, Moving, Storage',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'id',
              title: 'Service Identifier',
              type: 'string',
              options: {
                list: [
                  { title: 'Cleaning', value: 'cleaning' },
                  { title: 'Moving', value: 'moving' },
                  { title: 'Storage', value: 'storage' },
                ],
              },
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'title',
              title: 'Service Title',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Editorial Description',
              type: 'text',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'anchor',
              title: 'Destination Anchor (e.g. /services#cleaning)',
              type: 'string',
            },
            {
              name: 'illustration',
              title: 'Approved Illustration Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Cleaning Line Art (Spray Bottle & Cloth)', value: 'cleaning' },
                  { title: 'Moving Line Art (Commercial Truck)', value: 'moving' },
                  { title: 'Storage Line Art (Roll-up Unit & Shelving)', value: 'storage' },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
