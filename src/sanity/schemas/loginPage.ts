import React from 'react';

export default {
  name: 'loginPage',
  title: 'Login Page',
  type: 'document',
  fields: [
    {
      name: 'image',
      title: 'Login Page Display Image',
      type: 'image',
      description: 'Upload the image to display on the left panel of the Login and Sign Up pages.',
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
  ],
  preview: {
    select: {
      media: 'image',
    },
    prepare(selection: any) {
      return {
        title: 'Login Page Image',
        media: selection.media,
      };
    },
  },
};
