#!/usr/bin/env node
/**
 * MinimaJS Build Script - Creates minified versions
 */

import fs from 'fs';
import path from 'path';

function minify(content) {
  // Single-pass minification with combined operations
  return content
    // Remove block comments (preserve line comments for source maps)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove line comments but preserve JSDoc-style comments
    .replace(/\/\/(?![\s]*\*).*$/gm, '')
    // Multi-pass whitespace optimization
    .replace(/\s*([{}()[\].,;:!?|=+-/*&|^<>~%])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    // Remove trailing whitespace
    .trim()
    // Remove empty lines
    .replace(/\n\s*\n/g, '\n');
}

// Files to minify
const files = [
  'lib/minima-core.js',
  'lib/minima-api.js',
  'lib/minima-component.js',
  'lib/minima-template.js',
  'lib/minima-ssr.js',
  'lib/minima-llm.js',
  'lib/minima-devtools.js',
  'src/minima.js'
];

console.log('Building minified versions...\n');

// Ensure dist directory exists
fs.mkdirSync('dist', { recursive: true });

let totalOriginalSize = 0;
let totalMinifiedSize = 0;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const minified = minify(content);
    
    const basename = path.basename(file, '.js');
    const outputFile = path.join('dist', basename + '.min.js');
    
    fs.writeFileSync(outputFile, minified);
    
    const originalKB = Math.round(content.length / 1024 * 10) / 10;
    const minifiedKB = Math.round(minified.length / 1024 * 10) / 10;
    const savings = Math.round((1 - minified.length / content.length) * 100);
    
    totalOriginalSize += content.length;
    totalMinifiedSize += minified.length;
    
    console.log(`${basename}.min.js: ${originalKB}KB → ${minifiedKB}KB (${savings}% smaller)`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

const totalOriginalKB = Math.round(totalOriginalSize / 1024 * 10) / 10;
const totalMinifiedKB = Math.round(totalMinifiedSize / 1024 * 10) / 10;
const totalSavings = Math.round((1 - totalMinifiedSize / totalOriginalSize) * 100);

console.log(`\nTotal: ${totalOriginalKB}KB → ${totalMinifiedKB}KB (${totalSavings}% reduction)`);
console.log('Build complete!');
