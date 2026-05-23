import React from 'react';

export default {
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    {
      name: 'mostPochhonder',
      title: 'Most Pochhonder',
      type: 'array',
      description: 'Add categories and select products from each category to display in the "Most Pochhonder" homepage section.',
      components: {
        field: (props: any) => {
          return React.createElement(
            'div',
            { style: { borderTop: '2px solid #EAB308', paddingTop: '28px', marginTop: '28px' } },
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
      of: [
        {
          type: 'object',
          name: 'categoryShowcase',
          title: 'Category Product Selection',
          fields: [
            {
              name: 'category',
              title: 'Category',
              type: 'reference',
              to: [{ type: 'category' }],
              validation: (rule: any) => rule.required(),
            },
            {
              name: 'products',
              title: 'Products',
              type: 'array',
              description: 'Select products that belong to the chosen category.',
              of: [
                {
                  type: 'reference',
                  to: [{ type: 'product' }],
                  options: {
                    filter: ({ parent }: any) => {
                      if (!parent || !parent.category?._ref) {
                        return {
                          filter: '_type == "product"',
                        };
                      }
                      return {
                        filter: '_type == "product" && category._ref == $categoryId',
                        params: { categoryId: parent.category._ref },
                      };
                    },
                  },
                },
              ],
              validation: (rule: any) => rule.required().min(1),
            },
          ],
          preview: {
            select: {
              categoryName: 'category.name',
              products: 'products',
            },
            prepare(selection: any) {
              const { categoryName, products } = selection;
              const count = products ? products.length : 0;
              return {
                title: categoryName || 'Select Category First',
                subtitle: `${count} Selected Product(s)`,
              };
            },
          },
        },
      ],
    },
    {
      name: 'taatkaDrop',
      title: 'Taatka Drop',
      type: 'array',
      description: 'Add categories and select products from each category to display in the "Taatka Drop" homepage section.',
      components: {
        field: (props: any) => {
          return React.createElement(
            'div',
            { style: { borderTop: '2px solid #EAB308', paddingTop: '28px', marginTop: '28px' } },
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
      of: [
        {
          type: 'object',
          name: 'categoryShowcase',
          title: 'Category Product Selection',
          fields: [
            {
              name: 'category',
              title: 'Category',
              type: 'reference',
              to: [{ type: 'category' }],
              validation: (rule: any) => rule.required(),
            },
            {
              name: 'products',
              title: 'Products',
              type: 'array',
              description: 'Select products that belong to the chosen category.',
              of: [
                {
                  type: 'reference',
                  to: [{ type: 'product' }],
                  options: {
                    filter: ({ parent }: any) => {
                      if (!parent || !parent.category?._ref) {
                        return {
                          filter: '_type == "product"',
                        };
                      }
                      return {
                        filter: '_type == "product" && category._ref == $categoryId',
                        params: { categoryId: parent.category._ref },
                      };
                    },
                  },
                },
              ],
              validation: (rule: any) => rule.required().min(1),
            },
          ],
          preview: {
            select: {
              categoryName: 'category.name',
              products: 'products',
            },
            prepare(selection: any) {
              const { categoryName, products } = selection;
              const count = products ? products.length : 0;
              return {
                title: categoryName || 'Select Category First',
                subtitle: `${count} Selected Product(s)`,
              };
            },
          },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return {
        title: 'Home Page Sections',
      };
    },
  },
};
