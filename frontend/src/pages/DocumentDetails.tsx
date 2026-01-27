import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Download, Upload, Edit, Trash2, Eye,
    Clock, CheckCircle, AlertCircle, XCircle,
    FileText, History, MessageSquare, Send,
    ZoomIn, ZoomOut, Maximize, RotateCw
} from 'lucide-react';
import api from '../services/api';
import DWGViewer from '../components/documents/DWGViewer';

interface Document {
    id: string;
    code: string;
    title: string;
    description?: string;
    revision: string;
    status: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    author?: string;
    format?: string;
    scale?: string;
    receivedAt: string;
    analyzedAt?: string;
    approvedAt?: string;
    distributedAt?: string;
    releasedAt?: string;
    category?: { code: string; name: string; color: string; icon: string };
    contract?: { number: string; company: { name: string } };
    versions: any[];
    analyses: any[];
    annotations: any[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    RECEIVED: { label: 'Recebido', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Clock },
    IN_ANALYSIS: { label: 'Em Análise', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
    APPROVED: { label: 'Aprovado', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
    APPROVED_NOTES: { label: 'Aprovado c/ Ressalvas', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertCircle },
    REJECTED: { label: 'Reprovado', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
    DISTRIBUTED: { label: 'Distribuído', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Send },
    RELEASED: { label: 'Liberado', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle }
};

export default function DocumentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'preview' | 'versions' | 'analysis' | 'timeline'>('preview');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        loadDocument();
    }, [id]);

    const loadDocument = async () => {
        try {
            const res = await api.get(`/documents/${id}`);
            setDocument(res.data);

            // Carregar PDF para preview
            if (res.data.mimeType === 'application/pdf') {
                const pdfRes = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
                setPdfUrl(url);
            }
        } catch (error) {
            console.error('Erro ao carregar documento:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!document) return;
        try {
            const response = await api.get(`/documents/${document.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = window.document.createElement('a');
            link.href = url;
            link.setAttribute('download', document.fileName);
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar:', error);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Documento não encontrado</p>
            </div>
        );
    }

    const status = statusConfig[document.status] || statusConfig.RECEIVED;
    const StatusIcon = status.icon;

    const timelineEvents = [
        { label: 'Recebido', date: document.receivedAt, status: 'RECEIVED' },
        { label: 'Analisado', date: document.analyzedAt, status: 'IN_ANALYSIS' },
        { label: 'Aprovado', date: document.approvedAt, status: 'APPROVED' },
        { label: 'Distribuído', date: document.distributedAt, status: 'DISTRIBUTED' },
        { label: 'Liberado', date: document.releasedAt, status: 'RELEASED' }
    ];

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-bold text-blue-600">{document.code}</span>
                                <span className="text-gray-400">•</span>
                                <span className="font-mono text-sm">{document.revision}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.bgColor} ${status.color}`}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                </span>
                            </div>
                            <h1 className="text-xl font-semibold">{document.title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            <Download size={18} />
                            Download
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-4 border-b border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'preview', label: 'Visualização', icon: Eye },
                        { id: 'versions', label: `Versões (${document.versions.length})`, icon: History },
                        { id: 'analysis', label: `Análises (${document.analyses.length})`, icon: MessageSquare },
                        { id: 'timeline', label: 'Timeline', icon: Clock }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'preview' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm h-full">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-full rounded-xl"
                                    title="PDF Preview"
                                />
                            ) : document.mimeType.includes('image') ? (
                                <div className="flex items-center justify-center h-full">
                                    <img
                                        src={`/api/documents/${document.id}/download`}
                                        alt={document.title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            ) : (document.mimeType.includes('dwg') || document.mimeType.includes('dxf') || document.fileName.endsWith('.dwg') || document.fileName.endsWith('.dxf')) ? (
                                <DWGViewer documentId={document.id} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <FileText size={64} className="mb-4 opacity-50" />
                                    <p>Visualização não disponível para este tipo de arquivo</p>
                                    <p className="text-sm">{document.mimeType}</p>
                                    <button
                                        onClick={handleDownload}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
                                    >
                                        Baixar Arquivo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'versions' && (
                        <div className="space-y-4">
                            {/* Versão atual */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-blue-600 font-medium">VERSÃO ATUAL</span>
                                        <h3 className="font-mono font-bold">{document.revision}</h3>
                                        <p className="text-sm text-gray-500">{formatDate(document.receivedAt)}</p>
                                    </div>
                                    <span className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</span>
                                </div>
                            </div>

                            {/* Versões anteriores */}
                            {document.versions.map((version, index) => (
                                <div key={version.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-mono font-bold">{version.revision}</h3>
                                            <p className="text-sm text-gray-500">{formatDate(version.createdAt)}</p>
                                            {version.changes && (
                                                <p className="text-sm text-gray-600 mt-1">{version.changes}</p>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">{formatFileSize(version.fileSize)}</span>
                                    </div>
                                </div>
                            ))}

                            {document.versions.length === 0 && (
                                <p className="text-center text-gray-500 py-8">Apenas a versão atual disponível</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="space-y-4">
                            {document.analyses.map(analysis => (
                                <div key={analysis.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.result === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            analysis.result === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                analysis.result === 'APPROVED_NOTES' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {analysis.result || analysis.status}
                                        </span>
                                        <span className="text-sm text-gray-500">{formatDate(analysis.completedAt || analysis.createdAt)}</span>
                                    </div>
                                    <p className="text-sm font-medium">Revisor: {analysis.reviewerName || 'Não definido'}</p>
                                    {analysis.observations && (
                                        <p className="text-sm text-gray-600 mt-2">{analysis.observations}</p>
                                    )}
                                </div>
                            ))}

                            {document.analyses.length === 0 && (
                                <p className="text-center text-gray-500 py-8">Nenhuma análise realizada</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-6">Timeline do Documento</h2>
                            <div className="relative">
                                {timelineEvents.map((event, index) => {
                                    const isCompleted = !!event.date;
                                    const isCurrent = isCompleted && !timelineEvents[index + 1]?.date;
                                    return (
                                        <div key={event.status} className="flex gap-4 mb-8 last:mb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-4 h-4 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                                    } ${isCurrent ? 'ring-4 ring-green-200' : ''}`} />
                                                {index < timelineEvents.length - 1 && (
                                                    <div className={`w-0.5 h-12 ${isCompleted && timelineEvents[index + 1]?.date ? 'bg-green-500' : 'bg-gray-200'
                                                        }`} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className={`font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                                    {event.label}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {event.date ? formatDate(event.date) : 'Pendente'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-auto">
                    <h3 className="font-semibold mb-4">Informações</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Contrato</label>
                            <p className="font-medium">{document.contract?.number}</p>
                            <p className="text-sm text-gray-500">{document.contract?.company.name}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Categoria</label>
                            {document.category ? (
                                <p className="font-medium" style={{ color: document.category.color }}>
                                    {document.category.icon} {document.category.name}
                                </p>
                            ) : (
                                <p className="text-gray-400">Sem categoria</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Autor</label>
                            <p className="font-medium">{document.author || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Formato/Escala</label>
                            <p className="font-medium">{document.format || '-'} / {document.scale || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Arquivo</label>
                            <p className="font-medium text-sm truncate">{document.fileName}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</p>
                        </div>
                        {document.description && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Descrição</label>
                                <p className="text-sm">{document.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



