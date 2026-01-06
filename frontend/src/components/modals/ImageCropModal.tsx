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
        <div onClick={onClose} className="modal-overlay" style={{ zIndex: 1100 }}>
            <div
                onClick={e => e.stopPropagation()}
                className="modal-content w-[95%] max-w-[800px] max-h-[95vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-300 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">✂️ Recortar Imagem</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-2xl">×</button>
                </div>

                {/* Crop Area */}
                <div className="relative h-[400px] bg-dark-950">
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
                <div className="px-5 py-4 bg-gray-100 border-t border-gray-300 space-y-4">
                    {/* Aspect Ratio */}
                    <div>
                        <label className="text-gray-600 text-sm block mb-2">Proporção:</label>
                        <div className="flex gap-2 flex-wrap">
                            {aspectOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setSelectedAspect(opt.value)}
                                    className={`px-3 py-1.5 rounded text-sm transition-colors ${selectedAspect === opt.value
                                            ? 'bg-primary-600 text-gray-900'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zoom */}
                    <div>
                        <label className="text-gray-600 text-sm block mb-2">
                            Zoom: {zoom.toFixed(1)}x
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="w-full accent-primary-500"
                        />
                    </div>

                    {/* Rotation */}
                    <div>
                        <label className="text-gray-600 text-sm block mb-2">
                            Rotação: {rotation}°
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={rotation}
                            onChange={e => setRotation(Number(e.target.value))}
                            className="w-full accent-primary-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-300 flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`btn ${loading ? 'bg-gray-300 cursor-not-allowed' : 'btn-success'}`}
                    >
                        {loading ? 'Salvando...' : '✓ Aplicar Recorte'}
                    </button>
                </div>
            </div>
        </div>
    );
}

