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
    const [color, setColor] = useState('#ef4444'); // red-500
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
            annotations.forEach((ann) => drawAnnotation(ctx, ann));
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
                ann.points.forEach((p) => ctx.lineTo(p.x, p.y));
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
            setNumberCounter((prev) => prev + 1);
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
            setCurrentAnnotation((prev) => (prev ? { ...prev, points: [...prev.points, pos] } : null));
        } else {
            setCurrentAnnotation((prev) => (prev ? { ...prev, points: [prev.points[0], pos] } : null));
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
            setImageHistory((prev) => [...prev, croppedUrl]);

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
            newHistory.pop();
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
        { type: 'freehand', icon: 'DL', label: 'Desenho livre' },
        { type: 'line', icon: 'LN', label: 'Linha' },
        { type: 'arrow', icon: 'SE', label: 'Seta' },
        { type: 'rect', icon: 'RT', label: 'Retângulo' },
        { type: 'circle', icon: 'CI', label: 'Círculo' },
        { type: 'text', icon: 'TX', label: 'Texto' },
        { type: 'number', icon: 'N#', label: 'Numeração' },
    ];

    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#d946ef', '#06b6d4', '#ffffff', '#000000'];

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-50 border border-slate-200 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-100">
                    <h3 className="text-slate-900 text-lg font-medium">Editor de imagens</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-xl transition-colors">X</button>
                </div>

                {/* Toolbar */}
                <div className="p-3 bg-slate-100 border-b border-slate-200 flex gap-2 flex-wrap items-center justify-center">
                    {/* Crop button */}
                    <button
                        onClick={() => setMode(mode === 'crop' ? 'edit' : 'crop')}
                        title="Recortar"
                        className={`p-2 rounded transition-colors ${mode === 'crop'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >RC</button>

                    <div className="w-px h-8 bg-slate-200 mx-2" />

                    {/* Drawing tools */}
                    {tools.map((t) => (
                        <button
                            key={t.type}
                            onClick={() => { setMode('edit'); setTool(t.type); }}
                            title={t.label}
                            disabled={mode === 'crop'}
                            className={`p-2 rounded transition-all ${mode === 'edit' && tool === t.type
                                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                } ${mode === 'crop' ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            {t.icon}
                        </button>
                    ))}

                    <div className="w-px h-8 bg-slate-200 mx-2" />

                    {/* Transform tools */}
                    <div className="flex bg-slate-50 rounded p-1 gap-1 border border-slate-200">
                        <button onClick={handleRotateLeft} title="Girar esquerda" className="p-1.5 rounded hover:bg-slate-200 text-slate-700">GL</button>
                        <button onClick={handleRotateRight} title="Girar direita" className="p-1.5 rounded hover:bg-slate-200 text-slate-700">GR</button>
                        <button onClick={handleFlipHorizontal} title="Inverter horizontal" className={`p-1.5 rounded hover:bg-slate-200 ${flipH ? 'text-emerald-700 bg-emerald-100' : 'text-slate-700'}`}>IH</button>
                        <button onClick={handleFlipVertical} title="Inverter vertical" className={`p-1.5 rounded hover:bg-slate-200 ${flipV ? 'text-emerald-700 bg-emerald-100' : 'text-slate-700'}`}>IV</button>
                    </div>

                    <div className="w-px h-8 bg-slate-200 mx-2" />

                    {/* Colors */}
                    <div className="flex gap-1 bg-slate-50 p-1 rounded border border-slate-200">
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                disabled={mode === 'crop'}
                                className={`w-6 h-6 rounded-sm border-2 transition-transform ${color === c ? 'border-white scale-110 z-10' : 'border-transparent hover:scale-105'
                                    } ${mode === 'crop' ? 'opacity-30 cursor-not-allowed' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-8 bg-slate-200 mx-2" />

                    {/* Stroke Width */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                        <span className="text-xs text-slate-600">Espessura</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(Number(e.target.value))}
                            className="w-20 accent-slate-600"
                            disabled={mode === 'crop'}
                        />
                    </div>
                </div>

                {/* Canvas Area / Crop Area */}
                <div className="flex-1 overflow-hidden relative bg-slate-200 flex items-center justify-center p-4">
                    {mode === 'crop' ? (
                        <>
                            {/* Crop Type Toggle */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-50/90 p-1 rounded-lg backdrop-blur shadow-xl border border-slate-300 z-10">
                                <button
                                    onClick={() => setCropType('selection')}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${cropType === 'selection' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >Seleção</button>
                                <button
                                    onClick={() => setCropType('zoom')}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${cropType === 'zoom' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >Zoom</button>
                            </div>

                            {cropType === 'zoom' ? (
                                <>
                                    <div className="w-full h-full relative">
                                        <Cropper
                                            image={currentImageSrc}
                                            crop={cropPosition}
                                            zoom={cropZoom}
                                            aspect={undefined}
                                            onCropChange={setCropPosition}
                                            onZoomChange={setCropZoom}
                                            onCropComplete={onCropComplete}
                                            style={{
                                                containerStyle: { width: '100%', height: '100%', background: 'transparent' },
                                                mediaStyle: { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
                                            }}
                                        />
                                    </div>
                                    {/* Zoom slider */}
                                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-50/90 px-4 py-2 rounded-lg backdrop-blur shadow-xl border border-slate-300 z-10">
                                        <span className="text-slate-700 text-sm font-medium">Zoom</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.1"
                                            value={cropZoom}
                                            onChange={(e) => setCropZoom(Number(e.target.value))}
                                            className="w-40 accent-slate-600"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <canvas
                                        ref={canvasRef}
                                        onMouseDown={handleCropMouseDown}
                                        onMouseMove={handleCropMouseMove}
                                        onMouseUp={handleCropMouseUp}
                                        onMouseLeave={handleCropMouseUp}
                                        className="max-w-full max-h-full rounded shadow-2xl cursor-crosshair"
                                    />
                                    {/* Selection overlay */}
                                    {selectionStart && selectionEnd && (
                                        <div
                                            className="absolute border-2 border-slate-600 bg-slate-500/20 pointer-events-none"
                                            style={{
                                                left: Math.min(selectionStart.x, selectionEnd.x) + (canvasRef.current ? (canvasRef.current.parentElement!.clientWidth - canvasRef.current.width) / 2 : 0),
                                                top: Math.min(selectionStart.y, selectionEnd.y),
                                                width: Math.abs(selectionEnd.x - selectionStart.x),
                                                height: Math.abs(selectionEnd.y - selectionStart.y),
                                            }}
                                        />
                                    )}
                                    <p className="absolute bottom-20 text-slate-600 text-sm bg-slate-100/70 px-3 py-1 rounded-full border border-slate-200">
                                        Clique e arraste para selecionar a área de corte
                                    </p>
                                </div>
                            )}

                            {/* Crop controls */}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                                <button
                                    onClick={handleApplyCrop}
                                    disabled={cropType === 'selection' && (!selectionStart || !selectionEnd)}
                                    className={`px-5 py-2.5 rounded font-medium shadow-lg transition-all ${cropType === 'selection' && (!selectionStart || !selectionEnd)
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
                                        }`}
                                >
                                    Aplicar recorte
                                </button>
                                <button
                                    onClick={handleCancelCrop}
                                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium shadow-lg hover:scale-105 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </>
                    ) : (
                        !imageLoaded ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>
                                <p className="text-slate-600">Carregando imagem...</p>
                            </div>
                        ) : (
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                className={`max-w-full max-h-full rounded shadow-2xl ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                            />
                        )
                    )}
                </div>

                {/* Text Input Overlay */}
                {textPosition && mode === 'edit' && (
                    <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex gap-3 items-center animate-slideUp">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Digite o texto..."
                            autoFocus
                            className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:border-slate-500 outline-none"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddText(); }}
                        />
                        <button onClick={handleAddText} className="btn btn-primary px-4 py-2">Adicionar</button>
                        <button onClick={() => setTextPosition(null)} className="btn btn-secondary px-4 py-2">Cancelar</button>
                    </div>
                )}

                {/* Adjustments Bar */}
                {mode === 'edit' && (
                    <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex gap-6 overflow-x-auto items-center">
                        <label className="flex items-center gap-2 text-xs text-slate-600 whitespace-nowrap">
                            <span>Brilho</span>
                            <span className="bg-white px-1.5 rounded min-w-[30px] text-center border border-slate-200">{brightness}%</span>
                            <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-24 accent-slate-600" />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 whitespace-nowrap">
                            <span>Contraste</span>
                            <span className="bg-white px-1.5 rounded min-w-[30px] text-center border border-slate-200">{contrast}%</span>
                            <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-24 accent-slate-600" />
                        </label>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-100 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={handleUndo} disabled={historyIndex === 0 || mode === 'crop'} title="Desfazer desenho" className={`px-3 py-2 rounded ${historyIndex === 0 || mode === 'crop' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Desfazer</button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || mode === 'crop'} title="Refazer desenho" className={`px-3 py-2 rounded ${historyIndex >= history.length - 1 || mode === 'crop' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Refazer</button>
                        <div className="w-px h-8 bg-slate-200 mx-2" />
                        <button onClick={handleUndoCrop} disabled={imageHistory.length <= 1 || mode === 'crop'} title="Desfazer recorte" className={`px-3 py-2 rounded flex items-center gap-2 ${imageHistory.length <= 1 || mode === 'crop' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Desfazer recorte</button>
                        <button onClick={handleClear} disabled={mode === 'crop'} title="Limpar tudo" className={`px-3 py-2 rounded flex items-center gap-2 ${mode === 'crop' ? 'opacity-30' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Limpar</button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn btn-secondary px-5">Cancelar</button>
                        <button onClick={handleSave} disabled={mode === 'crop'} className={`btn btn-primary px-5 ${mode === 'crop' ? 'opacity-50 cursor-not-allowed' : ''}`}>Salvar edição</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
