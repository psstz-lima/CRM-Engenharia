import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import DxfParser from 'dxf-parser';
import prisma from '../config/database';

interface LayerInfo {
    name: string;
    color: string;
    visible: boolean;
    lineType: string;
}

interface ConversionResult {
    success: boolean;
    svgPath?: string;
    thumbnailPath?: string;
    layers?: LayerInfo[];
    error?: string;
}

class DWGService {
    private cacheDir: string;
    private tempDir: string;
    private odaConverterPath: string | null = null;

    constructor() {
        this.cacheDir = path.join(process.cwd(), 'uploads', 'cache', 'dwg');
        this.tempDir = path.join(process.cwd(), 'uploads', 'temp');
        this.ensureDirectories();
        this.findOdaConverter();
    }

    private async findOdaConverter() {
        const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        const odaBaseDir = path.join(programFiles, 'ODA');

        try {
            if (fs.existsSync(odaBaseDir)) {
                const dirs = fs.readdirSync(odaBaseDir);
                for (const dir of dirs) {
                    if (dir.startsWith('ODAFileConverter')) {
                        const exePath = path.join(odaBaseDir, dir, 'ODAFileConverter.exe');
                        if (fs.existsSync(exePath)) {
                            console.log('ODA File Converter encontrado:', exePath);
                            this.odaConverterPath = exePath;
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao procurar ODA File Converter:', error);
        }
    }

    private ensureDirectories() {
        [this.cacheDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Converte DWG/DXF para SVG
     * Usa abordagem híbrida: tenta LibreDWG, fallback para parser DXF nativo
     */
    async convertToSvg(filePath: string, documentId: string): Promise<ConversionResult> {
        try {
            fs.appendFileSync('dwg-debug.log', `\n--- ${new Date().toISOString()} ---\nID: ${documentId}\nPath: ${filePath}\nExists: ${fs.existsSync(filePath)}\n`);
        } catch (e) { console.error(e); }

        console.log('Iniciando conversão DWG/DXF:', documentId);
        const cachedSvg = path.join(this.cacheDir, `${documentId}.svg`);

        // Verificar cache
        if (fs.existsSync(cachedSvg)) {
            const layers = await this.extractLayersFromSvg(cachedSvg);
            return { success: true, svgPath: cachedSvg, layers };
        }

        const ext = path.extname(filePath).toLowerCase();

        try {
            if (ext === '.dxf') {
                // DXF pode ser processado diretamente
                return await this.convertDxfToSvg(filePath, cachedSvg, documentId);
            } else if (ext === '.dwg') {
                // Tentar converter DWG para DXF primeiro, depois para SVG
                return await this.convertDwgToSvg(filePath, cachedSvg, documentId);
            } else {
                return { success: false, error: 'Formato não suportado' };
            }
        } catch (error: any) {
            console.error('Erro na conversão:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Converte DXF diretamente para SVG usando parser nativo
     */
    private async convertDxfToSvg(dxfPath: string, outputPath: string, documentId: string): Promise<ConversionResult> {
        const dxfContent = fs.readFileSync(dxfPath, 'utf-8');
        const { svg, layers } = this.parseDxfToSvg(dxfContent);

        fs.writeFileSync(outputPath, svg);

        // Gerar thumbnail
        const thumbnailPath = await this.generateThumbnail(outputPath, documentId);

        return {
            success: true,
            svgPath: outputPath,
            thumbnailPath,
            layers
        };
    }

    /**
     * Converte DWG para SVG (requer LibreDWG ou ODA instalado)
     * Fallback para representação simplificada se não disponível
     */
    private async convertDwgToSvg(dwgPath: string, outputPath: string, documentId: string): Promise<ConversionResult> {
        // Tentar usar ODA File Converter primeiro
        if (this.odaConverterPath) {
            try {
                return await this.convertDwgToDxfWithOda(dwgPath, outputPath, documentId);
            } catch (error) {
                console.error('Erro na conversão ODA:', error);
                // Fallback to LibreDWG
            }
        }

        // Tentar usar dwg2dxf (LibreDWG) segundo
        const dxfPath = path.join(this.tempDir, `${documentId}.dxf`);

        try {
            // Tenta converter DWG para DXF usando LibreDWG
            await this.runCommand('dwg2dxf', [dwgPath, '-o', dxfPath]);

            // Se sucesso, converter DXF para SVG
            return await this.convertDxfToSvg(dxfPath, outputPath, documentId);
        } catch {
            // Fallback: criar SVG placeholder
            console.log('LibreDWG não disponível, usando visualização simplificada');
            return this.createPlaceholderSvg(outputPath, documentId);
        }
    }

    private async convertDwgToDxfWithOda(dwgPath: string, outputPath: string, documentId: string): Promise<ConversionResult> {
        // ODA requer pastas de entrada e saída
        const jobId = Math.random().toString(36).substring(7);
        const inputDir = path.join(this.tempDir, `oda_in_${jobId}`);
        const outputDir = path.join(this.tempDir, `oda_out_${jobId}`);

        fs.mkdirSync(inputDir, { recursive: true });
        fs.mkdirSync(outputDir, { recursive: true });

        try {
            // Copiar arquivo para input
            const inputFilename = path.basename(dwgPath);
            const tempInputPath = path.join(inputDir, inputFilename);
            fs.copyFileSync(dwgPath, tempInputPath);

            // Executar ODA
            // "Input Folder" "Output Folder" "Output Version" "Output Type" "Recurse" "Audit"
            // Usando ACAD2010 para melhor compatibilidade com Civil3D
            if (this.odaConverterPath) {
                await this.runCommand(this.odaConverterPath, [
                    inputDir,
                    outputDir,
                    "ACAD2010",
                    "DXF",
                    "0",
                    "1"  // Audit enabled to fix potential issues
                ]);
            }

            // Encontrar arquivo DXF gerado
            const files = fs.readdirSync(outputDir);
            const dxfFile = files.find(f => f.toLowerCase().endsWith('.dxf'));

            if (dxfFile) {
                const dxfPath = path.join(outputDir, dxfFile);
                return await this.convertDxfToSvg(dxfPath, outputPath, documentId);
            } else {
                throw new Error('ODA não gerou arquivo DXF');
            }

        } finally {
            // Cleanup
            try {
                fs.rmSync(inputDir, { recursive: true, force: true });
                fs.rmSync(outputDir, { recursive: true, force: true });
            } catch (e) {
                console.error('Erro cleaning up ODA temp dirs:', e);
            }
        }
    }

    /**
     * Parser DXF para SVG usando biblioteca dxf-parser
     */
    private parseDxfToSvg(dxfContent: string): { svg: string; layers: LayerInfo[] } {
        const parser = new DxfParser();
        let dxf: any;

        try {
            dxf = parser.parseSync(dxfContent);
        } catch (err) {
            console.error('Erro ao parsear DXF:', err);
            return { svg: this.createEmptySvg(), layers: [] };
        }

        // Extrair layers
        const layers: LayerInfo[] = [];
        if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
            for (const [name, layer] of Object.entries(dxf.tables.layer.layers) as any[]) {
                layers.push({
                    name,
                    color: this.aciToHex(layer.color || 7),
                    visible: true,
                    lineType: layer.lineType || 'CONTINUOUS'
                });
            }
        }

        // Processar entidades
        const svgElements: string[] = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        const updateBounds = (x: number, y: number) => {
            if (isFinite(x) && isFinite(y)) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        };

        // Create layer color map for color resolution
        const layerColors: Record<string, string> = {};
        for (const layer of layers) {
            layerColors[layer.name] = layer.color;
        }

        if (dxf.entities) {
            for (const entity of dxf.entities) {
                const result = this.entityToSvgNew(entity, dxf.blocks || {}, updateBounds, layerColors);
                if (result) {
                    svgElements.push(result);
                }
            }
        }

        // Garantir bounds válidos
        if (!isFinite(minX) || minX === maxX) {
            minX = 0; minY = 0; maxX = 1000; maxY = 1000;
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = Math.max(width, height) * 0.05;

        // Gerar SVG
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="${minX - padding} ${-(maxY + padding)} ${width + padding * 2} ${height + padding * 2}"
     width="100%" 
     height="100%"
     preserveAspectRatio="xMidYMid meet"
     class="dwg-viewer-svg">
    <defs>
        <style>
            .dwg-layer { stroke-linecap: round; stroke-linejoin: round; fill: none; }
            .dwg-text { font-family: 'Arial', sans-serif; }
        </style>
    </defs>
    <g transform="scale(1, -1)" class="dwg-content">
        ${svgElements.join('\n        ')}
    </g>
</svg>`;

        try { fs.appendFileSync('dwg-debug.log', `SVG generated with ${svgElements.length} elements\n`); } catch { }
        return { svg, layers };
    }

    private createEmptySvg(): string {
        return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>`;
    }

    private entityToSvgNew(entity: any, blocks: any, updateBounds: (x: number, y: number) => void, layerColors: Record<string, string> = {}): string | null {
        const layer = entity.layer || '0';
        // Resolve color: entity color, or layer color, or default white
        let color = '#FFFFFF';
        if (entity.colorIndex && entity.colorIndex !== 256) { // 256 = ByLayer
            color = this.aciToHex(entity.colorIndex);
        } else if (entity.color && entity.color !== 256) {
            color = this.aciToHex(entity.color);
        } else if (layerColors[layer]) {
            color = layerColors[layer];
        } else {
            color = this.aciToHex(7); // Default white
        }

        switch (entity.type) {
            case 'LINE': {
                // dxf-parser uses startPoint and endPoint for LINE
                const x1 = entity.startPoint?.x ?? entity.vertices?.[0]?.x ?? 0;
                const y1 = entity.startPoint?.y ?? entity.vertices?.[0]?.y ?? 0;
                const x2 = entity.endPoint?.x ?? entity.vertices?.[1]?.x ?? 0;
                const y2 = entity.endPoint?.y ?? entity.vertices?.[1]?.y ?? 0;
                updateBounds(x1, y1);
                updateBounds(x2, y2);
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'CIRCLE': {
                const cx = entity.center?.x || 0;
                const cy = entity.center?.y || 0;
                const r = entity.radius || 1;
                updateBounds(cx - r, cy - r);
                updateBounds(cx + r, cy + r);
                return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'ARC': {
                const cx = entity.center?.x || 0;
                const cy = entity.center?.y || 0;
                const r = entity.radius || 1;
                const startAngle = (entity.startAngle || 0) * Math.PI / 180;
                const endAngle = (entity.endAngle || 360) * Math.PI / 180;

                const x1 = cx + r * Math.cos(startAngle);
                const y1 = cy + r * Math.sin(startAngle);
                const x2 = cx + r * Math.cos(endAngle);
                const y2 = cy + r * Math.sin(endAngle);
                const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

                updateBounds(cx - r, cy - r);
                updateBounds(cx + r, cy + r);
                return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'LWPOLYLINE':
            case 'POLYLINE': {
                if (!entity.vertices || entity.vertices.length === 0) return null;
                const points = entity.vertices.map((v: any) => {
                    updateBounds(v.x, v.y);
                    return `${v.x},${v.y}`;
                }).join(' ');
                const closed = entity.shape;
                return `<polyline points="${points}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"${closed ? ' fill="none"' : ''}/>`;
            }
            case 'SPLINE': {
                if (!entity.controlPoints || entity.controlPoints.length < 2) return null;
                let d = `M ${entity.controlPoints[0].x} ${entity.controlPoints[0].y}`;
                for (let i = 1; i < entity.controlPoints.length; i++) {
                    const pt = entity.controlPoints[i];
                    updateBounds(pt.x, pt.y);
                    d += ` L ${pt.x} ${pt.y}`;
                }
                updateBounds(entity.controlPoints[0].x, entity.controlPoints[0].y);
                return `<path d="${d}" stroke="${color}" stroke-width="0.5" fill="none" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'TEXT':
            case 'MTEXT': {
                const x = entity.startPoint?.x || entity.position?.x || 0;
                const y = entity.startPoint?.y || entity.position?.y || 0;
                const height = entity.textHeight || entity.height || 2.5;
                const text = entity.text || '';
                updateBounds(x, y);
                return `<text x="${x}" y="${-y}" font-size="${height}" fill="${color}" class="dwg-text dwg-layer" data-layer="${layer}" transform="scale(1,-1)">${this.escapeXml(text)}</text>`;
            }
            case 'INSERT': {
                // Blocks - inserir bloco referenciado
                const blockName = entity.name;
                const block = blocks[blockName];
                if (!block || !block.entities) return null;

                const insertX = entity.position?.x || 0;
                const insertY = entity.position?.y || 0;
                const scaleX = entity.xScale || 1;
                const scaleY = entity.yScale || 1;
                const rotation = entity.rotation || 0;

                const blockElements: string[] = [];
                for (const blockEntity of block.entities) {
                    const el = this.entityToSvgNew(blockEntity, blocks, updateBounds, layerColors);
                    if (el) blockElements.push(el);
                }

                if (blockElements.length === 0) return null;
                return `<g transform="translate(${insertX},${insertY}) scale(${scaleX},${scaleY}) rotate(${rotation})" data-block="${blockName}" data-layer="${layer}">${blockElements.join('')}</g>`;
            }
            case 'ELLIPSE': {
                const cx = entity.center?.x || 0;
                const cy = entity.center?.y || 0;
                const rx = Math.sqrt((entity.majorAxisEndPoint?.x || 1) ** 2 + (entity.majorAxisEndPoint?.y || 0) ** 2);
                const ry = rx * (entity.axisRatio || 1);
                updateBounds(cx - rx, cy - ry);
                updateBounds(cx + rx, cy + ry);
                return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'SOLID':
            case 'HATCH': {
                // Simplificado - apenas desenhar contorno se tiver boundary
                if (entity.boundary && entity.boundary.length > 0) {
                    const points = entity.boundary.map((v: any) => {
                        updateBounds(v.x, v.y);
                        return `${v.x},${v.y}`;
                    }).join(' ');
                    return `<polygon points="${points}" stroke="${color}" stroke-width="0.5" fill="${color}" fill-opacity="0.3" class="dwg-layer" data-layer="${layer}"/>`;
                }
                return null;
            }
            case 'POINT': {
                const x = entity.position?.x || 0;
                const y = entity.position?.y || 0;
                updateBounds(x, y);
                return `<circle cx="${x}" cy="${y}" r="0.5" fill="${color}" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'DIMENSION': {
                // Dimensões - desenhar linhas de extensão e texto
                const defPoint = entity.anchorPoint || entity.definitionPoint || { x: 0, y: 0 };
                const textMidpoint = entity.middleOfText || defPoint;
                const text = entity.text || '';
                updateBounds(defPoint.x, defPoint.y);
                updateBounds(textMidpoint.x, textMidpoint.y);
                return `<g class="dwg-layer" data-layer="${layer}">
                    <text x="${textMidpoint.x}" y="${-textMidpoint.y}" font-size="2" fill="${color}" class="dwg-text" transform="scale(1,-1)">${this.escapeXml(text)}</text>
                </g>`;
            }
            case '3DFACE':
            case 'SOLID': {
                // 3D Face / Solid - desenhar como polígono
                const corners = [
                    entity.corner1 || entity.firstCorner,
                    entity.corner2 || entity.secondCorner,
                    entity.corner3 || entity.thirdCorner,
                    entity.corner4 || entity.fourthCorner
                ].filter(c => c);
                if (corners.length < 3) return null;
                const points = corners.map((c: any) => {
                    updateBounds(c.x, c.y);
                    return `${c.x},${c.y}`;
                }).join(' ');
                return `<polygon points="${points}" stroke="${color}" stroke-width="0.5" fill="${color}" fill-opacity="0.1" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'LEADER': {
                // Leader - linha com seta
                if (!entity.vertices || entity.vertices.length < 2) return null;
                let path = `M ${entity.vertices[0].x} ${entity.vertices[0].y}`;
                for (let i = 1; i < entity.vertices.length; i++) {
                    const v = entity.vertices[i];
                    updateBounds(v.x, v.y);
                    path += ` L ${v.x} ${v.y}`;
                }
                updateBounds(entity.vertices[0].x, entity.vertices[0].y);
                return `<path d="${path}" stroke="${color}" stroke-width="0.5" fill="none" class="dwg-layer" data-layer="${layer}"/>`;
            }
            case 'ATTRIB':
            case 'ATTDEF': {
                // Atributos - tratar como texto
                const x = entity.startPoint?.x || entity.position?.x || 0;
                const y = entity.startPoint?.y || entity.position?.y || 0;
                const height = entity.textHeight || entity.height || 2.5;
                const text = entity.text || entity.tag || '';
                if (!text) return null;
                updateBounds(x, y);
                return `<text x="${x}" y="${-y}" font-size="${height}" fill="${color}" class="dwg-text dwg-layer" data-layer="${layer}" transform="scale(1,-1)">${this.escapeXml(text)}</text>`;
            }
            default:
                // Log unrecognized entity types for debugging
                try { fs.appendFileSync('dwg-debug.log', `Unrecognized entity type: ${entity.type}\n`); } catch { }
                return null;
        }
    }

    /**
     * Parse seções do DXF
     */
    /**
     * Parse seções do DXF
     */
    private parseDxfSections(content: string): Record<string, string> {
        try { fs.appendFileSync('dwg-debug.log', `parseDxfSections input size: ${content.length}\n`); } catch { }
        const sections: Record<string, string> = {};
        // Regex ajustado para tolerar espaços antes dos códigos
        const sectionRegex = /\s*0\r?\nSECTION\r?\n\s*2\r?\n(\w+)\r?\n([\s\S]*?)\s*0\r?\nENDSEC/g;

        let match;
        while ((match = sectionRegex.exec(content)) !== null) {
            sections[match[1]] = match[2];
        }

        try { fs.appendFileSync('dwg-debug.log', `Sections found: ${Object.keys(sections).join(', ')}\n`); } catch { }
        return sections;
    }

    /**
     * Extrair layers do DXF
     */
    /**
     * Extrair layers do DXF
     */
    private extractLayers(tablesSection: string): LayerInfo[] {
        try { fs.appendFileSync('dwg-debug.log', `extractLayers input length: ${tablesSection.length}\n`); } catch { }
        const layers: LayerInfo[] = [];
        // Regex ajustado para tolerar espaços
        const layerRegex = /\s*0\r?\nLAYER\r?\n([\s\S]*?)(?=\s*0\r?\n(?:LAYER|ENDTAB))/g;

        let match;
        while ((match = layerRegex.exec(tablesSection)) !== null) {
            const layerData = match[1];
            // Regex ajustado
            const nameMatch = layerData.match(/\s*2\r?\n(.+?)(?:\r?\n|$)/);
            const colorMatch = layerData.match(/\s*62\r?\n(\d+)/);

            if (nameMatch) {
                const colorIndex = colorMatch ? parseInt(colorMatch[1]) : 7;
                layers.push({
                    name: nameMatch[1].trim(),
                    color: this.aciToHex(colorIndex),
                    visible: true,
                    lineType: 'CONTINUOUS'
                });
            }
        }

        try { fs.appendFileSync('dwg-debug.log', `Layers extracted: ${layers.length}\n`); } catch { }
        return layers;
    }

    /**
     * Parse entidades do DXF
     */
    private parseEntities(entitiesSection: string): any[] {
        const entities: any[] = [];
        const lines = entitiesSection.split(/\r?\n/);

        let currentEntity: any = null;
        let currentCode = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (i % 2 === 0) {
                // Código do grupo
                currentCode = parseInt(line);
            } else {
                // Valor
                if (currentCode === 0) {
                    // Novo tipo de entidade
                    if (currentEntity) {
                        entities.push(currentEntity);
                    }
                    currentEntity = { type: line, data: {} };
                } else if (currentEntity) {
                    // Adicionar dado à entidade atual
                    if (!currentEntity.data[currentCode]) {
                        currentEntity.data[currentCode] = line;
                    } else if (Array.isArray(currentEntity.data[currentCode])) {
                        currentEntity.data[currentCode].push(line);
                    } else {
                        currentEntity.data[currentCode] = [currentEntity.data[currentCode], line];
                    }
                }
            }
        }

        if (currentEntity) {
            entities.push(currentEntity);
        }

        return entities;
    }

    /**
     * Converter entidade DXF para SVG
     */
    private entityToSvg(entity: any): { svg: string | null; bounds: any } {
        const layer = entity.data[8] || '0';
        const color = this.aciToHex(parseInt(entity.data[62]) || 7);

        switch (entity.type) {
            case 'LINE':
                return this.lineToSvg(entity.data, layer, color);
            case 'CIRCLE':
                return this.circleToSvg(entity.data, layer, color);
            case 'ARC':
                return this.arcToSvg(entity.data, layer, color);
            case 'POLYLINE':
            case 'LWPOLYLINE':
                return this.polylineToSvg(entity.data, layer, color);
            case 'TEXT':
            case 'MTEXT':
                return this.textToSvg(entity.data, layer, color);
            case 'ELLIPSE':
                return this.ellipseToSvg(entity.data, layer, color);
            default:
                return { svg: null, bounds: null };
        }
    }

    private lineToSvg(data: any, layer: string, color: string): { svg: string; bounds: any } {
        const x1 = parseFloat(data[10]) || 0;
        const y1 = parseFloat(data[20]) || 0;
        const x2 = parseFloat(data[11]) || 0;
        const y2 = parseFloat(data[21]) || 0;

        return {
            svg: `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`,
            bounds: { minX: Math.min(x1, x2), minY: Math.min(y1, y2), maxX: Math.max(x1, x2), maxY: Math.max(y1, y2) }
        };
    }

    private circleToSvg(data: any, layer: string, color: string): { svg: string; bounds: any } {
        const cx = parseFloat(data[10]) || 0;
        const cy = parseFloat(data[20]) || 0;
        const r = parseFloat(data[40]) || 1;

        return {
            svg: `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`,
            bounds: { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r }
        };
    }

    private arcToSvg(data: any, layer: string, color: string): { svg: string; bounds: any } {
        const cx = parseFloat(data[10]) || 0;
        const cy = parseFloat(data[20]) || 0;
        const r = parseFloat(data[40]) || 1;
        const startAngle = (parseFloat(data[50]) || 0) * Math.PI / 180;
        const endAngle = (parseFloat(data[51]) || 360) * Math.PI / 180;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

        return {
            svg: `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`,
            bounds: { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r }
        };
    }

    private polylineToSvg(data: any, layer: string, color: string): { svg: string; bounds: any } {
        // LWPOLYLINE usa arrays de coordenadas
        const xs = Array.isArray(data[10]) ? data[10] : [data[10]];
        const ys = Array.isArray(data[20]) ? data[20] : [data[20]];

        if (!xs.length || xs[0] === undefined) {
            return { svg: '', bounds: null };
        }

        const points: string[] = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (let i = 0; i < xs.length; i++) {
            const x = parseFloat(xs[i]) || 0;
            const y = parseFloat(ys[i]) || 0;
            points.push(`${x},${y}`);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }

        const closed = data[70] === '1';

        return {
            svg: `<polyline points="${points.join(' ')}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"${closed ? ' fill="none"' : ''}/>`,
            bounds: { minX, minY, maxX, maxY }
        };
    }

    private textToSvg(data: any, layer: string, color: string): { svg: string; bounds: any } {
        const x = parseFloat(data[10]) || 0;
        const y = parseFloat(data[20]) || 0;
        const height = parseFloat(data[40]) || 2.5;
        const text = data[1] || '';
        const rotation = parseFloat(data[50]) || 0;

        return {
            svg: `<text x="${x}" y="${-y}" font-size="${height}" fill="${color}" class="dwg-text dwg-layer" data-layer="${layer}" transform="rotate(${-rotation} ${x} ${-y})">${this.escapeXml(text)}</text>`,
            bounds: { minX: x, minY: y, maxX: x + text.length * height * 0.6, maxY: y + height }
        };
    }

    private ellipseToSvg(data: any, layer: string, color: string): { svg: string; bounds: any } {
        const cx = parseFloat(data[10]) || 0;
        const cy = parseFloat(data[20]) || 0;
        const rx = parseFloat(data[11]) || 1;
        const ry = parseFloat(data[21]) || 1;
        const ratio = parseFloat(data[40]) || 1;

        return {
            svg: `<ellipse cx="${cx}" cy="${cy}" rx="${Math.abs(rx)}" ry="${Math.abs(ry) * ratio}" stroke="${color}" stroke-width="0.5" class="dwg-layer" data-layer="${layer}"/>`,
            bounds: { minX: cx - rx, minY: cy - ry * ratio, maxX: cx + rx, maxY: cy + ry * ratio }
        };
    }

    /**
     * Consolidar entidades VERTEX em suas POLYLINES pais
     */
    private consolidatePolylines(entities: any[]): any[] {
        const result: any[] = [];
        let currentPolyline: any = null;

        for (const entity of entities) {
            if (entity.type === 'POLYLINE' && (entity.data[66] === '1' || entity.data[66] === 1)) {
                currentPolyline = entity;
                // Garantir que são arrays
                if (!currentPolyline.data[10]) currentPolyline.data[10] = [];
                else if (!Array.isArray(currentPolyline.data[10])) currentPolyline.data[10] = [currentPolyline.data[10]];

                if (!currentPolyline.data[20]) currentPolyline.data[20] = [];
                else if (!Array.isArray(currentPolyline.data[20])) currentPolyline.data[20] = [currentPolyline.data[20]];

                result.push(currentPolyline);
            } else if (entity.type === 'VERTEX') {
                if (currentPolyline) {
                    if (entity.data[10]) currentPolyline.data[10].push(entity.data[10]);
                    if (entity.data[20]) currentPolyline.data[20].push(entity.data[20]);
                }
            } else if (entity.type === 'SEQEND') {
                currentPolyline = null;
            } else {
                result.push(entity);
            }
        }
        return result;
    }

    /**
     * Converter cor ACI (AutoCAD Color Index) para HEX
     */
    private aciToHex(colorIndex: number): string {
        const aciColors: Record<number, string> = {
            0: '#000000', // ByBlock
            1: '#FF0000', // Red
            2: '#FFFF00', // Yellow
            3: '#00FF00', // Green
            4: '#00FFFF', // Cyan
            5: '#0000FF', // Blue
            6: '#FF00FF', // Magenta
            7: '#FFFFFF', // White/Black
            8: '#808080', // Gray
            9: '#C0C0C0', // Light Gray
            10: '#FF0000',
            // Adicionar mais cores conforme necessário
        };
        return aciColors[colorIndex] || '#000000';
    }

    /**
     * Escape caracteres XML
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Criar SVG placeholder para quando a conversão não é possível
     */
    private createPlaceholderSvg(outputPath: string, documentId: string): ConversionResult {
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        </pattern>
    </defs>
    <rect width="100%" height="100%" fill="#f9fafb"/>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    <g transform="translate(400, 300)">
        <circle r="60" fill="#3b82f6" opacity="0.1"/>
        <path d="M -25 -20 L 25 -20 L 25 25 L -25 25 Z M -20 -15 L -20 20 L 20 20 L 20 -15 Z" 
              fill="#3b82f6" stroke="#3b82f6" stroke-width="2"/>
        <text y="80" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">
            Pré-visualização Indisponível
        </text>
        <text y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">
            Salvar como .DXF permite visualização nativa
        </text>
        <text y="120" text-anchor="middle" font-family="Arial" font-size="10" fill="#9ca3af">
            ou instale LibreDWG para converter .DWG
        </text>
    </g>
</svg>`;

        fs.writeFileSync(outputPath, svg);

        return {
            success: true,
            svgPath: outputPath,
            layers: [{ name: '0', color: '#000000', visible: true, lineType: 'CONTINUOUS' }]
        };
    }

    /**
     * Gerar thumbnail PNG do SVG
     */
    private async generateThumbnail(svgPath: string, documentId: string): Promise<string | undefined> {
        // Para thumbnail, seria necessário sharp ou similar
        // Por ora, retornamos undefined
        return undefined;
    }

    /**
     * Extrair layers de um SVG já convertido
     */
    private async extractLayersFromSvg(svgPath: string): Promise<LayerInfo[]> {
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        const layers = new Set<string>();

        const layerRegex = /data-layer="([^"]+)"/g;
        let match;
        while ((match = layerRegex.exec(svgContent)) !== null) {
            layers.add(match[1]);
        }

        return Array.from(layers).map(name => ({
            name,
            color: '#000000',
            visible: true,
            lineType: 'CONTINUOUS'
        }));
    }

    /**
     * Executar comando de sistema
     */
    private runCommand(command: string, args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args);
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', data => stdout += data);
            proc.stderr.on('data', data => stderr += data);

            proc.on('close', code => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(stderr || `Comando falhou com código ${code}`));
                }
            });

            proc.on('error', reject);
        });
    }

    /**
     * Obter SVG de um documento
     */
    async getSvg(documentId: string): Promise<{ svg: string; layers: LayerInfo[] } | null> {
        const doc = await prisma.projectDocument.findUnique({
            where: { id: documentId }
        });

        if (!doc) return null;

        const result = await this.convertToSvg(doc.filePath, documentId);

        if (result.success && result.svgPath) {
            const svg = fs.readFileSync(result.svgPath, 'utf-8');
            return { svg, layers: result.layers || [] };
        }

        return null;
    }

    /**
     * Limpar cache antigo
     */
    async cleanupCache(maxAgeDays: number = 7): Promise<number> {
        const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
        const now = Date.now();
        let cleaned = 0;

        const files = fs.readdirSync(this.cacheDir);

        for (const file of files) {
            const filePath = path.join(this.cacheDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                cleaned++;
            }
        }

        return cleaned;
    }
}

export const dwgService = new DWGService();
