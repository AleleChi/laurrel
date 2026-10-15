export const homeOverlappingPlansSchema = {
  name: 'homeOverlappingPlans',
  title: 'Homepage — When Plans Overlap Section',
  type: 'document',
  fields: [
    {
      name: 'eyebrow',
      title: 'Section Eyebrow',
      type: 'string',
      initialValue: 'WHEN PLANS OVERLAP',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'headline',
      title: 'Main Headline',
      type: 'string',
      initialValue: 'When one job depends on another.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'intro',
      title: 'Introductory Copy',
      type: 'text',
      rows: 3,
      initialValue:
        'A final clean may have to wait until the furniture is moved. New keys may arrive days after your move-out date. Renovations can leave you short of space.\n\nTell us what needs doing and how your dates line up.',
    },
    {
      name: 'situations',
      title: 'Overlapping Situations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'id',
              title: 'Situation ID',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'title',
              title: 'Situation Title',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Card Description',
              type: 'text',
              rows: 3,
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'relatedServicesText',
              title: 'Related Services Display Text',
              type: 'string',
              description: 'e.g. "Cleaning and Moving" or "Moving and Storage"',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'preselectedServices',
              title: 'Preselected Services on Quote Click',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'Cleaning', value: 'cleaning' },
                  { title: 'Moving', value: 'moving' },
                  { title: 'Storage', value: 'storage' },
                ],
              },
            },
            {
              name: 'image',
              title: 'Situation Editorial Photograph',
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'alt',
                  title: 'Alternative Text',
                  type: 'string',
                  description: 'Required accessibility description for screen readers.',
                  validation: (Rule: any) => Rule.required(),
                },
              ],
            },
            {
              name: 'details',
              title: 'Modal Details',
              type: 'object',
              fields: [
                {
                  name: 'intro',
                  title: 'Detail Intro',
                  type: 'text',
                  rows: 2,
                },
                {
                  name: 'considerations',
                  title: 'Helpful Details Checklist',
                  type: 'array',
                  of: [{ type: 'string' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
