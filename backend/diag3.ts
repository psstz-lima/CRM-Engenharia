
import DxfParser from 'dxf-parser';
import * as fs from 'fs';

const dxfPath = process.argv[2];
const content = fs.readFileSync(dxfPath, 'utf-8');
const parser = new DxfParser();
const dxf = parser.parseSync(content);

// Check for INSERT entities
const inserts = (dxf.entities || []).filter((e: any) => e.type === 'INSERT');
console.log('INSERT count:', inserts.length);

if (inserts.length > 0) {
    console.log('\nSample INSERT:', JSON.stringify(inserts[0], null, 2));
}

// Check raw content for INSERT keyword
const insertMatches = content.match(/\n0\nINSERT\n/g);
console.log('\nRaw INSERT occurrences in file:', insertMatches?.length || 0);

// Check if there's VIEWPORT issue
const viewports = (dxf.entities || []).filter((e: any) => e.type === 'VIEWPORT');
console.log('VIEWPORT count:', viewports.length);

// List ALL entity types including less common ones
const allTypes = new Set((dxf.entities || []).map((e: any) => e.type));
console.log('\nAll entity types found:', [...allTypes]);
