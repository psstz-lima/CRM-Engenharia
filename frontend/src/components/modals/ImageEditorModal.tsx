import { useState, useRef, useEffect, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

// Types
type ToolType = 'freehand' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'number';

interface Point {
    x: number;
    y: number;
}

interface Annotation {
    id: string;
    type: ToolType;
    points: Point[];
    color: string;
    strokeWidth: number;
    text?: string;
    number?: number;
}

interface ImageEditorModalProps {
    show: boolean;
    imageSrc: string;
    onClose: () => void;
    onSave: (editedBlob: Blob) => void;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to get cropped image
const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Could not create blob'));
            }, 'image/jpeg', 0.9);
        };
        image.onerror = reject;
        image.src = imageSrc;
    });
};

export function ImageEditorModal({ show, imageSrc, onClose, onSave }: ImageEditorModalProps) {
    // Canvas ref
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mode state
    const [mode, setMode] = useState<'edit' | 'crop'>('edit');

    // Drawing states
    const [tool, setTool] = useState<ToolType>('freehand');
    const [color, setColor] = useState('#ff0000');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [numberCounter, setNumberCounter] = useState(1);
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState<Point | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [history, setHistory] = useState<Annotation[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Transform states
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    // Crop states (react-easy-crop for zoom mode)
    const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
    const [cropZoom, setCropZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Crop mode type: 'zoom' (pan+zoom) or 'selection' (draw rectangle)
    const [cropType, setCropType] = useState<'zoom' | 'selection'>('selection');

    // Manual selection crop states
    const [selectionStart, setSelectionStart] = useState<Point | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    // Current image source (can be updated after crop)
    const [currentImageSrc, setCurrentImageSrc] = useState(imageSrc);

    // Image history for undo crop
    const [imageHistory, setImageHistory] = useState<string[]>([imageSrc]);

    // Image ref
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Reset when image changes
    useEffect(() => {
        setCurrentImageSrc(imageSrc);
    }, [imageSrc]);

    // Load image
    useEffect(() => {
        if (!show) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
        };
        img.src = currentImageSrc;
    }, [currentImageSrc, show]);

    // Redraw canvas (for edit mode AND crop+selection mode)
    useEffect(() => {
        // Draw in edit mode OR in crop mode with selection type
        const shouldDraw = mode === 'edit' || (mode === 'crop' && cropType === 'selection');
        if (!imageLoaded || !canvasRef.current || !imageRef.current || !shouldDraw) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imageRef.current;

        const isRotated = rotation === 90 || rotation === 270;
        const baseWidth = Math.min(img.width, 800);
        const baseHeight = (img.height / img.width) * baseWidth;

        canvas.width = isRotated ? baseHeight : baseWidth;
        canvas.height = isRotated ? baseWidth : baseHeight;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
        ctx.restore();

        ctx.filter = 'none';

        // Only draw annotations in edit mode
        if (mode === 'edit') {
            annotations.forEach(ann => drawAnnotation(ctx, ann));
            if (currentAnnotation) {
                drawAnnotation(ctx, currentAnnotation);
            }
        }
    }, [imageLoaded, annotations, currentAnnotation, brightness, contrast, rotation, flipH, flipV, mode, cropType]);

    // Draw annotation helper
    const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
        ctx.strokeStyle = ann.color;
        ctx.fillStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (ann.type) {
            case 'freehand':
                if (ann.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(ann.points[0].x, ann.points[0].y);
                ann.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
                break;

            case 'line':
                if (ann.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(ann.points[0].x, ann.points[0].y);
                ctx.lineTo(ann.points[1].x, ann.points[1].y);
                ctx.stroke();
                break;

            case 'arrow':
                if (ann.points.length < 2) return;
                const [start, end] = ann.points;
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                const headLen = 15;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fill();
                break;

            case 'rect':
                if (ann.points.length < 2) return;
                const [r1, r2] = ann.points;
                ctx.strokeRect(r1.x, r1.y, r2.x - r1.x, r2.y - r1.y);
                break;

            case 'circle':
                if (ann.points.length < 2) return;
                const [c1, c2] = ann.points;
                const radiusX = Math.abs(c2.x - c1.x) / 2;
                const radiusY = Math.abs(c2.y - c1.y) / 2;
                const centerX = (c1.x + c2.x) / 2;
                const centerY = (c1.y + c2.y) / 2;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;

            case 'text':
                if (!ann.text || ann.points.length === 0) return;
                ctx.font = `${ann.strokeWidth * 6}px Arial`;
                ctx.fillText(ann.text, ann.points[0].x, ann.points[0].y);
                break;

            case 'number':
                if (ann.number === undefined || ann.points.length === 0) return;
                const numSize = 24;
                ctx.beginPath();
                ctx.arc(ann.points[0].x, ann.points[0].y, numSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ann.number.toString(), ann.points[0].x, ann.points[0].y);
                ctx.fillStyle = ann.color;
                break;
        }
    };

    // Get mouse position
    const getMousePos = (e: React.MouseEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'edit') return;
        const pos = getMousePos(e);

        if (tool === 'text') {
            setTextPosition(pos);
            return;
        }

        if (tool === 'number') {
            const newAnn: Annotation = {
                id: generateId(),
                type: 'number',
                points: [pos],
                color,
                strokeWidth,
                number: numberCounter
            };
            saveAnnotation(newAnn);
            setNumberCounter(prev => prev + 1);
            return;
        }

        setIsDrawing(true);
        setCurrentAnnotation({
            id: generateId(),
            type: tool,
            points: [pos],
            color,
            strokeWidth
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (mode !== 'edit' || !isDrawing || !currentAnnotation) return;
        const pos = getMousePos(e);

        if (currentAnnotation.type === 'freehand') {
            setCurrentAnnotation(prev => prev ? { ...prev, points: [...prev.points, pos] } : null);
        } else {
            setCurrentAnnotation(prev => prev ? { ...prev, points: [prev.points[0], pos] } : null);
        }
    };

    const handleMouseUp = () => {
        if (currentAnnotation) saveAnnotation(currentAnnotation);
        setIsDrawing(false);
        setCurrentAnnotation(null);
    };

    // Save annotation with history
    const saveAnnotation = (ann: Annotation) => {
        const newAnnotations = [...annotations, ann];
        setAnnotations(newAnnotations);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Text
    const handleAddText = () => {
        if (!textPosition || !textInput.trim()) return;
        const newAnn: Annotation = {
            id: generateId(),
            type: 'text',
            points: [textPosition],
            color,
            strokeWidth,
            text: textInput
        };
        saveAnnotation(newAnn);
        setTextInput('');
        setTextPosition(null);
    };

    // History
    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setAnnotations(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setAnnotations(history[newIndex]);
        }
    };

    // Clear
    const handleClear = () => {
        setAnnotations([]);
        setNumberCounter(1);
        setHistory([[]]);
        setHistoryIndex(0);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setBrightness(100);
        setContrast(100);
    };

    // Transforms
    const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
    const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
    const handleFlipHorizontal = () => setFlipH((prev) => !prev);
    const handleFlipVertical = () => setFlipV((prev) => !prev);

    // Crop handlers (zoom mode - react-easy-crop)
    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Selection mode mouse handlers
    const handleCropMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'crop' || cropType !== 'selection') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setSelectionStart(pos);
        setSelectionEnd(pos);
        setIsSelecting(true);
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || mode !== 'crop' || cropType !== 'selection') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setSelectionEnd(pos);
    };

    const handleCropMouseUp = () => {
        setIsSelecting(false);
    };

    // Apply crop for both modes
    const handleApplyCrop = async () => {
        try {
            let cropArea: Area;

            if (cropType === 'zoom' && croppedAreaPixels) {
                cropArea = croppedAreaPixels;
            } else if (cropType === 'selection' && selectionStart && selectionEnd && canvasRef.current && imageRef.current) {
                // Calculate from selection coordinates
                const canvas = canvasRef.current;
                const img = imageRef.current;
                const scaleX = img.width / canvas.width;
                const scaleY = img.height / canvas.height;

                const x = Math.min(selectionStart.x, selectionEnd.x) * scaleX;
                const y = Math.min(selectionStart.y, selectionEnd.y) * scaleY;
                const width = Math.abs(selectionEnd.x - selectionStart.x) * scaleX;
                const height = Math.abs(selectionEnd.y - selectionStart.y) * scaleY;

                if (width < 20 || height < 20) {
                    alert('Área de corte muito pequena');
                    return;
                }

                cropArea = { x, y, width, height };
            } else {
                return;
            }

            const croppedBlob = await getCroppedImg(currentImageSrc, cropArea);
            const croppedUrl = URL.createObjectURL(croppedBlob);

            // Add to image history before changing
            setImageHistory(prev => [...prev, croppedUrl]);

            setCurrentImageSrc(croppedUrl);
            setImageLoaded(false);
            setAnnotations([]);
            setHistory([[]]);
            setHistoryIndex(0);
            setCropPosition({ x: 0, y: 0 });
            setCropZoom(1);
            setSelectionStart(null);
            setSelectionEnd(null);
            setMode('edit');
        } catch (err) {
            console.error('Crop failed:', err);
            alert('Erro ao recortar imagem');
        }
    };

    // Undo crop - go back to previous image version
    const handleUndoCrop = () => {
        if (imageHistory.length > 1) {
            const newHistory = [...imageHistory];
            newHistory.pop(); // Remove current
            const previousImage = newHistory[newHistory.length - 1];
            setImageHistory(newHistory);
            setCurrentImageSrc(previousImage);
            setImageLoaded(false);
            setAnnotations([]);
            setHistory([[]]);
            setHistoryIndex(0);
        }
    };

    const handleCancelCrop = () => {
        setCropPosition({ x: 0, y: 0 });
        setCropZoom(1);
        setSelectionStart(null);
        setSelectionEnd(null);
        setMode('edit');
    };

    // Save
    const handleSave = () => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                onSave(blob);
                onClose();
            }
        }, 'image/jpeg', 0.9);
    };

    // Tools config
    const tools: { type: ToolType; icon: string; label: string }[] = [
        { type: 'freehand', icon: '✏️', label: 'Desenho Livre' },
        { type: 'line', icon: '📏', label: 'Linha' },
        { type: 'arrow', icon: '➡️', label: 'Seta' },
        { type: 'rect', icon: '🔲', label: 'Retângulo' },
        { type: 'circle', icon: '⭕', label: 'Círculo' },
        { type: 'text', icon: '📝', label: 'Texto' },
        { type: 'number', icon: '🔢', label: 'Numeração' },
    ];

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'];

    if (!show) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1200
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1f2937', borderRadius: '12px', width: '95%', maxWidth: '900px',
                    height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.1em' }}>
                        🎨 Editor de Imagens {mode === 'crop' && '- Modo Recorte'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5em', cursor: 'pointer' }}>×</button>
                </div>

                {/* Toolbar */}
                <div style={{ padding: '10px 15px', background: '#111827', borderBottom: '1px solid #374151', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Crop button */}
                    <button
                        onClick={() => setMode(mode === 'crop' ? 'edit' : 'crop')}
                        title="Recortar"
                        style={{
                            padding: '8px 12px',
                            background: mode === 'crop' ? '#16a34a' : '#374151',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1em'
                        }}
                    >✂️</button>

                    <div style={{ width: '1px', height: '30px', background: '#4b5563', margin: '0 5px' }} />

                    {/* Drawing tools */}
                    {tools.map(t => (
                        <button
                            key={t.type}
                            onClick={() => { setMode('edit'); setTool(t.type); }}
                            title={t.label}
                            style={{
                                padding: '8px 12px',
                                background: mode === 'edit' && tool === t.type ? '#2563eb' : '#374151',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1em',
                                opacity: mode === 'crop' ? 0.5 : 1
                            }}
                            disabled={mode === 'crop'}
                        >
                            {t.icon}
                        </button>
                    ))}

                    <div style={{ width: '1px', height: '30px', background: '#4b5563', margin: '0 5px' }} />

                    {/* Transform tools */}
                    <button onClick={handleRotateLeft} title="Girar Esquerda" style={{ padding: '8px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1em' }}>↺</button>
                    <button onClick={handleRotateRight} title="Girar Direita" style={{ padding: '8px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1em' }}>↻</button>
                    <button onClick={handleFlipHorizontal} title="Inverter Horizontal" style={{ padding: '8px 12px', background: flipH ? '#2563eb' : '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1em' }}>↔️</button>
                    <button onClick={handleFlipVertical} title="Inverter Vertical" style={{ padding: '8px 12px', background: flipV ? '#2563eb' : '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1em' }}>↕️</button>

                    <div style={{ width: '1px', height: '30px', background: '#4b5563', margin: '0 5px' }} />

                    {/* Colors */}
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: '28px',
                                height: '28px',
                                background: c,
                                border: color === c ? '3px solid white' : '2px solid #4b5563',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                opacity: mode === 'crop' ? 0.5 : 1
                            }}
                            disabled={mode === 'crop'}
                        />
                    ))}

                    <div style={{ width: '1px', height: '30px', background: '#4b5563', margin: '0 5px' }} />

                    {/* Stroke Width */}
                    <label style={{ color: '#9ca3af', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Tamanho:
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={strokeWidth}
                            onChange={e => setStrokeWidth(Number(e.target.value))}
                            style={{ width: '80px' }}
                            disabled={mode === 'crop'}
                        />
                    </label>
                </div>

                {/* Canvas Area / Crop Area */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px', background: '#0f172a', position: 'relative', minHeight: '450px' }}>
                    {mode === 'crop' ? (
                        // Crop mode
                        <>
                            {/* Crop Type Toggle */}
                            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '6px', zIndex: 10 }}>
                                <button
                                    onClick={() => setCropType('selection')}
                                    style={{
                                        padding: '6px 12px',
                                        background: cropType === 'selection' ? '#2563eb' : '#4b5563',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9em'
                                    }}
                                >📐 Seleção</button>
                                <button
                                    onClick={() => setCropType('zoom')}
                                    style={{
                                        padding: '6px 12px',
                                        background: cropType === 'zoom' ? '#2563eb' : '#4b5563',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9em'
                                    }}
                                >🔍 Zoom</button>
                            </div>

                            {cropType === 'zoom' ? (
                                // Zoom mode with react-easy-crop
                                <>
                                    <Cropper
                                        image={currentImageSrc}
                                        crop={cropPosition}
                                        zoom={cropZoom}
                                        aspect={undefined}
                                        onCropChange={setCropPosition}
                                        onZoomChange={setCropZoom}
                                        onCropComplete={onCropComplete}
                                        style={{
                                            containerStyle: { width: '100%', height: '100%' }
                                        }}
                                    />
                                    {/* Zoom slider */}
                                    <div style={{ position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.7)', padding: '8px 15px', borderRadius: '6px', zIndex: 10 }}>
                                        <span style={{ color: 'white', fontSize: '0.9em' }}>Zoom:</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.1"
                                            value={cropZoom}
                                            onChange={e => setCropZoom(Number(e.target.value))}
                                            style={{ width: '150px' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                // Selection mode with canvas
                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                                    <canvas
                                        ref={canvasRef}
                                        onMouseDown={handleCropMouseDown}
                                        onMouseMove={handleCropMouseMove}
                                        onMouseUp={handleCropMouseUp}
                                        onMouseLeave={handleCropMouseUp}
                                        style={{ cursor: 'crosshair', borderRadius: '4px', maxWidth: '100%', maxHeight: '100%' }}
                                    />
                                    {/* Selection overlay */}
                                    {selectionStart && selectionEnd && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: Math.min(selectionStart.x, selectionEnd.x) + (canvasRef.current ? (canvasRef.current.parentElement!.clientWidth - canvasRef.current.width) / 2 : 0),
                                                top: Math.min(selectionStart.y, selectionEnd.y),
                                                width: Math.abs(selectionEnd.x - selectionStart.x),
                                                height: Math.abs(selectionEnd.y - selectionStart.y),
                                                border: '2px dashed #2563eb',
                                                background: 'rgba(37,99,235,0.2)',
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    )}
                                    <p style={{ position: 'absolute', bottom: '70px', color: '#9ca3af', fontSize: '0.9em' }}>
                                        Clique e arraste para selecionar a área de corte
                                    </p>
                                </div>
                            )}

                            {/* Crop controls */}
                            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
                                <button
                                    onClick={handleApplyCrop}
                                    disabled={cropType === 'selection' && (!selectionStart || !selectionEnd)}
                                    style={{
                                        padding: '10px 20px',
                                        background: (cropType === 'selection' && (!selectionStart || !selectionEnd)) ? '#374151' : '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: (cropType === 'selection' && (!selectionStart || !selectionEnd)) ? 'not-allowed' : 'pointer',
                                        fontSize: '1em',
                                        fontWeight: 'bold'
                                    }}
                                >✓ Aplicar Recorte</button>
                                <button
                                    onClick={handleCancelCrop}
                                    style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1em' }}
                                >✗ Cancelar</button>
                            </div>
                        </>
                    ) : (
                        // Edit mode with canvas
                        !imageLoaded ? (
                            <p style={{ color: '#9ca3af' }}>Carregando imagem...</p>
                        ) : (
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                style={{ cursor: tool === 'text' ? 'text' : 'crosshair', borderRadius: '4px', maxWidth: '100%', maxHeight: '100%' }}
                            />
                        )
                    )}
                </div>

                {/* Text Input */}
                {textPosition && mode === 'edit' && (
                    <div style={{ padding: '10px 15px', background: '#111827', borderTop: '1px solid #374151', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={textInput}
                            onChange={e => setTextInput(e.target.value)}
                            placeholder="Digite o texto..."
                            autoFocus
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', fontSize: '1em' }}
                        />
                        <button onClick={handleAddText} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Adicionar</button>
                        <button onClick={() => setTextPosition(null)} style={{ padding: '8px 16px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                )}

                {/* Adjustments */}
                {mode === 'edit' && (
                    <div style={{ padding: '10px 15px', background: '#111827', borderTop: '1px solid #374151', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <label style={{ color: '#9ca3af', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ☀️ Brilho: {brightness}%
                            <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} style={{ width: '120px' }} />
                        </label>
                        <label style={{ color: '#9ca3af', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🌗 Contraste: {contrast}%
                            <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} style={{ width: '120px' }} />
                        </label>
                    </div>
                )}

                {/* Footer */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleUndo} disabled={historyIndex === 0 || mode === 'crop'} title="Desfazer desenho" style={{ padding: '8px 12px', background: historyIndex === 0 ? '#374151' : '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: historyIndex === 0 ? 'not-allowed' : 'pointer' }}>↩️</button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || mode === 'crop'} title="Refazer desenho" style={{ padding: '8px 12px', background: historyIndex >= history.length - 1 ? '#374151' : '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer' }}>↪️</button>
                        <button onClick={handleUndoCrop} disabled={imageHistory.length <= 1 || mode === 'crop'} title="Desfazer recorte" style={{ padding: '8px 12px', background: imageHistory.length <= 1 ? '#374151' : '#ca8a04', color: 'white', border: 'none', borderRadius: '4px', cursor: imageHistory.length <= 1 ? 'not-allowed' : 'pointer' }}>🔙</button>
                        <button onClick={handleClear} disabled={mode === 'crop'} title="Limpar tudo" style={{ padding: '8px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{ padding: '10px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleSave} disabled={mode === 'crop'} style={{ padding: '10px 20px', background: mode === 'crop' ? '#374151' : '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: mode === 'crop' ? 'not-allowed' : 'pointer' }}>💾 Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
