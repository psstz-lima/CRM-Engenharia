import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface ImageCropModalProps {
    show: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (croppedBlob: Blob) => void;
    aspectRatio?: number; // Optional fixed aspect ratio
}

// Helper to create cropped image from canvas
const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

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

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas is empty'));
        }, 'image/jpeg', 0.9);
    });
};

export function ImageCropModal({ show, imageSrc, onClose, onCropComplete, aspectRatio }: ImageCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedAspect, setSelectedAspect] = useState<number | undefined>(aspectRatio);

    const onCropChange = useCallback((location: { x: number; y: number }) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((z: number) => {
        setZoom(z);
    }, []);

    const onCropAreaComplete = useCallback((croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setLoading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedBlob);
            onClose();
        } catch (err) {
            console.error('Error cropping image:', err);
            alert('Erro ao recortar imagem');
        } finally {
            setLoading(false);
        }
    };

    const aspectOptions = [
        { label: 'Livre', value: undefined },
        { label: '1:1', value: 1 },
        { label: '4:3', value: 4 / 3 },
        { label: '16:9', value: 16 / 9 },
        { label: '3:2', value: 3 / 2 },
    ];

    if (!show) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1100
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#1f2937', borderRadius: '12px', width: '95%', maxWidth: '800px',
                    maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.1em' }}>✂️ Recortar Imagem</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5em', cursor: 'pointer' }}>×</button>
                </div>

                {/* Crop Area */}
                <div style={{ position: 'relative', height: '400px', background: '#111827' }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={selectedAspect}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaComplete}
                    />
                </div>

                {/* Controls */}
                <div style={{ padding: '15px 20px', background: '#111827', borderTop: '1px solid #374151' }}>
                    {/* Aspect Ratio */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ color: '#9ca3af', fontSize: '0.85em', display: 'block', marginBottom: '8px' }}>Proporção:</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {aspectOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setSelectedAspect(opt.value)}
                                    style={{
                                        padding: '6px 12px',
                                        background: selectedAspect === opt.value ? '#2563eb' : '#374151',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.85em'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zoom */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ color: '#9ca3af', fontSize: '0.85em', display: 'block', marginBottom: '8px' }}>
                            Zoom: {zoom.toFixed(1)}x
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Rotation */}
                    <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85em', display: 'block', marginBottom: '8px' }}>
                            Rotação: {rotation}°
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={rotation}
                            onChange={e => setRotation(Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '15px 20px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '10px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            background: loading ? '#4b5563' : '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Salvando...' : '✓ Aplicar Recorte'}
                    </button>
                </div>
            </div>
        </div>
    );
}
