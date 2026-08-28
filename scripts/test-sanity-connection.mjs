import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();

const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk').replace(/['"]/g, '');
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').replace(/['"]/g, '');

console.log('--- TESTING SANITY CONNECTION ---');
console.log('Project ID:', projectId);
console.log('Dataset:', dataset);

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function runAudit() {
  try {
    // 1. Fetch document count
    const totalDocs = await client.fetch(`count(*)`);
    console.log(`✅ Connection Successful! Total Documents: ${totalDocs}`);

    // 2. Test document type counts
    const types = await client.fetch(`*[]{ _type }`);
    const counts = types.reduce((acc, d) => {
      acc[d._type] = (acc[d._type] || 0) + 1;
      return acc;
    }, {});
    console.log('✅ Document counts by type:', counts);

    // 3. Test Products Query
    const products = await client.fetch(`*[_type == "product"]{ _id, name, price, "slug": slug.current }`);
    console.log(`✅ Products query fetched ${products.length} products.`);

    // 4. Test Categories Query
    const categories = await client.fetch(`*[_type == "category"]{ _id, name }`);
    console.log(`✅ Categories query fetched ${categories.length} categories.`);

    // 5. Test Singleton Pages
    const homePage = await client.fetch(`*[_type == "homePage"][0]`);
    console.log(`✅ Home page singleton: ${homePage ? 'FOUND' : 'NOT FOUND'}`);

    const aboutPage = await client.fetch(`*[_type == "aboutPage"][0]`);
    console.log(`✅ About page singleton: ${aboutPage ? 'FOUND' : 'NOT FOUND'}`);

    const loginPage = await client.fetch(`*[_type == "loginPage"][0]`);
    console.log(`✅ Login page singleton: ${loginPage ? 'FOUND' : 'NOT FOUND'}`);

    console.log('\n--- SANITY CONNECTION AUDIT COMPLETE: ALL CHECKS PASSED ---');
  } catch (err) {
    console.error('❌ SANITY CONNECTION AUDIT FAILED:', err);
    process.exit(1);
  }
}

runAudit();
