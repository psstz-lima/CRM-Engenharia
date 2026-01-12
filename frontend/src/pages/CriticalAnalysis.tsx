import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Clock, CheckCircle, XCircle, AlertCircle,
    FileText, User, Calendar, ChevronRight, Filter
} from 'lucide-react';
import api from '../services/api';

interface Analysis {
    id: string;
    status: string;
    result?: string;
    reviewerName?: string;
    deadline?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    document: {
        id: string;
        code: string;
        title: string;
        revision: string;
        category?: { code: string; name: string; color: string };
        contract?: { number: string; company: { name: string } };
    };
}

interface DashboardStats {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Pendente', color: 'bg-gray-100 text-gray-700', icon: Clock },
    IN_PROGRESS: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    COMPLETED: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle }
};

const resultConfig: Record<string, { label: string; color: string }> = {
    APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Reprovado', color: 'bg-red-100 text-red-700' },
    APPROVED_NOTES: { label: 'Aprovado c/ Ressalvas', color: 'bg-orange-100 text-orange-700' }
};

export default function CriticalAnalysis() {
    const navigate = useNavigate();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pendingRes, dashRes] = await Promise.all([
                api.get('/critical-analysis/pending'),
                api.get('/critical-analysis/dashboard')
            ]);
            setAnalyses(pendingRes.data);
            setStats(dashRes.data);
        } catch (error) {
            console.error('Erro ao carregar análises:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartAnalysis = async (id: string) => {
        try {
            await api.post(`/critical-analysis/${id}/start`);
            loadData();
        } catch (error) {
            console.error('Erro ao iniciar análise:', error);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const isOverdue = (deadline?: string) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    const filteredAnalyses = analyses.filter(a => {
        const matchesSearch = a.document.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.document.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || a.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

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
                        <Search className="text-orange-500" />
                        Análise Crítica
                    </h1>
                    <p className="text-gray-500">Revisão técnica de documentos</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-gray-400">
                        <div className="flex items-center gap-3">
                            <Clock className="text-gray-500" size={24} />
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Pendentes</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-yellow-400">
                        <div className="flex items-center gap-3">
                            <Clock className="text-yellow-500" size={24} />
                            <div>
                                <p className="text-2xl font-bold">{stats.inProgress}</p>
                                <p className="text-sm text-gray-500">Em Andamento</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-400">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-500" size={24} />
                            <div>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                                <p className="text-sm text-gray-500">Concluídas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-red-400">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={24} />
                            <div>
                                <p className="text-2xl font-bold">{stats.overdue}</p>
                                <p className="text-sm text-gray-500">Em Atraso</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                        <option value="">Todos os status</option>
                        <option value="PENDING">Pendente</option>
                        <option value="IN_PROGRESS">Em Andamento</option>
                    </select>
                </div>
            </div>

            {/* Analysis List */}
            <div className="space-y-4">
                {filteredAnalyses.length > 0 ? filteredAnalyses.map(analysis => {
                    const status = statusConfig[analysis.status] || statusConfig.PENDING;
                    const StatusIcon = status.icon;
                    const overdue = isOverdue(analysis.deadline);

                    return (
                        <div
                            key={analysis.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${overdue ? 'border-red-500' : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <FileText className="text-gray-500" size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3
                                                className="font-mono font-medium text-blue-600 cursor-pointer hover:underline"
                                                onClick={() => navigate(`/documents/${analysis.document.id}`)}
                                            >
                                                {analysis.document.code}
                                            </h3>
                                            <span className="text-xs text-gray-400">{analysis.document.revision}</span>
                                            {analysis.document.category && (
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs"
                                                    style={{ backgroundColor: analysis.document.category.color + '20', color: analysis.document.category.color }}
                                                >
                                                    {analysis.document.category.code}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.document.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {analysis.document.contract?.number} • {analysis.document.contract?.company.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Deadline */}
                                    {analysis.deadline && (
                                        <div className={`text-sm ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>Prazo: {formatDate(analysis.deadline)}</span>
                                            </div>
                                            {overdue && <span className="text-xs">⚠️ Atrasado</span>}
                                        </div>
                                    )}

                                    {/* Reviewer */}
                                    {analysis.reviewerName && (
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <User size={14} />
                                            {analysis.reviewerName}
                                        </div>
                                    )}

                                    {/* Status */}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                                        <StatusIcon size={12} />
                                        {status.label}
                                    </span>

                                    {/* Actions */}
                                    {analysis.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleStartAnalysis(analysis.id)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1"
                                        >
                                            Iniciar
                                            <ChevronRight size={16} />
                                        </button>
                                    )}
                                    {analysis.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => navigate(`/analysis/${analysis.id}`)}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center gap-1"
                                        >
                                            Continuar
                                            <ChevronRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                        <p className="text-gray-500">Nenhuma análise pendente</p>
                        <p className="text-sm text-gray-400">Todas as análises foram concluídas!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
