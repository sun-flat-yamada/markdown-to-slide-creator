import fs from 'node:fs';
import path from 'path';

const htmlPath = path.resolve('examples/verification-layout.html');

if (!fs.existsSync(htmlPath)) {
  console.error('❌ HTML file not found:', htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf-8');

// Simple regex to find <section> blocks
const sectionRegex = /<section[\s\S]*?<\/section>/g;
const sections = html.match(sectionRegex) || [];

console.log(`Found ${sections.length} slides.`);

let foundLayoutSlide = false;
let success = false;

for (const section of sections) {
  // Check if this is our layout slide
  if (section.includes('cols-2')) {
    foundLayoutSlide = true;
    console.log('Found cols-2 slide.');

    // Check if it contains both columns
    const hasLeft = section.includes('Left Column');
    const hasRight = section.includes('Right Column');

    if (hasLeft && hasRight) {
      console.log('✅ Success: Both columns are in the same slide.');
      success = true;
    } else {
      console.error('❌ Failure: Columns are missing or split.');
      if (hasLeft) console.log('  - Has Left Column');
      if (hasRight) console.log('  - Has Right Column');
    }
  }
}

if (!foundLayoutSlide) {
  console.error('❌ Failure: Could not find the layout slide (checks for "cols-2" class).');
  // It might be that Marp renders class as class="marpit-..." or similar,
  // but usually <!-- _class: cols-2 --> becomes <section class="cols-2 ...">
}

if (success) {
  process.exit(0);
} else {
  process.exit(1);
}
