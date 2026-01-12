import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, Upload, Filter, Search, Grid, List,
    ChevronRight, Download, Eye, MoreVertical, Trash2,
    FolderOpen, Clock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import api from '../services/api';
import DocumentUpload from '../components/documents/DocumentUpload';

interface Document {
    id: string;
    code: string;
    title: string;
    revision: string;
    status: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category?: { code: string; name: string; color: string; icon: string };
    createdAt: string;
    _count?: { versions: number; analyses: number };
}

interface Category {
    id: string;
    code: string;
    name: string;
    color: string;
    icon: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    RECEIVED: { label: 'Recebido', color: 'bg-blue-100 text-blue-700', icon: Clock },
    IN_ANALYSIS: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    APPROVED_NOTES: { label: 'Aprovado c/ Ressalvas', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
    REJECTED: { label: 'Reprovado', color: 'bg-red-100 text-red-700', icon: XCircle },
    DISTRIBUTED: { label: 'Distribuído', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
    RELEASED: { label: 'Liberado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
};

export default function Documents() {
    const { contractId } = useParams();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [contractId, selectedCategory, selectedStatus, searchTerm]);

    const loadData = async () => {
        try {
            const url = contractId
                ? `/documents/contract/${contractId}`
                : '/documents';

            const [docsRes, catsRes] = await Promise.all([
                api.get(url, {
                    params: { categoryId: selectedCategory, status: selectedStatus, search: searchTerm }
                }),
                api.get('/documents/categories')
            ]);
            setDocuments(docsRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('dwg') || mimeType.includes('autocad')) return '📐';
        if (mimeType.includes('image')) return '🖼️';
        return '📁';
    };

    const handleDownload = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar:', error);
        }
    };

    const handleDelete = async (doc: Document) => {
        if (confirm(`Tem certeza que deseja excluir o documento "${doc.code}"?`)) {
            try {
                await api.delete(`/documents/${doc.id}`);
                loadData();
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir documento');
            }
        }
    };

    const groupedByCategory = documents.reduce((acc, doc) => {
        const catCode = doc.category?.code || 'SEM_CATEGORIA';
        if (!acc[catCode]) acc[catCode] = [];
        acc[catCode].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" />
                        {contractId ? 'Documentos do Contrato' : 'Todos os Documentos'}
                    </h1>
                    <p className="text-gray-500">{documents.length} documentos encontrados</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <Upload size={18} />
                    Upload
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por código ou título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                        <option value="">Todas as categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                        <option value="">Todos os status</option>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* View Mode */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-900'}`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-900'}`}
                        >
                            <Grid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Documents List */}
            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rev.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {documents.map(doc => {
                                const status = statusConfig[doc.status] || statusConfig.RECEIVED;
                                const StatusIcon = status.icon;
                                return (
                                    <tr
                                        key={doc.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                        onClick={() => navigate(`/documents/${doc.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-medium text-blue-600">
                                                {getFileIcon(doc.mimeType)} {doc.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{doc.title}</td>
                                        <td className="px-4 py-3">
                                            {doc.category && (
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: doc.category.color + '20', color: doc.category.color }}
                                                >
                                                    {doc.category.icon} {doc.category.code}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm">{doc.revision}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(doc.fileSize)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => navigate(`/documents/${doc.id}`)}
                                                    className="p-1 text-gray-500 hover:text-blue-500"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="p-1 text-gray-500 hover:text-green-500"
                                                    title="Download"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc)}
                                                    className="p-1 text-gray-500 hover:text-red-500"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {documents.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum documento encontrado</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {documents.map(doc => {
                        const status = statusConfig[doc.status] || statusConfig.RECEIVED;
                        return (
                            <div
                                key={doc.id}
                                onClick={() => navigate(`/documents/${doc.id}`)}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-3xl">{getFileIcon(doc.mimeType)}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <h3 className="font-medium text-sm mb-1 truncate">{doc.title}</h3>
                                <p className="text-xs text-gray-500 font-mono mb-2">{doc.code} • {doc.revision}</p>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                    {doc.category && (
                                        <span style={{ color: doc.category.color }}>
                                            {doc.category.icon} {doc.category.code}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <DocumentUpload
                    contractId={contractId}
                    categories={categories}
                    onSuccess={() => { setShowUploadModal(false); loadData(); }}
                    onClose={() => setShowUploadModal(false)}
                />
            )}
        </div>
    );
}
