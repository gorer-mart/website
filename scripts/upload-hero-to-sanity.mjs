import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error("SANITY_API_TOKEN is missing in .env file");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

async function main() {
  console.log("Starting upload of Hero Images to Sanity CMS...");

  const desktopImagePath = path.join(process.cwd(), 'src/assets/home/hero_image.webp');
  const mobileImagePath = path.join(process.cwd(), 'src/assets/home/hero-mobile.webp');

  let desktopAsset;
  let mobileAsset;

  if (fs.existsSync(desktopImagePath)) {
    console.log("Uploading Desktop Hero Image (hero_image.webp)...");
    desktopAsset = await client.assets.upload('image', fs.createReadStream(desktopImagePath), {
      filename: 'hero_image.webp'
    });
    console.log("Desktop Hero Image uploaded! Asset ID:", desktopAsset._id);
  } else {
    console.warn("Desktop image file not found at", desktopImagePath);
  }

  if (fs.existsSync(mobileImagePath)) {
    console.log("Uploading Mobile Hero Image (hero-mobile.webp)...");
    mobileAsset = await client.assets.upload('image', fs.createReadStream(mobileImagePath), {
      filename: 'hero-mobile.webp'
    });
    console.log("Mobile Hero Image uploaded! Asset ID:", mobileAsset._id);
  } else {
    console.warn("Mobile image file not found at", mobileImagePath);
  }

  const patchData = {
    hero: {
      desktopImage: desktopAsset ? {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: desktopAsset._id
        }
      } : undefined,
      mobileImages: mobileAsset ? [
        {
          _type: 'image',
          _key: `mobile_hero_${Date.now()}`,
          asset: {
            _type: 'reference',
            _ref: mobileAsset._id
          }
        }
      ] : []
    }
  };

  console.log("Patching 'homePage' document in Sanity CMS...");
  const updatedDoc = await client
    .createIfNotExists({ _id: 'homePage', _type: 'homePage' })
    .then(() => {
      return client.patch('homePage').set(patchData).commit();
    });

  console.log("Successfully updated 'homePage' document in Sanity CMS with Hero images!");
  console.log("Updated document ID:", updatedDoc._id);
}

main().catch((err) => {
  console.error("Failed to upload hero images to Sanity:", err);
  process.exit(1);
});
