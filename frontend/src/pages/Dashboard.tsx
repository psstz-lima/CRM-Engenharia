import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import api from '../services/api';

export function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ users: 0, companies: 0, contracts: 0, measurements: 0 });

    useEffect(() => {
        if (user?.isMaster) loadStats();
    }, [user]);

    const loadStats = async () => {
        try {
            const [users, companies, contracts] = await Promise.all([
                api.get('/users'),
                api.get('/companies'),
                api.get('/contracts'),
            ]);
            const usersData = users.data.data || users.data;
            setStats({
                users: usersData.length,
                companies: companies.data.length,
                contracts: contracts.data.data?.length || contracts.data.length || 0,
                measurements: 0
            });
        } catch { }
    };

    const StatCard = ({ title, value, icon, gradient }: { title: string, value: number, icon: string, gradient: string }) => (
        <Card hover className="group">
            <div className="flex items-center gap-4">
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg ${gradient}`}
                    style={{ boxShadow: 'var(--shadow-glow)' }}
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Welcome Banner */}
            <div
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    boxShadow: 'var(--shadow-lg), var(--shadow-glow)'
                }}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl -mr-32 -mt-32 pointer-events-none"
                    style={{ background: 'white' }}
                ></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl -ml-16 -mb-16 pointer-events-none"
                    style={{ background: 'white' }}
                ></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">👋</span>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Bem-vindo de volta, {user?.fullName?.split(' ')[0]}!
                            </h1>
                            <p className="text-gray-900/70 mt-1">
                                Acompanhe as atividades e métricas do sistema
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-gray-900/90 text-sm flex items-center gap-2 border border-white/10">
                            <span>📧</span> {user?.email}
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-gray-900/90 text-sm flex items-center gap-2 border border-white/10">
                            <span>🏢</span> {user?.company?.name || 'Sem empresa'}
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-gray-900/90 text-sm flex items-center gap-2 border border-white/10">
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

            {/* Stats Grid */}
            {user?.isMaster && (
                <div>
                    <PageHeader
                        title="Visão Geral"
                        subtitle="Métricas gerais do sistema"
                        icon="📊"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        <StatCard
                            title="Usuários Ativos"
                            value={stats.users}
                            icon="👥"
                            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                        />
                        <StatCard
                            title="Empresas"
                            value={stats.companies}
                            icon="🏢"
                            gradient="bg-gradient-to-br from-violet-500 to-violet-600"
                        />
                        <StatCard
                            title="Contratos"
                            value={stats.contracts}
                            icon="📄"
                            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        />
                        <StatCard
                            title="Medições"
                            value={stats.measurements}
                            icon="📏"
                            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                        />
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <PageHeader
                    title="Acesso Rápido"
                    subtitle="Navegue rapidamente pelas principais funcionalidades"
                    icon="⚡"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    <a href="/contracts" className="group">
                        <Card hover className="h-full">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    📄
                                </div>
                                <div>
                                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contratos</h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Gerencie contratos e aditivos
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </a>
                    <a href="/measurements" className="group">
                        <Card hover className="h-full">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    📏
                                </div>
                                <div>
                                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Medições</h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Registre e acompanhe medições
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </a>
                    <a href="/companies" className="group">
                        <Card hover className="h-full">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    🏢
                                </div>
                                <div>
                                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Empresas</h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Cadastro de empresas parceiras
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </a>
                </div>
            </div>
        </div>
    );
}
