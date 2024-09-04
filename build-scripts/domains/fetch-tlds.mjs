#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to cache tlds.js file
const tldsFilePath = path.join(__dirname, 'tlds.js');

// Fetch and parse the TLDs from IANA
async function fetchAndParseTLDs() {
  const url = 'https://www.iana.org/domains/root/db';
  console.log('Fetching TLDs from IANA...');

  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const rows = dom.window.document.querySelectorAll('tr');
    const tlds = new Set();

    // Parse each row to extract TLDs
    rows.forEach(row => {
      const tldLink = row.querySelector('.domain.tld a');
      if (tldLink) {
        const nativeTLD = tldLink.textContent.trim(); // Native TLD
        const punycodeTLD = tldLink.getAttribute('href').split('/').pop().replace('.html', ''); // Punycode from href

        if (nativeTLD.startsWith('.')) {
          tlds.add(nativeTLD.slice(1));  // Add the native TLD without the leading dot
        }

        // If the punycode format is different, add it as well
        if (punycodeTLD && punycodeTLD !== nativeTLD.slice(1)) {
          tlds.add(punycodeTLD);
        }
      }
    });

    if (tlds.size === 0) {
      throw new Error('No TLDs found. HTML structure may have changed.');
    }

    // Generate the content for the tlds.js file using ESM syntax
    const tldsArray = Array.from(tlds).map(tld => `'${tld}'`);
    const fileContent = `// Generated TLD list from IANA\nconst tlds = new Set([${tldsArray.join(', ')}]);\nexport default tlds;\n`;

    // Write the tlds.js file
    await writeFile(tldsFilePath, fileContent);
    console.log(`TLDs successfully written to ${tldsFilePath}`);

  } catch (error) {
    console.error('Error fetching or parsing TLDs:', error.message);
  }
}

// Run the function to fetch and parse TLDs
fetchAndParseTLDs();


