#!/usr/bin/env node
/**
 * MinimaJS Build Script - Creates minified versions
 */

import fs from 'fs';
import path from 'path';

const minify = (content) => content
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/(?![\s]*\*).*$/gm, '')
  .replace(/\s*([{}()[\].,;:!?|=+-/*&|^<>~%])\s*/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\n\s*\n/g, '\n');

// Files to minify
const files = [
  'MinimaJS/lib/minima-core.js',
  'MinimaJS/lib/minima-api.js',
  'MinimaJS/lib/minima-component.js',
  'MinimaJS/lib/minima-template.js',
  'MinimaJS/lib/minima-ssr.js',
  'MinimaJS/lib/minima-llm.js',
  'MinimaJS/lib/minima-devtools.js',
  'MinimaJS/lib/minima-full.js',
  'MinimaJS/src/minima.js'
];

console.log('Building minified versions...\n');

// Ensure dist directory exists
fs.mkdirSync('MinimaJS/dist', { recursive: true });

let totalOriginalSize = 0;
let totalMinifiedSize = 0;

const toKB = (bytes) => Math.round(bytes / 102.4) / 10;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const minified = minify(content);
    
    const basename = path.basename(file, '.js');
    fs.writeFileSync(path.join('MinimaJS/dist', basename + '.min.js'), minified);
    
    const oLen = content.length, mLen = minified.length;
    totalOriginalSize += oLen;
    totalMinifiedSize += mLen;
    
    console.log(`${basename}.min.js: ${toKB(oLen)}KB → ${toKB(mLen)}KB (${Math.round((1 - mLen / oLen) * 100)}% smaller)`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nTotal: ${toKB(totalOriginalSize)}KB → ${toKB(totalMinifiedSize)}KB (${Math.round((1 - totalMinifiedSize / totalOriginalSize) * 100)}% reduction)`);
console.log('Build complete!');
