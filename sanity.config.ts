import React from 'react';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemas';
import { Folder, Package, LayoutGrid, Tags, Bookmark, Home, LogIn, Info, Mail } from 'lucide-react';

const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk';
const projectId = rawProjectId.replace(/['"]/g, '');

const rawDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const dataset = rawDataset.replace(/['"]/g, '');
const apiVersion = '2024-01-01';

// Custom, premium brand logo component for Gorer Mart Studio
const CustomStudioLogo = () => (
  React.createElement(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', fontFamily: 'system-ui, sans-serif' } },
    React.createElement(
      'div',
      {
        style: {
          background: '#EAB308',
          color: '#000000',
          fontWeight: 900,
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase'
        }
      },
      'Gorer Mart'
    ),
    React.createElement(
      'span',
      { style: { fontSize: '11px', fontWeight: 'bold', color: '#8E9196', letterSpacing: '0.08em', textTransform: 'uppercase' } },
      'Studio'
    )
  )
);

export default defineConfig({
  name: 'default',
  title: 'Gorer Mart CMS',
  projectId,
  dataset,
  basePath: '/studio',
  studio: {
    components: {
      logo: CustomStudioLogo
    }
  },
  plugins: [
    structureTool({
      structure: (S) => {
        return S.list()
          .title('Gorer Mart Catalog')
          .items([
            // Singleton: Home Page
            S.listItem()
              .title('Home Page')
              .icon(Home)
              .child(
                S.document()
                  .schemaType('homePage')
                  .documentId('homePage')
                  .title('Home Page')
              ),
            // Singleton: About Page
            S.listItem()
              .title('About Page')
              .icon(Info)
              .child(
                S.document()
                  .schemaType('aboutPage')
                  .documentId('aboutPage')
                  .title('About Page')
              ),
            // Singleton: Login Page
            S.listItem()
              .title('Login Page')
              .icon(LogIn)
              .child(
                S.document()
                  .schemaType('loginPage')
                  .documentId('loginPage')
                  .title('Login Page')
              ),
            // Singleton: Contact Page
            S.listItem()
              .title('Contact Page')
              .icon(Mail)
              .child(
                S.document()
                  .schemaType('contactPage')
                  .documentId('contactPage')
                  .title('Contact Page')
              ),
            S.divider(),

            // Group: All Products (with Category folders inside)
            S.listItem()
              .title('All Products')

              .icon(Package)
              .child(
                S.list()
                  .title('Products Manager')
                  .items([
                    // 1. Flat List of All Products
                    S.listItem()
                      .title('All Products (Flat List)')
                      .icon(LayoutGrid)
                      .schemaType('product')
                      .child(S.documentTypeList('product').title('All Products')),
                    
                    S.divider(),

                    // 2. Products By Category
                    S.listItem()
                      .title('Products By Category')
                      .icon(Folder)
                      .child(
                        S.documentTypeList('category')
                          .title('Select Category')
                          .child((categoryId) =>
                            S.documentList()
                              .title('Products in Category')
                              .apiVersion(apiVersion)
                              .filter('_type == "product" && category._ref == $categoryId')
                              .params({ categoryId })
                              .schemaType('product')
                              .initialValueTemplates([
                                S.initialValueTemplateItem('product-with-category', {
                                  categoryId,
                                }),
                              ])
                          )
                      ),
                  ])
              ),
            S.divider(),
            // All Categories (flat list)
            S.listItem()
              .title('All Categories')
              .icon(Tags)
              .schemaType('category')
              .child(S.documentTypeList('category').title('All Categories')),
            S.divider(),
            // All Collections (flat list)
            S.listItem()
              .title('Collections')
              .icon(Bookmark)
              .schemaType('collection')
              .child(S.documentTypeList('collection').title('Collections')),
          ]);
      },
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'product-with-category',
        title: 'Product with Category',
        schemaType: 'product',
        parameters: [{ name: 'categoryId', type: 'string' }],
        value: (params: any) => ({
          category: {
            _type: 'reference',
            _ref: params.categoryId,
          },
        }),
      },
    ],
  },
});
