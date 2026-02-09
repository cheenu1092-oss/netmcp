#!/usr/bin/env node
/**
 * Downloads the IEEE OUI database and converts it to a fast-lookup JSON file.
 * Source: https://standards-oui.ieee.org/oui/oui.txt
 * Run: node scripts/update-oui-db.js
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUI_URL = 'https://standards-oui.ieee.org/oui/oui.txt';
const OUT_PATH = join(__dirname, '..', 'data', 'oui.json');

async function fetchAndParse() {
  console.log(`Fetching OUI database from ${OUI_URL}...`);
  const res = await fetch(OUI_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const text = await res.text();

  const db = {};
  // Each entry looks like:
  // AA-BB-CC   (hex)		Company Name
  // AABBCC     (base 16)		Company Name
  //				Address line 1
  //				City  State  ZIP
  //				Country
  const hexLine = /^([0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2})\s+\(hex\)\s+(.+)$/;
  const base16Line = /^([0-9A-F]{6})\s+\(base 16\)\s+(.+)$/;

  let currentPrefix = null;
  let currentEntry = null;
  const addressLines = [];

  for (const line of text.split('\n')) {
    const hexMatch = line.match(hexLine);
    if (hexMatch) {
      // Save previous entry
      if (currentPrefix && currentEntry) {
        currentEntry.address = addressLines.join(', ').trim();
        db[currentPrefix] = currentEntry;
      }
      currentPrefix = hexMatch[1].replace(/-/g, '').toUpperCase();
      currentEntry = { vendor: hexMatch[2].trim() };
      addressLines.length = 0;
      continue;
    }

    const b16Match = line.match(base16Line);
    if (b16Match) {
      // Skip, same info as hex line
      continue;
    }

    // Address lines (indented with tabs)
    if (currentEntry && line.startsWith('\t\t\t')) {
      const addr = line.trim();
      if (addr) addressLines.push(addr);
    }
  }

  // Save last entry
  if (currentPrefix && currentEntry) {
    currentEntry.address = addressLines.join(', ').trim();
    db[currentPrefix] = currentEntry;
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(db));

  const count = Object.keys(db).length;
  console.log(`✅ Parsed ${count.toLocaleString()} OUI entries → ${OUT_PATH}`);
  return count;
}

fetchAndParse().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
