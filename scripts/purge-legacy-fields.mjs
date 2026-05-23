import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables from .env
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error('\x1b[31mError: NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN must be configured in your .env file!\x1b[0m');
  process.exit(1);
}

// Get the field name to purge from command line arguments, default to 'tags'
const fieldToPurge = process.argv[2] || 'tags';

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false, // Ensure we write to the live dataset, not the cache
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log(`\n\x1b[36m========== SANITY DATABASE CLEANUP & MIGRATION TOOL ==========\x1b[0m`);
  console.log(`Project ID : \x1b[33m${projectId}\x1b[0m`);
  console.log(`Dataset    : \x1b[33m${dataset}\x1b[0m`);
  console.log(`Field to   : \x1b[31m${fieldToPurge}\x1b[0m (Will be permanently deleted from all products)`);
  console.log(`\x1b[36m==============================================================\x1b[0m\n`);

  try {
    // 1. Query for all product documents that have the specified field defined
    const query = `*[_type == "product" && defined(${fieldToPurge})] {
      _id,
      name,
      ${fieldToPurge}
    }`;
    
    console.log(`Fetching products that contain the legacy field "${fieldToPurge}"...`);
    const products = await client.fetch(query);

    if (products.length === 0) {
      console.log(`\x1b[32mSuccess: No products found containing the active field "${fieldToPurge}"! Your database is already clean.\x1b[0m\n`);
      process.exit(0);
    }

    console.log(`\nFound \x1b[33m${products.length}\x1b[0m product(s) with the active field "${fieldToPurge}":`);
    products.forEach((p, index) => {
      console.log(`  ${index + 1}. \x1b[1m${p.name}\x1b[0m (ID: ${p._id})`);
    });

    // 2. Ask user for confirmation
    rl.question(`\n\x1b[33mAre you sure you want to PERMANENTLY DELETE the "${fieldToPurge}" field from these ${products.length} products? (yes/no): \x1b[0m`, async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n\x1b[35mMigration cancelled. No changes were made.\x1b[0m\n');
        rl.close();
        process.exit(0);
      }

      console.log(`\nStarting migration to purge "${fieldToPurge}"...`);
      
      let successCount = 0;
      let errorCount = 0;

      // 3. Perform patch unsets for each document in a transaction
      for (const product of products) {
        try {
          await client
            .patch(product._id)
            .unset([fieldToPurge])
            .commit();
          
          console.log(`  \x1b[32m✔ Patched and cleaned:\x1b[0m ${product.name}`);
          successCount++;
        } catch (err) {
          console.error(`  \x1b[31m✘ Failed to patch product ${product.name}:\x1b[0m`, err.message);
          errorCount++;
        }
      }

      console.log(`\n\x1b[32m========== MIGRATION SUMMARY ==========\x1b[0m`);
      console.log(`Successfully Purged: \x1b[32m${successCount}\x1b[0m products`);
      console.log(`Failed to Purge    : \x1b[31m${errorCount}\x1b[0m products`);
      console.log(`\x1b[32m=======================================\x1b[0m\n`);
      
      rl.close();
    });

  } catch (error) {
    console.error(`\x1b[31mFatal connection error during query:\x1b[0m`, error.message);
    rl.close();
    process.exit(1);
  }
}

main();
