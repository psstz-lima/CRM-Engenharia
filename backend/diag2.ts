
import DxfParser from 'dxf-parser';
import * as fs from 'fs';

const dxfPath = process.argv[2];
if (!dxfPath) {
    console.log('Usage: npx tsx diag2.ts <path-to-dxf>');
    process.exit(1);
}

console.log('Analyzing:', dxfPath);
console.log('Size:', fs.statSync(dxfPath).size, 'bytes');

const content = fs.readFileSync(dxfPath, 'utf-8');
const parser = new DxfParser();
const dxf = parser.parseSync(content);

// Count entity types
const counts: Record<string, number> = {};
for (const e of dxf.entities || []) {
    counts[e.type] = (counts[e.type] || 0) + 1;
}

console.log('\n=== ENTITY COUNTS ===');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => console.log(`${t}: ${c}`));
console.log('\nTotal:', dxf.entities?.length || 0);

// Sample first LINE
const line = dxf.entities?.find((e: any) => e.type === 'LINE');
if (line) console.log('\n=== SAMPLE LINE ===\n', JSON.stringify(line, null, 2));

// Sample first LWPOLYLINE
const poly = dxf.entities?.find((e: any) => e.type === 'LWPOLYLINE');
if (poly) console.log('\n=== SAMPLE LWPOLYLINE ===\n', JSON.stringify(poly, null, 2));

// Blocks count
console.log('\n=== BLOCKS ===');
Object.entries(dxf.blocks || {}).forEach(([name, b]: any) => {
    if (b.entities?.length) console.log(`${name}: ${b.entities.length}`);
});
