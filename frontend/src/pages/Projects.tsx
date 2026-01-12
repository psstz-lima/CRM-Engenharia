import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderOpen, FileText, Send, Search, Clock,
    CheckCircle, AlertCircle, TrendingUp, Calendar,
    ArrowRight, Filter, Download
} from 'lucide-react';
import api from '../services/api';

interface DashboardStats {
    documents: {
        total: number;
        received: number;
        inAnalysis: number;
        approved: number;
        distributed: number;
    };
    grd: {
        draft: number;
        sent: number;
        received: number;
        pending: number;
    };
    analysis: {
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
    };
}

interface RecentDocument {
    id: string;
    code: string;
    title: string;
    status: string;
    revision: string;
    createdAt: string;
    category?: { code: string; name: string; color: string };
}

interface RecentGRD {
    id: string;
    number: string;
    recipient: string;
    status: string;
    createdAt: string;
    _count?: { items: number };
}

export default function Projects() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
    const [recentGRDs, setRecentGRDs] = useState<RecentGRD[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [grdRes, analysisRes] = await Promise.all([
                api.get('/grd/dashboard'),
                api.get('/critical-analysis/dashboard')
            ]);

            setStats({
                documents: {
                    total: 0,
                    received: 0,
                    inAnalysis: 0,
                    approved: 0,
                    distributed: 0
                },
                grd: grdRes.data.stats,
                analysis: analysisRes.data
            });

            if (grdRes.data.recent) {
                setRecentGRDs(grdRes.data.recent);
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const statusColors: Record<string, string> = {
        RECEIVED: 'bg-blue-100 text-blue-700',
        IN_ANALYSIS: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        DISTRIBUTED: 'bg-purple-100 text-purple-700',
        RELEASED: 'bg-emerald-100 text-emerald-700',
        DRAFT: 'bg-gray-100 text-gray-700',
        SENT: 'bg-blue-100 text-blue-700',
        PENDING: 'bg-yellow-100 text-yellow-700'
    };

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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <FolderOpen className="text-blue-500" size={32} />
                    Projetos - Documentação Técnica
                </h1>
                <p className="text-gray-500 mt-2">
                    Gestão de documentos, análise crítica e distribuição de projetos
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={() => navigate('/contracts')}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold">Documentos</p>
                        <p className="text-sm opacity-80">Ver por contrato</p>
                    </div>
                    <ArrowRight className="ml-auto" size={20} />
                </button>

                <button
                    onClick={() => navigate('/grd')}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Send size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold">GRD</p>
                        <p className="text-sm opacity-80">Guias de Remessa</p>
                    </div>
                    <ArrowRight className="ml-auto" size={20} />
                </button>

                <button
                    onClick={() => navigate('/analysis')}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Search size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold">Análise Crítica</p>
                        <p className="text-sm opacity-80">Revisar documentos</p>
                    </div>
                    <ArrowRight className="ml-auto" size={20} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* GRD Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Send className="text-purple-600" size={20} />
                        </div>
                        <span className="text-xs text-gray-500">GRD</span>
                    </div>
                    <p className="text-2xl font-bold">{(stats?.grd.sent || 0) + (stats?.grd.received || 0)}</p>
                    <p className="text-sm text-gray-500">Guias Enviadas</p>
                    <div className="mt-2 text-xs text-green-600">
                        {stats?.grd.received || 0} confirmadas
                    </div>
                </div>

                {/* Analysis Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Search className="text-orange-600" size={20} />
                        </div>
                        <span className="text-xs text-gray-500">Análises</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.analysis.pending || 0}</p>
                    <p className="text-sm text-gray-500">Pendentes</p>
                    {(stats?.analysis.overdue || 0) > 0 && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {stats?.analysis.overdue} em atraso
                        </div>
                    )}
                </div>

                {/* In Progress Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                            <Clock className="text-yellow-600" size={20} />
                        </div>
                        <span className="text-xs text-gray-500">Em Andamento</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.analysis.inProgress || 0}</p>
                    <p className="text-sm text-gray-500">Análises em curso</p>
                </div>

                {/* Completed Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <span className="text-xs text-gray-500">Concluídas</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.analysis.completed || 0}</p>
                    <p className="text-sm text-gray-500">Análises finalizadas</p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent GRDs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Send size={18} className="text-purple-500" />
                            Últimas GRDs
                        </h2>
                        <button
                            onClick={() => navigate('/grd')}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentGRDs.length > 0 ? recentGRDs.map(grd => (
                            <div
                                key={grd.id}
                                onClick={() => navigate(`/grd/${grd.id}`)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-mono font-medium text-blue-600">{grd.number}</p>
                                        <p className="text-sm text-gray-500">{grd.recipient}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[grd.status] || 'bg-gray-100'}`}>
                                            {grd.status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(grd.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="p-4 text-center text-gray-500">Nenhuma GRD recente</p>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <FolderOpen size={18} className="text-blue-500" />
                        Acesso Rápido
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Upload Documento', icon: '📤', path: '/contracts' },
                            { label: 'Nova GRD', icon: '📬', path: '/grd' },
                            { label: 'Análises Pendentes', icon: '🔍', path: '/analysis' },
                            { label: 'Categorias', icon: '📁', path: '/projects/categories' },
                            { label: 'Relatórios', icon: '📊', path: '/projects/reports' },
                            { label: 'Contratos', icon: '📄', path: '/contracts' }
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(item.path)}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
