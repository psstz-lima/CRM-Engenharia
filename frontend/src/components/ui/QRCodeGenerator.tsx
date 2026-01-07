import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
    data: string;
    title?: string;
    size?: number;
    logo?: string;
}

export function QRCodeGenerator({ data, title, size = 200, logo }: QRCodeGeneratorProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const downloadQR = () => {
        const canvas = canvasRef.current?.querySelector('canvas');
        if (!canvas) return;

        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `qrcode-${title || 'download'}.png`;
        link.href = url;
        link.click();
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(data);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            {title && (
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            )}

            <div ref={canvasRef} className="p-4 bg-white rounded-lg shadow-inner">
                <QRCodeCanvas
                    value={data}
                    size={size}
                    level="H"
                    includeMargin
                    imageSettings={logo ? {
                        src: logo,
                        height: 40,
                        width: 40,
                        excavate: true
                    } : undefined}
                />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={downloadQR}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <Download size={16} />
                    Baixar PNG
                </button>
                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    {copied ? 'Copiado!' : 'Copiar link'}
                </button>
            </div>

            <p className="text-xs text-gray-500 text-center max-w-xs break-all">{data}</p>
        </div>
    );
}

// Hook para gerar URL de acesso rápido
export function useContractQR(contractId: string) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/contracts/${contractId}`;

    return {
        url,
        qrData: JSON.stringify({
            type: 'CONTRACT',
            id: contractId,
            url
        })
    };
}

export function useMeasurementQR(measurementId: string) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/measurements/${measurementId}`;

    return {
        url,
        qrData: JSON.stringify({
            type: 'MEASUREMENT',
            id: measurementId,
            url
        })
    };
}
