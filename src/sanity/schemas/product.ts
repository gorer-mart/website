export default {
  name: 'product',
  title: 'Products',
  type: 'document',
  fields: [
    {
      name: 'id',
      title: 'Product ID (Numeric)',
      type: 'number',
      readOnly: true,
      initialValue: () => Math.floor(Date.now() / 1000),
      description: 'Auto-populated numeric ID (e.g. 1779017966) for stable legacy URL routing and indexing.',
      validation: (rule: any) => rule.positive().integer(),
    },
    {
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (rule: any) => rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule: any) => rule.required(),
    },
    {
      name: 'price',
      title: 'Price (INR)',
      type: 'number',
      validation: (rule: any) => rule.required().min(0),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (rule: any) => rule.required(),
    },
    {
      name: 'collections',
      title: 'Collections / Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'collection' }] }],
      description: 'Select one or more collections/tags (e.g. Top Picks, New Arrival) managed in the Collections section.',
    },
    {
      name: 'images',
      title: 'Product Images (Grouped by Color)',
      type: 'array',
      description: 'Add your product images grouped by color. First select the color name, then upload the corresponding images. You can add multiple color groups!',
      of: [
        {
          type: 'object',
          name: 'colorImageGroup',
          title: 'Color Image Group',
          fields: [
            {
              name: 'color',
              title: 'Color Name',
              type: 'string',
              options: {
                list: [
                  { title: 'Black', value: 'Black' },
                  { title: 'White', value: 'White' },
                  { title: 'Gray', value: 'Gray' },
                  { title: 'Maroon', value: 'Maroon' },
                  { title: 'Navy Blue', value: 'Navy Blue' },
                ],
              },
              validation: (rule: any) => rule.required(),
            },
            {
              name: 'images',
              title: 'Images for this Color',
              type: 'array',
              of: [{ type: 'image', options: { hotspot: true } }],
              validation: (rule: any) => rule.required().min(1),
            },
          ],
          preview: {
            select: {
              title: 'color',
              media: 'images.0',
            },
          },
        },
      ],
      validation: (rule: any) => rule.required().min(1),
    },
    {
      name: 'sizes',
      title: 'Available Sizes',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'S', value: 'S' },
          { title: 'M', value: 'M' },
          { title: 'L', value: 'L' },
          { title: 'XL', value: 'XL' },
          { title: 'XXL', value: 'XXL' },
        ],
      },
      initialValue: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Select the available sizes for this product.',
      validation: (rule: any) => rule.required().min(1),
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category.name',
      price: 'price',
      media: 'images.0.images.0',
    },
    prepare(selection: any) {
      const { title, subtitle, price, media } = selection;
      return {
        title: title || 'Unnamed Product',
        subtitle: `${subtitle || 'No Category'} — ₹${price || 0}`,
        media: media,
      };
    },
  },
};
