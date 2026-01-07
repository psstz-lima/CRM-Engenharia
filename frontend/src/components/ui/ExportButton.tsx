import { useState } from 'react';
import api from '../../services/api';

interface ExportButtonProps {
    type: 'measurement' | 'contract';
    id: string;
    label?: string;
}

export function ExportButton({ type, id, label = 'Exportar' }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleExport = async (format: 'excel') => {
        setLoading(true);
        setShowMenu(false);
        try {
            const endpoint = type === 'measurement'
                ? `/reports/measurement/${id}/excel`
                : `/reports/contract/${id}/excel`;

            const response = await api.get(endpoint, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <span className="animate-spin">⏳</span>
                        Gerando...
                    </>
                ) : (
                    <>
                        <span>📥</span>
                        {label}
                    </>
                )}
            </button>

            {showMenu && !loading && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                        <button
                            onClick={() => handleExport('excel')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                        >
                            <span className="text-xl">📊</span>
                            <div>
                                <p className="font-medium">Excel</p>
                                <p className="text-xs opacity-60">Planilha .xlsx</p>
                            </div>
                        </button>
                        {/* PDF pode ser adicionado futuramente */}
                        {/* <button
                            onClick={() => handleExport('pdf')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors border-t"
                        >
                            <span className="text-xl">📄</span>
                            <div>
                                <p className="font-medium">PDF</p>
                                <p className="text-xs opacity-60">Documento .pdf</p>
                            </div>
                        </button> */}
                    </div>
                </>
            )}
        </div>
    );
}
