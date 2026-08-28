import React from 'react';

const SectionHeaderFieldWrapper = (props: any) => {
  return React.createElement(
    'div',
    { style: { borderTop: '2px solid #EAB308', paddingTop: '28px', marginTop: '16px', marginBottom: '28px' } },
    props.title && React.createElement(
      'h2',
      { style: { fontSize: '24px', fontWeight: 900, color: '#000000', marginBottom: '8px', letterSpacing: '-0.02em', textTransform: 'uppercase' } },
      props.title
    ),
    props.description && React.createElement(
      'p',
      { style: { fontSize: '13px', color: '#666666', marginBottom: '20px', lineHeight: '1.4' } },
      props.description
    ),
    props.renderDefault({
      ...props,
      title: '',
      description: ''
    })
  );
};

export default {
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  fields: [
    {
      name: 'backgroundImage',
      title: 'Contact Page Background Image',
      type: 'image',
      description: 'Upload the background image to display behind the Contact Us section.',
      options: {
        hotspot: true,
      },
      components: {
        field: SectionHeaderFieldWrapper,
      },
    },
  ],
  preview: {
    select: {
      media: 'backgroundImage',
    },
    prepare(selection: any) {
      return {
        title: 'Contact Page Background Image',
        media: selection.media,
      };
    },
  },
};
