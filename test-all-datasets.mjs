import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk';
const datasets = ['production', 'development', 'staging', 'test', 'dataset'];

async function checkDataset(datasetName) {
  const client = createClient({
    projectId,
    dataset: datasetName,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

  try {
    const query = `*[] {
      _id,
      _type,
      name,
      title
    }`;
    const result = await client.fetch(query);
    console.log(`Dataset [${datasetName}] has ${result.length} documents.`);
    if (result.length > 0) {
      console.log(`Sample document types:`, Array.from(new Set(result.map(d => d._type))));
    }
  } catch (err) {
    console.log(`Failed to fetch from dataset [${datasetName}]:`, err.message);
  }
}

async function run() {
  console.log("Checking project:", projectId);
  for (const ds of datasets) {
    await checkDataset(ds);
  }
}

run();
