import fs from 'fs';
import path from 'path';

const filesToDelete = [
  'src/assets/home/hero.webp',
  'src/assets/home/hero_image.webp',
  'src/assets/shop/shop-hero-1.png',
  'src/assets/shop/shop-hero-2.png',
  'src/assets/shop/shop.png',
  'src/components/HomeClient.tsx',
];

console.log("Removing heavy and unused asset files from repository...");
filesToDelete.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log("Deleted:", filePath);
  } else {
    console.log("File already absent:", filePath);
  }
});
console.log("Cleanup complete!");
