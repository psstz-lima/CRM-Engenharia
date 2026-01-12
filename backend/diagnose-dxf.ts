
import DxfParser from 'dxf-parser';
import * as fs from 'fs';
import * as path from 'path';

// Find a DXF file in the ODA output or uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const cacheDir = path.join(uploadsDir, 'cache', 'dwg');
const tempDir = path.join(uploadsDir, 'temp');

// Find any DXF file
function findDxfFile(dir: string): string | null {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.dxf')) {
            return path.join(dir, file);
        }
    }
    return null;
}

// Check uploads folder for DXF
const filesDir = path.join(uploadsDir, 'files');
let dxfPath = findDxfFile(filesDir);
if (!dxfPath) dxfPath = findDxfFile(tempDir);

// If no DXF, look in any subdirectory
if (!dxfPath) {
    const allFiles = fs.readdirSync(filesDir || uploadsDir, { recursive: true });
    for (const file of allFiles) {
        if (typeof file === 'string' && file.endsWith('.dxf')) {
            dxfPath = path.join(filesDir || uploadsDir, file);
            break;
        }
    }
}

if (!dxfPath) {
    console.log('No DXF file found. Please specify a path.');
    console.log('Usage: npx tsx diagnose-dxf.ts <path-to-dxf>');
    process.exit(1);
}

// Use command line arg if provided
if (process.argv[2]) {
    dxfPath = process.argv[2];
}

console.log('Analyzing DXF:', dxfPath);
console.log('File size:', fs.statSync(dxfPath).size, 'bytes');
console.log('');

const content = fs.readFileSync(dxfPath, 'utf-8');
const parser = new DxfParser();

let dxf: any;
try {
    dxf = parser.parseSync(content);
} catch (err) {
    console.error('Parse error:', err);
    process.exit(1);
}

// Count entity types
const entityCounts: Record<string, number> = {};
if (dxf.entities) {
    for (const entity of dxf.entities) {
        entityCounts[entity.type] = (entityCounts[entity.type] || 0) + 1;
    }
}

console.log('=== ENTITY COUNTS ===');
const sorted = Object.entries(entityCounts).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sorted) {
    console.log(`${type}: ${count}`);
}
console.log('');
console.log('Total entities:', dxf.entities?.length || 0);

// Count block entity types
console.log('');
console.log('=== BLOCKS ===');
if (dxf.blocks) {
    for (const [name, block] of Object.entries(dxf.blocks) as any) {
        if (block.entities && block.entities.length > 0) {
            console.log(`Block "${name}": ${block.entities.length} entities`);
        }
    }
}

// Sample a LINE entity
console.log('');
console.log('=== SAMPLE LINE ENTITY ===');
const sampleLine = dxf.entities?.find((e: any) => e.type === 'LINE');
if (sampleLine) {
    console.log(JSON.stringify(sampleLine, null, 2));
}

// Sample LWPOLYLINE
console.log('');
console.log('=== SAMPLE LWPOLYLINE ===');
const samplePoly = dxf.entities?.find((e: any) => e.type === 'LWPOLYLINE');
if (samplePoly) {
    console.log(JSON.stringify(samplePoly, null, 2));
}

// Layers
console.log('');
console.log('=== LAYERS ===');
if (dxf.tables?.layer?.layers) {
    const layerNames = Object.keys(dxf.tables.layer.layers);
    console.log('Total layers:', layerNames.length);
    console.log('First 10:', layerNames.slice(0, 10));
}
