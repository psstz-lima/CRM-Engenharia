import { useState, useRef, useEffect, useCallback } from 'react';
import {
    ZoomIn, ZoomOut, Maximize, RotateCw, Move,
    Ruler, Circle as CircleIcon, ArrowUpRight, Cloud, Type,
    Layers, Settings, Download, Trash2, Save, Undo
} from 'lucide-react';
import api from '../../services/api';

// Types
interface LayerInfo {
    name: string;
    color: string;
    visible: boolean;
    lineType: string;
}

interface Annotation {
    id?: string;
    type: 'CIRCLE' | 'ARROW' | 'TEXT' | 'CLOUD' | 'DIMENSION' | 'RECTANGLE';
    geometry: any;
    text?: string;
    color: string;
    createdByName?: string;
}

interface DWGViewerProps {
    documentId: string;
    readOnly?: boolean;
    onAnnotationsChange?: (annotations: Annotation[]) => void;
}

type Tool = 'pan' | 'measure' | 'circle' | 'arrow' | 'cloud' | 'text' | 'rectangle';

export default function DWGViewer({ documentId, readOnly = false, onAnnotationsChange }: DWGViewerProps) {
    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [layers, setLayers] = useState<LayerInfo[]>([]);
    const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
    const [customLayerColors, setCustomLayerColors] = useState<Record<string, string>>({});
    const [annotations, setAnnotations] = useState<Annotation[]>([]);

    // View state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Tool state
    const [activeTool, setActiveTool] = useState<Tool>('pan');
    const [selectedColor, setSelectedColor] = useState('#ff0000');
    const [showLayers, setShowLayers] = useState(false);
    const [showToolbar, setShowToolbar] = useState(true);

    // Measurement state
    const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
    const [measurementResult, setMeasurementResult] = useState<string | null>(null);

    // Annotation drawing state
    const [drawingAnnotation, setDrawingAnnotation] = useState<Annotation | null>(null);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });

    // Load SVG and layers
    useEffect(() => {
        loadDocument();
        loadAnnotations();
    }, [documentId]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/documents/${documentId}/svg`);
            setSvgContent(response.data.svg);
            setLayers(response.data.layers);
            setVisibleLayers(new Set(response.data.layers.map((l: LayerInfo) => l.name)));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao carregar documento');
        } finally {
            setLoading(false);
        }
    };

    const loadAnnotations = async () => {
        try {
            const response = await api.get(`/documents/${documentId}/annotations`);
            setAnnotations(response.data);
        } catch (err) {
            console.error('Erro ao carregar anotações:', err);
        }
    };

    // Zoom handlers
    const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 10));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));
    const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.1, Math.min(10, z * delta)));
    }, []);

    // Add wheel listener manually to support preventDefault (non-passive)
    useEffect(() => {
        const element = svgRef.current;
        if (element) {
            element.addEventListener('wheel', handleWheel as any, { passive: false });
        }
        return () => {
            if (element) {
                element.removeEventListener('wheel', handleWheel as any);
            }
        };
    }, [handleWheel]);

    // Pan handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (activeTool === 'pan') {
            isPanning.current = true;
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        } else if (activeTool === 'measure') {
            handleMeasureClick(e);
        } else if (['circle', 'arrow', 'cloud', 'text', 'rectangle'].includes(activeTool)) {
            handleAnnotationStart(e);
        }
    }, [activeTool]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning.current && activeTool === 'pan') {
            const dx = e.clientX - lastPanPos.current.x;
            const dy = e.clientY - lastPanPos.current.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        } else if (drawingAnnotation) {
            handleAnnotationMove(e);
        }
    }, [activeTool, drawingAnnotation]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        if (drawingAnnotation) {
            handleAnnotationEnd();
        }
    }, [drawingAnnotation]);

    // Measurement
    const handleMeasureClick = (e: React.MouseEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        const newPoints = [...measurePoints, { x, y }];
        setMeasurePoints(newPoints);

        if (newPoints.length === 2) {
            const dx = newPoints[1].x - newPoints[0].x;
            const dy = newPoints[1].y - newPoints[0].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            setMeasurementResult(`Distância: ${distance.toFixed(2)} unidades`);
        }
    };

    const clearMeasurement = () => {
        setMeasurePoints([]);
        setMeasurementResult(null);
    };

    // Annotation handlers
    const handleAnnotationStart = (e: React.MouseEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        const newAnnotation: Annotation = {
            type: activeTool.toUpperCase() as any,
            geometry: { startX: x, startY: y, endX: x, endY: y },
            color: selectedColor,
            text: activeTool === 'text' ? '' : undefined
        };

        setDrawingAnnotation(newAnnotation);
    };

    const handleAnnotationMove = (e: React.MouseEvent) => {
        if (!drawingAnnotation) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        setDrawingAnnotation({
            ...drawingAnnotation,
            geometry: { ...drawingAnnotation.geometry, endX: x, endY: y }
        });
    };

    const handleAnnotationEnd = () => {
        if (!drawingAnnotation) return;

        if (drawingAnnotation.type === 'TEXT') {
            const text = prompt('Digite o texto da anotação:');
            if (text) {
                const annotation = { ...drawingAnnotation, text };
                setAnnotations([...annotations, annotation]);
                setUnsavedChanges(true);
            }
        } else {
            setAnnotations([...annotations, drawingAnnotation]);
            setUnsavedChanges(true);
        }

        setDrawingAnnotation(null);
    };

    // Save annotations
    const saveAnnotations = async () => {
        try {
            // Salvar novas anotações (sem id)
            const newAnnotations = annotations.filter(a => !a.id);
            for (const ann of newAnnotations) {
                await api.post(`/documents/${documentId}/annotations`, ann);
            }

            await loadAnnotations();
            setUnsavedChanges(false);
        } catch (err) {
            console.error('Erro ao salvar anotações:', err);
        }
    };

    const deleteAnnotation = async (index: number) => {
        const ann = annotations[index];
        if (ann.id) {
            try {
                await api.delete(`/documents/${documentId}/annotations/${ann.id}`);
            } catch (err) {
                console.error('Erro ao deletar:', err);
            }
        }
        setAnnotations(annotations.filter((_, i) => i !== index));
    };

    // Layer toggle
    const toggleLayer = (layerName: string) => {
        const newVisible = new Set(visibleLayers);
        if (newVisible.has(layerName)) {
            newVisible.delete(layerName);
        } else {
            newVisible.add(layerName);
        }
        setVisibleLayers(newVisible);
    };

    // Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Render annotations
    const renderAnnotation = (ann: Annotation, index: number) => {
        const { geometry, color, text, type } = ann;
        const { startX, startY, endX, endY } = geometry;

        switch (type) {
            case 'CIRCLE':
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                return (
                    <circle
                        key={index}
                        cx={startX}
                        cy={startY}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={2 / zoom}
                        className="annotation"
                    />
                );

            case 'ARROW':
                const angle = Math.atan2(endY - startY, endX - startX);
                const arrowSize = 10 / zoom;
                return (
                    <g key={index} className="annotation">
                        <line
                            x1={startX} y1={startY}
                            x2={endX} y2={endY}
                            stroke={color}
                            strokeWidth={2 / zoom}
                        />
                        <polygon
                            points={`
                                ${endX},${endY}
                                ${endX - arrowSize * Math.cos(angle - 0.3)},${endY - arrowSize * Math.sin(angle - 0.3)}
                                ${endX - arrowSize * Math.cos(angle + 0.3)},${endY - arrowSize * Math.sin(angle + 0.3)}
                            `}
                            fill={color}
                        />
                    </g>
                );

            case 'TEXT':
                return (
                    <text
                        key={index}
                        x={startX}
                        y={startY}
                        fill={color}
                        fontSize={14 / zoom}
                        className="annotation"
                    >
                        {text}
                    </text>
                );

            case 'CLOUD':
                const width = Math.abs(endX - startX);
                const height = Math.abs(endY - startY);
                const minX = Math.min(startX, endX);
                const minY = Math.min(startY, endY);
                const bumps = 8;
                let path = `M ${minX} ${minY + height / 2}`;
                for (let i = 0; i <= bumps; i++) {
                    const t = i / bumps;
                    const x = minX + t * width;
                    const y = minY + (height / 8) * Math.sin(t * Math.PI * bumps);
                    path += ` Q ${x - width / (bumps * 2)} ${y - height / 4}, ${x} ${y}`;
                }
                return (
                    <path
                        key={index}
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth={2 / zoom}
                        className="annotation"
                    />
                );

            case 'RECTANGLE':
                return (
                    <rect
                        key={index}
                        x={Math.min(startX, endX)}
                        y={Math.min(startY, endY)}
                        width={Math.abs(endX - startX)}
                        height={Math.abs(endY - startY)}
                        fill="none"
                        stroke={color}
                        strokeWidth={2 / zoom}
                        className="annotation"
                    />
                );

            default:
                return null;
        }
    };

    // Apply layer visibility and custom colors to SVG
    const processedSvg = svgContent.replace(
        /data-layer="([^"]+)"/g,
        (match, layerName) => {
            const styles: string[] = [];
            if (!visibleLayers.has(layerName)) {
                styles.push('display: none');
            }
            if (customLayerColors[layerName]) {
                styles.push(`stroke: ${customLayerColors[layerName]}`);
                styles.push(`fill: ${customLayerColors[layerName]}`);
            }
            if (styles.length > 0) {
                return `${match} style="${styles.join('; ')}"`;
            }
            return match;
        }
    ).replace(/stroke="#000000"/g, 'stroke="#e5e7eb"'); // Ensure black lines are visible on dark background

    // Handler for changing layer color
    const changeLayerColor = (layerName: string, newColor: string) => {
        setCustomLayerColors(prev => ({ ...prev, [layerName]: newColor }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#111827', color: 'white' }}>
                <div style={{ textAlign: 'center' }}>
                    <p>Carregando visualizador...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#111827', color: '#ef4444' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem' }}>⚠️ {error}</p>
                    <button
                        onClick={loadDocument}
                        style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '80vh', backgroundColor: '#111827', overflow: 'hidden', userSelect: 'none', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .dwg-toolbar { position: absolute; top: 1rem; left: 1rem; z-index: 20; display: flex; gap: 0.5rem; }
                .dwg-group { background: #1f2937; border-radius: 0.5rem; padding: 0.25rem; display: flex; gap: 0.25rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .dwg-btn { padding: 0.5rem; border-radius: 0.25rem; color: #e5e7eb; border: none; cursor: pointer; background: transparent; display: flex; align-items: center; justify-content: center; }
                .dwg-btn:hover { background: #374151; }
                .dwg-btn.active { background: #3b82f6; color: white; }
                .dwg-zoom { position: absolute; top: 1rem; right: 1rem; z-index: 20; background: #1f2937; color: white; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .dwg-layers { position: absolute; top: 4rem; left: 1rem; z-index: 20; background: #1f2937; color: white; border-radius: 0.5rem; padding: 1rem; width: 16rem; max-height: 20rem; overflow-y: auto; box-shadow: 0 10px 15px rgba(0,0,0,0.3); }
                .dwg-layer-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; cursor: pointer; border-radius: 0.25rem; }
                .dwg-layer-item:hover { background: #374151; }
                .dwg-meas { position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); z-index: 20; background: #1f2937; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .dwg-color { width: 32px; height: 32px; padding: 0; border: none; border-radius: 4px; cursor: pointer; }
                .dwg-content path, .dwg-content line, .dwg-content circle, .dwg-content rect, .dwg-content polygon { vector-effect: non-scaling-stroke; }
            `}</style>

            {/* Toolbar */}
            {showToolbar && (
                <div className="dwg-toolbar">
                    {/* View Tools */}
                    <div className="dwg-group">
                        <button onClick={handleZoomIn} className="dwg-btn" title="Zoom In"><ZoomIn size={18} /></button>
                        <button onClick={handleZoomOut} className="dwg-btn" title="Zoom Out"><ZoomOut size={18} /></button>
                        <button onClick={handleZoomReset} className="dwg-btn" title="Zoom Extends (Enquadrar)" style={{ gap: '4px' }}>
                            <Maximize size={18} /> <span style={{ fontSize: '12px' }}>Enquadrar</span>
                        </button>
                        <button onClick={toggleFullscreen} className="dwg-btn" title="Fullscreen"><Maximize size={18} /></button>
                    </div>

                    {/* Navigation Tools */}
                    <div className="dwg-group">
                        <button onClick={() => { setActiveTool('pan'); clearMeasurement(); }} className={`dwg-btn ${activeTool === 'pan' ? 'active' : ''}`} title="Mover"><Move size={18} /></button>
                        <button onClick={() => { setActiveTool('measure'); clearMeasurement(); }} className={`dwg-btn ${activeTool === 'measure' ? 'active' : ''}`} title="Medir"><Ruler size={18} /></button>
                    </div>

                    {/* Annotation Tools */}
                    {!readOnly && (
                        <div className="dwg-group">
                            <button onClick={() => setActiveTool('circle')} className={`dwg-btn ${activeTool === 'circle' ? 'active' : ''}`} title="Círculo"><CircleIcon size={18} /></button>
                            <button onClick={() => setActiveTool('arrow')} className={`dwg-btn ${activeTool === 'arrow' ? 'active' : ''}`} title="Seta"><ArrowUpRight size={18} /></button>
                            <button onClick={() => setActiveTool('cloud')} className={`dwg-btn ${activeTool === 'cloud' ? 'active' : ''}`} title="Nuvem"><Cloud size={18} /></button>
                            <button onClick={() => setActiveTool('text')} className={`dwg-btn ${activeTool === 'text' ? 'active' : ''}`} title="Texto"><Type size={18} /></button>
                            <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="dwg-color" title="Cor" />
                        </div>
                    )}

                    {/* Layers Toggle */}
                    <button onClick={() => setShowLayers(!showLayers)} className={`dwg-group dwg-btn ${showLayers ? 'active' : ''}`} style={{ height: 'fit-content' }} title="Layers"><Layers size={18} /></button>

                    {/* Save */}
                    {unsavedChanges && (
                        <button onClick={saveAnnotations} className="dwg-group dwg-btn" style={{ background: '#10b981', color: 'white' }}><Save size={18} /> Salvar</button>
                    )}
                </div>
            )}

            {/* Zoom indicator */}
            <div className="dwg-zoom">
                {Math.round(zoom * 100)}%
            </div>

            {/* Measurement result */}
            {measurementResult && (
                <div className="dwg-meas">
                    <span>{measurementResult}</span>
                    <button onClick={clearMeasurement} className="dwg-btn" style={{ padding: '0.2rem' }}>✕</button>
                </div>
            )}

            {/* Layers Panel */}
            {showLayers && (
                <div className="dwg-layers">
                    <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={16} /> Layers ({layers.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {layers.map(layer => (
                            <div key={layer.name} className="dwg-layer-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={visibleLayers.has(layer.name)} onChange={() => toggleLayer(layer.name)} />
                                <input
                                    type="color"
                                    value={customLayerColors[layer.name] || layer.color}
                                    onChange={(e) => changeLayerColor(layer.name, e.target.value)}
                                    style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Alterar cor"
                                />
                                <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{layer.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SVG Container */}
            <div
                ref={svgRef}
                style={{
                    width: '100%',
                    height: '100%',
                    cursor: activeTool === 'pan' ? (isPanning.current ? 'grabbing' : 'grab') : 'crosshair',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: isPanning.current ? 'none' : 'transform 0.1s ease-out'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* SVG Content */}
                <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: processedSvg }} />

                {/* Annotations Overlay */}
                <svg className="absolute inset-0 pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {annotations.map((ann, i) => renderAnnotation(ann, i))}
                    {drawingAnnotation && renderAnnotation(drawingAnnotation, -1)}
                    {measurePoints.map((point, i) => (
                        <circle key={i} cx={point.x} cy={point.y} r={5 / zoom} fill="#3b82f6" />
                    ))}
                    {measurePoints.length === 2 && (
                        <line x1={measurePoints[0].x} y1={measurePoints[0].y} x2={measurePoints[1].x} y2={measurePoints[1].y} stroke="#3b82f6" strokeWidth={2 / zoom} strokeDasharray={`${4 / zoom} ${4 / zoom}`} />
                    )}
                </svg>
            </div>
        </div>
    );
}
