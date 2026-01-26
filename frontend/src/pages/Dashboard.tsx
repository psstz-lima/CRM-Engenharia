import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CheckCircle,
    ClipboardList,
    FileText,
    Mail,
    Ruler,
    Sparkles,
    Star,
    Trophy,
    TrendingUp,
    Users,
    Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import api from '../services/api';

interface TimelineData {
    month: string;
    label: string;
    total: number;
    approved: number;
    closed: number;
    draft: number;
}

interface TopContract {
    id: string;
    number: string;
    company: string;
    totalValue: number;
    percentExecuted: string;
}

interface ExpiringContract {
    id: string;
    number: string;
    company: string;
    endDate: string;
    daysRemaining: number;
}

interface PendingApproval {
    id: string;
    contractNumber: string;
    company: string;
    number: number;
    periodEnd: string;
}

export function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>({ totals: {}, charts: {} });
    const [timeline, setTimeline] = useState<TimelineData[]>([]);
    const [topContracts, setTopContracts] = useState<TopContract[]>([]);
    const [expiringContracts, setExpiringContracts] = useState<ExpiringContract[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const [statsRes, timelineRes, topRes, expiringRes, pendingRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/timeline'),
                api.get('/dashboard/top-contracts'),
                api.get('/dashboard/expiring-contracts'),
                api.get('/dashboard/pending-approvals')
            ]);
            setStats(statsRes.data);
            setTimeline(timelineRes.data);
            setTopContracts(topRes.data);
            setExpiringContracts(expiringRes.data);
            setPendingApprovals(pendingRes.data);
        } catch {
            // noop
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const StatCard = ({ title, value, icon, tone, subtitle, to }: { title: string, value: number | string, icon: React.ReactNode, tone: string, subtitle?: string, to?: string }) => (
        <div className={`stat-card ${to ? 'stat-card-link' : ''}`}>
            <div className="stat-head">
                <div className={`stat-icon ${tone}`}>
                    {icon}
                </div>
                <span className="stat-label">{title}</span>
            </div>
            <div className="stat-value">{value}</div>
            <div className={`stat-foot ${subtitle ? '' : 'stat-foot--empty'}`}>
                {subtitle || '\u00a0'}
            </div>
        </div>
    );

    const MiniChart = ({ data }: { data: TimelineData[] }) => {
        const maxVal = Math.max(...data.map(d => d.total), 1);
        return (
            <div className="flex items-end gap-2 h-32 mt-4">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                            <div
                                className="w-full rounded-t"
                                style={{ height: `${(d.approved / maxVal) * 100}%`, background: '#2f7d62' }}
                                title={`Aprovadas: ${d.approved}`}
                            />
                            <div
                                className="w-full"
                                style={{ height: `${(d.closed / maxVal) * 100}%`, background: '#b9962f' }}
                                title={`Fechadas: ${d.closed}`}
                            />
                            <div
                                className="w-full rounded-b"
                                style={{ height: `${(d.draft / maxVal) * 100}%`, background: '#5d7688' }}
                                title={`Rascunho: ${d.draft}`}
                            />
                        </div>
                        <span className="text-xs opacity-60">{d.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    const ProgressBar = ({ percent }: { percent: number }) => (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full"
                style={{ width: `${percent}%`, background: '#2f7d62' }}
            />
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            <Card variant="glow" padding="lg">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="tile-icon tile-icon--gold">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Bem-vindo de volta, {user?.fullName?.split(' ')[0]}!
                            </h1>
                            <p className="text-sm text-gray-600">Acompanhe as atividades e métricas do sistema.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-white/70 rounded-xl text-sm flex items-center gap-2 border border-">
                            <Mail size={16} className="text-" />
                            {user?.email}
                        </div>
                        <div className="px-4 py-2 bg-white/70 rounded-xl text-sm flex items-center gap-2 border border-">
                            <Building2 size={16} className="text-" />
                            {user?.company?.name || 'Sem empresa'}
                        </div>
                        <div className="px-4 py-2 bg-white/70 rounded-xl text-sm flex items-center gap-2 border border-">
                            <ClipboardList size={16} className="text-" />
                            {user?.role?.name || 'Sem perfil'}
                        </div>
                        {user?.isMaster && (
                            <div className="px-4 py-2 bg-amber-100 rounded-xl text-sm flex items-center gap-2 border border-amber-200 text-amber-700 font-medium">
                                <Star size={16} /> Usuário Master
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-8">Carregando estatísticas...</div>
            ) : (
                <>
                    <div>
                        <PageHeader title="Visão Geral" subtitle="Métricas gerais do sistema" icon={<BarChart3 className="text-" />} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <Link to="/contracts" className="block">
                                <StatCard
                                    title="Contratos"
                                    value={stats.totals.contracts || 0}
                                    icon={<FileText size={18} />}
                                    tone="tile-icon--cool"
                                    subtitle={`${stats.totals.activeContracts || 0} ativos`}
                                    to="/contracts"
                                />
                            </Link>
                            <Link to="/measurements" className="block">
                                <StatCard
                                    title="Medições"
                                    value={stats.totals.measurements || 0}
                                    icon={<Ruler size={18} />}
                                    tone="tile-icon--emerald"
                                    subtitle={`${stats.totals.openMeasurements || 0} abertas`}
                                    to="/measurements"
                                />
                            </Link>
                            <Link to="/admin/companies" className="block">
                                <StatCard
                                    title="Empresas"
                                    value={stats.totals.companies || 0}
                                    icon={<Building2 size={18} />}
                                    tone="tile-icon--gold"
                                    to="/admin/companies"
                                />
                            </Link>
                            <Link to="/admin/users" className="block">
                                <StatCard
                                    title="Usuários ativos"
                                    value={stats.totals.users || 0}
                                    icon={<Users size={18} />}
                                    tone="tile-icon--rose"
                                    to="/admin/users"
                                />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            <Card className="lg:col-span-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Wallet size={18} className="text-emerald-700" />
                                    <h3 className="text-lg font-semibold">Valor total em contratos</h3>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.totals.contractValue)}</p>
                                <div className="mt-4 space-y-2">
                                    {stats.charts.measurementsByStatus?.map((item: any) => (
                                        <div key={item.status} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="text-sm">{item.status}</span>
                                            <span className="font-bold" style={{ color: item.color }}>
                                                {formatCurrency(item.count)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card className="lg:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-amber-700" />
                                    <h3 className="text-lg font-semibold">Evolução de medições (6 meses)</h3>
                                </div>
                                <div className="flex gap-4 text-xs mb-2">
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#2f7d62' }} /> Aprovadas</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#b9962f' }} /> Fechadas</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#5d7688' }} /> Rascunho</span>
                                </div>
                                {timeline.length > 0 ? (
                                    <MiniChart data={timeline} />
                                ) : (
                                    <p className="text-sm opacity-60 py-8 text-center">Sem dados de medições</p>
                                )}
                            </Card>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy size={18} className="text-amber-700" />
                                <h3 className="text-lg font-semibold">Top 5 contratos por valor</h3>
                            </div>
                            {topContracts.length > 0 ? (
                                <div className="space-y-4">
                                    {topContracts.map((c, i) => (
                                        <a key={c.id} href={`/contracts/${c.id}`} className="block hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-500">#{i + 1}</span>
                                                    <span className="font-medium">{c.number}</span>
                                                </div>
                                                <span className="text-emerald-600 font-bold">{formatCurrency(c.totalValue)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm opacity-70 mb-2">
                                                <span>{c.company}</span>
                                                <span>{c.percentExecuted}% executado</span>
                                            </div>
                                            <ProgressBar percent={parseFloat(c.percentExecuted)} />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm opacity-60 py-4 text-center">Nenhum contrato cadastrado</p>
                            )}
                        </Card>

                        <div className="space-y-6">
                            <Card className={expiringContracts.length > 0 ? 'border-l-4 border-l-amber-400' : ''}>
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle size={18} className="text-amber-700" />
                                    <h3 className="text-lg font-semibold">Contratos vencendo (30 dias)</h3>
                                </div>
                                {expiringContracts.length > 0 ? (
                                    <div className="space-y-3">
                                        {expiringContracts.slice(0, 5).map(c => (
                                            <a key={c.id} href={`/contracts/${c.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                                                <div>
                                                    <p className="font-medium">{c.number}</p>
                                                    <p className="text-xs opacity-60">{c.company}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${c.daysRemaining <= 7 ? 'text-red-500' : 'text-amber-600'}`}>
                                                        {c.daysRemaining} dias
                                                    </p>
                                                    <p className="text-xs opacity-60">{formatDate(c.endDate)}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                                        <CheckCircle size={16} /> Nenhum contrato vencendo em breve
                                    </div>
                                )}
                            </Card>

                            <Card className={pendingApprovals.length > 0 ? 'border-l-4 border-l-blue-400' : ''}>
                                <div className="flex items-center gap-2 mb-4">
                                    <ClipboardList size={18} className="text-blue-700" />
                                    <h3 className="text-lg font-semibold">Medições pendentes de aprovação</h3>
                                </div>
                                {pendingApprovals.length > 0 ? (
                                    <div className="space-y-3">
                                        {pendingApprovals.slice(0, 5).map(m => (
                                            <a key={m.id} href={`/measurements/${m.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                                                <div>
                                                    <p className="font-medium">Medição #{m.number}</p>
                                                    <p className="text-xs opacity-60">{m.contractNumber} - {m.company}</p>
                                                </div>
                                                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    Aguardando
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                                        <CheckCircle size={16} /> Nenhuma medição pendente
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    <div>
                        <PageHeader title="Acesso rápido" subtitle="Navegue rapidamente pelas principais funcionalidades" icon={<Sparkles className="text-" />} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <Link to="/contracts" className="tile">
                                <div className="tile-icon tile-icon--cool">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div className="tile-title">Contratos</div>
                                    <div className="tile-subtitle">Gerencie contratos e aditivos</div>
                                </div>
                            </Link>
                            <Link to="/measurements" className="tile">
                                <div className="tile-icon tile-icon--emerald">
                                    <Ruler size={18} />
                                </div>
                                <div>
                                    <div className="tile-title">Medições</div>
                                    <div className="tile-subtitle">Registre e acompanhe medições</div>
                                </div>
                            </Link>
                            <Link to="/admin/companies" className="tile">
                                <div className="tile-icon tile-icon--gold">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <div className="tile-title">Empresas</div>
                                    <div className="tile-subtitle">Cadastro de empresas parceiras</div>
                                </div>
                            </Link>
                            <Link to="/admin/users" className="tile">
                                <div className="tile-icon tile-icon--rose">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <div className="tile-title">Usuários</div>
                                    <div className="tile-subtitle">Gerencie usuários do sistema</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
