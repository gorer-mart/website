export default {
  name: 'collection',
  title: 'Collections',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Collection Name',
      type: 'string',
      description: 'e.g. Top Picks, New Arrival, Winter Specials',
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
  ],
  preview: {
    select: {
      title: 'name',
    },
    prepare(selection: any) {
      const { title } = selection;
      return {
        title: title || 'Unnamed Collection',
        subtitle: '', // Clears slug/URL from showing in reference selectors
      };
    },
  },
};
