import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        } catch { }
        finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const StatCard = ({ title, value, icon, gradient, subtitle }: { title: string, value: number | string, icon: string, gradient: string, subtitle?: string }) => (
        <Card hover className="group">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg ${gradient}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
                </div>
            </div>
        </Card>
    );

    // Mini chart component for timeline
    const MiniChart = ({ data }: { data: TimelineData[] }) => {
        const maxVal = Math.max(...data.map(d => d.total), 1);
        return (
            <div className="flex items-end gap-2 h-32 mt-4">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                            <div
                                className="w-full bg-emerald-500 rounded-t transition-all"
                                style={{ height: `${(d.approved / maxVal) * 100}%` }}
                                title={`Aprovadas: ${d.approved}`}
                            />
                            <div
                                className="w-full bg-amber-500 transition-all"
                                style={{ height: `${(d.closed / maxVal) * 100}%` }}
                                title={`Fechadas: ${d.closed}`}
                            />
                            <div
                                className="w-full bg-blue-500 rounded-b transition-all"
                                style={{ height: `${(d.draft / maxVal) * 100}%` }}
                                title={`Rascunho: ${d.draft}`}
                            />
                        </div>
                        <span className="text-xs opacity-60">{d.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Progress bar component
    const ProgressBar = ({ percent, color = 'emerald' }: { percent: number; color?: string }) => (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
                className={`h-full bg-${color}-500 transition-all duration-500`}
                style={{ width: `${percent}%`, backgroundColor: color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : '#ef4444' }}
            />
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Welcome Banner */}
            <div className="relative rounded-2xl p-8 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl -mr-32 -mt-32 pointer-events-none" style={{ background: 'white' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl -ml-16 -mb-16 pointer-events-none" style={{ background: 'white' }} />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">👋</span>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Bem-vindo de volta, {user?.fullName?.split(' ')[0]}!
                            </h1>
                            <p className="text-white/70 mt-1">
                                Acompanhe as atividades e métricas do sistema
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white/90 text-sm flex items-center gap-2 border border-white/10">
                            <span>📧</span> {user?.email}
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white/90 text-sm flex items-center gap-2 border border-white/10">
                            <span>🏢</span> {user?.company?.name || 'Sem empresa'}
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white/90 text-sm flex items-center gap-2 border border-white/10">
                            <span>🔐</span> {user?.role?.name || 'Sem perfil'}
                        </div>
                        {user?.isMaster && (
                            <div className="px-4 py-2 bg-amber-400/20 backdrop-blur-sm rounded-xl text-amber-200 text-sm flex items-center gap-2 border border-amber-400/30 font-medium">
                                <span>⭐</span> Usuário Master
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Carregando estatísticas...</div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div>
                        <PageHeader title="Visão Geral" subtitle="Métricas gerais do sistema" icon="📊" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <StatCard
                                title="Total de Contratos"
                                value={stats.totals.contracts || 0}
                                icon="📄"
                                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                                subtitle={`${stats.totals.activeContracts || 0} ativos`}
                            />
                            <StatCard
                                title="Medições"
                                value={stats.totals.measurements || 0}
                                icon="📏"
                                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                                subtitle={`${stats.totals.openMeasurements || 0} abertas`}
                            />
                            <StatCard
                                title="Empresas"
                                value={stats.totals.companies || 0}
                                icon="🏢"
                                gradient="bg-gradient-to-br from-violet-500 to-violet-600"
                            />
                            <StatCard
                                title="Usuários Ativos"
                                value={stats.totals.users || 0}
                                icon="👥"
                                gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                            />
                        </div>

                        {/* Second row: Value + Timeline */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            <Card className="lg:col-span-1">
                                <h3 className="text-lg font-semibold mb-4">💰 Valor Total em Contratos</h3>
                                <p className="text-3xl font-bold text-emerald-500">{formatCurrency(stats.totals.contractValue)}</p>
                                <div className="mt-4 space-y-2">
                                    {stats.charts.measurementsByStatus?.map((item: any) => (
                                        <div key={item.status} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="text-sm">{item.status}</span>
                                            <span className="font-bold" style={{ color: item.color }}>{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card className="lg:col-span-2">
                                <h3 className="text-lg font-semibold mb-2">📈 Evolução de Medições (6 meses)</h3>
                                <div className="flex gap-4 text-xs mb-2">
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded" /> Aprovadas</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded" /> Fechadas</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> Rascunho</span>
                                </div>
                                {timeline.length > 0 ? (
                                    <MiniChart data={timeline} />
                                ) : (
                                    <p className="text-sm opacity-60 py-8 text-center">Sem dados de medições</p>
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* Top Contracts + Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Contracts */}
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">🏆 Top 5 Contratos por Valor</h3>
                            {topContracts.length > 0 ? (
                                <div className="space-y-4">
                                    {topContracts.map((c, i) => (
                                        <a key={c.id} href={`/contracts/${c.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-2 rounded-lg transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                                                    <span className="font-medium">{c.number}</span>
                                                </div>
                                                <span className="text-emerald-500 font-bold">{formatCurrency(c.totalValue)}</span>
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

                        {/* Alerts Section */}
                        <div className="space-y-6">
                            {/* Expiring Contracts */}
                            <Card className={expiringContracts.length > 0 ? 'border-l-4 border-l-amber-500' : ''}>
                                <h3 className="text-lg font-semibold mb-4">⚠️ Contratos Vencendo (30 dias)</h3>
                                {expiringContracts.length > 0 ? (
                                    <div className="space-y-3">
                                        {expiringContracts.slice(0, 5).map(c => (
                                            <a key={c.id} href={`/contracts/${c.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 transition-colors">
                                                <div>
                                                    <p className="font-medium">{c.number}</p>
                                                    <p className="text-xs opacity-60">{c.company}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${c.daysRemaining <= 7 ? 'text-red-500' : 'text-amber-500'}`}>
                                                        {c.daysRemaining} dias
                                                    </p>
                                                    <p className="text-xs opacity-60">{formatDate(c.endDate)}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm opacity-60 py-4 text-center">✅ Nenhum contrato vencendo em breve</p>
                                )}
                            </Card>

                            {/* Pending Approvals */}
                            <Card className={pendingApprovals.length > 0 ? 'border-l-4 border-l-blue-500' : ''}>
                                <h3 className="text-lg font-semibold mb-4">📋 Medições Pendentes de Aprovação</h3>
                                {pendingApprovals.length > 0 ? (
                                    <div className="space-y-3">
                                        {pendingApprovals.slice(0, 5).map(m => (
                                            <a key={m.id} href={`/measurements/${m.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 transition-colors">
                                                <div>
                                                    <p className="font-medium">Medição #{m.number}</p>
                                                    <p className="text-xs opacity-60">{m.contractNumber} - {m.company}</p>
                                                </div>
                                                <div className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full text-xs font-medium">
                                                    Aguardando
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm opacity-60 py-4 text-center">✅ Nenhuma medição pendente</p>
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <PageHeader title="Acesso Rápido" subtitle="Navegue rapidamente pelas principais funcionalidades" icon="⚡" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <Link to="/contracts" className="group">
                                <Card hover className="h-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">📄</div>
                                        <div>
                                            <h3 className="font-semibold">Contratos</h3>
                                            <p className="text-sm mt-1 opacity-70">Gerencie contratos e aditivos</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                            <Link to="/measurements" className="group">
                                <Card hover className="h-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">📏</div>
                                        <div>
                                            <h3 className="font-semibold">Medições</h3>
                                            <p className="text-sm mt-1 opacity-70">Registre e acompanhe medições</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                            <Link to="/admin/companies" className="group">
                                <Card hover className="h-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">🏢</div>
                                        <div>
                                            <h3 className="font-semibold">Empresas</h3>
                                            <p className="text-sm mt-1 opacity-70">Cadastro de empresas parceiras</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                            <Link to="/admin/users" className="group">
                                <Card hover className="h-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">👥</div>
                                        <div>
                                            <h3 className="font-semibold">Usuários</h3>
                                            <p className="text-sm mt-1 opacity-70">Gerencie usuários do sistema</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
