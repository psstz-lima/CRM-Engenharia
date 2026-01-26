import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BarChart3,
    CheckCircle,
    Clock,
    FileText,
    FolderOpen,
    Library,
    Search,
    Send,
    Upload
} from 'lucide-react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';

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
        RECEIVED: 'bg-blue-500/10 text-blue-600',
        IN_ANALYSIS: 'bg-amber-500/10 text-amber-600',
        APPROVED: 'bg-emerald-500/10 text-emerald-600',
        DISTRIBUTED: 'bg-purple-500/10 text-purple-600',
        RELEASED: 'bg-emerald-500/10 text-emerald-600',
        DRAFT: 'bg-slate-200 text-slate-600',
        SENT: 'bg-blue-500/10 text-blue-600',
        PENDING: 'bg-amber-500/10 text-amber-600'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <PageHeader
                title="Projetos - Documentação Técnica"
                subtitle="Gestão de documentos, análise crítica e distribuição de projetos"
                icon={<FolderOpen className="text-" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/contracts')}
                    className="tile"
                >
                    <div className="tile-icon tile-icon--cool">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="tile-title">Documentos</div>
                        <div className="tile-subtitle">Ver por contrato</div>
                    </div>
                    <ArrowRight size={18} className="tile-arrow" />
                </button>

                <button
                    onClick={() => navigate('/grd')}
                    className="tile"
                >
                    <div className="tile-icon tile-icon--gold">
                        <Send size={20} />
                    </div>
                    <div>
                        <div className="tile-title">GRD</div>
                        <div className="tile-subtitle">Guias de remessa</div>
                    </div>
                    <ArrowRight size={18} className="tile-arrow" />
                </button>

                <button
                    onClick={() => navigate('/analysis')}
                    className="tile"
                >
                    <div className="tile-icon tile-icon--rose">
                        <Search size={20} />
                    </div>
                    <div>
                        <div className="tile-title">Análise crítica</div>
                        <div className="tile-subtitle">Revisar documentos</div>
                    </div>
                    <ArrowRight size={18} className="tile-arrow" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="stat-head">
                        <div className="stat-icon tile-icon--gold">
                            <Send size={18} />
                        </div>
                        <span className="stat-label">GRD</span>
                    </div>
                    <div className="stat-value">{(stats?.grd.sent || 0) + (stats?.grd.received || 0)}</div>
                    <div className="stat-foot">Guias enviadas</div>
                    <div className="text-xs text-emerald-700">{stats?.grd.received || 0} confirmadas</div>
                </div>

                <div className="stat-card">
                    <div className="stat-head">
                        <div className="stat-icon tile-icon--rose">
                            <Search size={18} />
                        </div>
                        <span className="stat-label">Análises</span>
                    </div>
                    <div className="stat-value">{stats?.analysis.pending || 0}</div>
                    <div className="stat-foot">Pendentes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-head">
                        <div className="stat-icon tile-icon--cool">
                            <Clock size={18} />
                        </div>
                        <span className="stat-label">Em andamento</span>
                    </div>
                    <div className="stat-value">{stats?.analysis.inProgress || 0}</div>
                    <div className="stat-foot">Análises em curso</div>
                </div>

                <div className="stat-card">
                    <div className="stat-head">
                        <div className="stat-icon tile-icon--emerald">
                            <CheckCircle size={18} />
                        </div>
                        <span className="stat-label">Concluídas</span>
                    </div>
                    <div className="stat-value">{stats?.analysis.completed || 0}</div>
                    <div className="stat-foot">Análises finalizadas</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="panel">
                    <div className="panel-header">
                        <div className="flex items-center gap-2">
                            <Send size={18} className="text-amber-700" />
                            <span className="font-semibold">Últimas GRDs</span>
                        </div>
                        <button
                            onClick={() => navigate('/grd')}
                            className="btn btn-ghost btn-sm"
                        >
                            Ver todas
                        </button>
                    </div>
                    <div>
                        {recentGRDs.length > 0 ? recentGRDs.map(grd => (
                            <div
                                key={grd.id}
                                onClick={() => navigate(`/grd/${grd.id}`)}
                                className="panel-item cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-mono font-semibold text-amber-700">{grd.number}</p>
                                        <p className="text-sm text-gray-500">{grd.recipient}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[grd.status] || 'bg-slate-200 text-slate-600'}`}>
                                            {grd.status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(grd.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="panel-body text-center text-sm text-gray-500">
                                Nenhuma GRD recente
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-header">
                        <div className="flex items-center gap-2">
                            <Library size={18} className="text-" />
                            <span className="font-semibold">Acesso rápido</span>
                        </div>
                    </div>
                    <div className="panel-body">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Upload documento', icon: <Upload size={18} />, path: '/contracts', tone: 'tile-icon--cool' },
                                { label: 'Nova GRD', icon: <Send size={18} />, path: '/grd', tone: 'tile-icon--gold' },
                                { label: 'Análises pendentes', icon: <Search size={18} />, path: '/analysis', tone: 'tile-icon--rose' },
                                { label: 'Categorias', icon: <FolderOpen size={18} />, path: '/projects/categories', tone: 'tile-icon--emerald' },
                                { label: 'Relatórios', icon: <BarChart3 size={18} />, path: '/projects/reports', tone: 'tile-icon--cool' },
                                { label: 'Contratos', icon: <FileText size={18} />, path: '/contracts', tone: 'tile-icon--gold' }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    className="tile tile-compact"
                                >
                                    <div className={`tile-icon ${item.tone}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-semibold">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
