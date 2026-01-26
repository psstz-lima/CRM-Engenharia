import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileCode2,
    FileImage,
    FileText,
    Filter,
    FolderOpen,
    Grid,
    List,
    Search,
    Trash2,
    Upload,
    Eye,
    Download,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle
} from 'lucide-react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
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
    RECEIVED: { label: 'Recebido', color: 'bg-blue-500/10 text-blue-600', icon: Clock },
    IN_ANALYSIS: { label: 'Em análise', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
    APPROVED: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
    APPROVED_NOTES: { label: 'Aprovado c/ ressalvas', color: 'bg-orange-500/10 text-orange-600', icon: AlertCircle },
    REJECTED: { label: 'Reprovado', color: 'bg-red-500/10 text-red-600', icon: XCircle },
    DISTRIBUTED: { label: 'Distribuído', color: 'bg-purple-500/10 text-purple-600', icon: CheckCircle },
    RELEASED: { label: 'Liberado', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle }
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
        if (mimeType.includes('pdf')) return FileText;
        if (mimeType.includes('dwg') || mimeType.includes('autocad')) return FileCode2;
        if (mimeType.includes('image')) return FileImage;
        return FileText;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <PageHeader
                title={contractId ? 'Documentos do Contrato' : 'Todos os Documentos'}
                subtitle={`${documents.length} documentos encontrados`}
                icon={<FileText className="text-" />}
                actions={
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Upload size={16} />
                        Upload
                    </button>
                }
            />

            <Card className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por código ou título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input w-[220px]"
                    >
                        <option value="">Todas as categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="input w-[200px]"
                    >
                        <option value="">Todos os status</option>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-" />
                        <div className="flex border border- rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg- text-gray-900' : 'bg-'}`}
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg- text-gray-900' : 'bg-'}`}
                            >
                                <Grid size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {viewMode === 'list' ? (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg- text- text-xs uppercase font-semibold border-b border-">
                                <tr>
                                    <th className="px-4 py-3 text-left">Código</th>
                                    <th className="px-4 py-3 text-left">Título</th>
                                    <th className="px-4 py-3 text-left">Categoria</th>
                                    <th className="px-4 py-3 text-left">Rev.</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Tamanho</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-">
                                {documents.map(doc => {
                                    const status = statusConfig[doc.status] || statusConfig.RECEIVED;
                                    const StatusIcon = status.icon;
                                    const FileIcon = getFileIcon(doc.mimeType);
                                    return (
                                        <tr
                                            key={doc.id}
                                            className="hover:bg- transition-colors cursor-pointer"
                                            onClick={() => navigate(`/documents/${doc.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-">
                                                    <FileIcon size={16} className="text-" />
                                                    {doc.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-">{doc.title}</td>
                                            <td className="px-4 py-3">
                                                {doc.category && (
                                                    <span
                                                        className="px-2 py-1 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: `${doc.category.color}22`, color: doc.category.color }}
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
                                                        className="p-1 text- hover:text- transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(doc)}
                                                        className="p-1 text- hover:text-emerald-600 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(doc)}
                                                        className="p-1 text- hover:text-red-600 transition-colors"
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
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {documents.map(doc => {
                        const status = statusConfig[doc.status] || statusConfig.RECEIVED;
                        const FileIcon = getFileIcon(doc.mimeType);
                        return (
                            <Card
                                key={doc.id}
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/documents/${doc.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="tile-icon tile-icon--cool">
                                        <FileIcon size={18} />
                                    </div>
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
                            </Card>
                        );
                    })}
                </div>
            )}

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
