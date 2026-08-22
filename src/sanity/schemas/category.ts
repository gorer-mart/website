export default {
  name: 'category',
  title: 'Categories',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Category Name',
      type: 'string',
      validation: (rule: any) => rule.required(),
    },
    {
      name: 'image',
      title: 'Category Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule: any) => rule.required(),
    },
    {
      name: 'itemCount',
      title: 'Item Count Display Text',
      type: 'string',
      description: 'e.g., "12 Items" or leave empty for dynamic count',
    },
    {
      name: 'details',
      title: 'Product Details / Specifications',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: [
        '100% Premium Organic Cotton',
        '240+ GSM Heavyweight Fabric',
        'Standard Oversized Drop-Shoulder Fit',
        'High-Density Cultural Graphic Print',
        'Pre-shrunk & Bio-washed',
      ],
      description: 'These specifications will automatically be inherited by all products in this category.',
    },
    {
      name: 'washCare',
      title: 'Wash Care Instructions',
      type: 'text',
      initialValue: 'Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if necessary. For best results and to maintain the longevity of the fabric, we recommend air drying.',
      description: 'The care instructions that will automatically be inherited by all products in this category.',
    },
    {
      name: 'sizeGuideDesktopImages',
      title: 'Size Guide Images — Desktop View',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Upload size guide images for desktop screens (supports 1 or multiple images).',
    },
    {
      name: 'sizeGuideMobileImages',
      title: 'Size Guide Images — Mobile View',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Upload size guide images for mobile screens (supports 1 or multiple images).',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'itemCount',
      media: 'image',
    },
    prepare(selection: any) {
      const { title, subtitle, media } = selection;
      return {
        title: title || 'Unnamed Category',
        subtitle: subtitle ? `${subtitle}` : 'Active Category',
        media: media,
      };
    },
  },
};
