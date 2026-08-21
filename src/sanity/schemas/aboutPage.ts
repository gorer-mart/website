import React from 'react';

export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'ourHeritageImage',
      title: 'Our Heritage Image (Block 1)',
      type: 'image',
      description: 'Upload the image to display in the "Our Heritage" section (Block 1) of the About page.',
      options: {
        hotspot: true,
      },
      components: {
        field: (props: any) => {
          return React.createElement(
            'div',
            { style: { borderTop: '2px solid #EAB308', paddingTop: '28px', marginTop: '16px', marginBottom: '28px' } },
            React.createElement(
              'h2',
              { style: { fontSize: '24px', fontWeight: 900, color: '#000000', marginBottom: '8px', letterSpacing: '-0.02em', textTransform: 'uppercase' } },
              props.title
            ),
            React.createElement(
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
        }
      },
    },
    {
      name: 'ourCommitmentImage',
      title: 'Our Commitment Image (Block 2)',
      type: 'image',
      description: 'Upload the image to display in the "Our Commitment" section (Block 2) of the About page.',
      options: {
        hotspot: true,
      },
      components: {
        field: (props: any) => {
          return React.createElement(
            'div',
            { style: { borderTop: '2px solid #EAB308', paddingTop: '28px', marginTop: '28px', marginBottom: '28px' } },
            React.createElement(
              'h2',
              { style: { fontSize: '24px', fontWeight: 900, color: '#000000', marginBottom: '8px', letterSpacing: '-0.02em', textTransform: 'uppercase' } },
              props.title
            ),
            React.createElement(
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
        }
      },
    },
  ],
  preview: {
    prepare() {
      return {
        title: 'About Page Settings',
      };
    },
  },
};
