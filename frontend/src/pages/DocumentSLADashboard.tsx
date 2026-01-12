import { useState, useEffect } from 'react';
import {
    Clock, CheckCircle, AlertTriangle, TrendingUp,
    BarChart2, Calendar, FileText, Users
} from 'lucide-react';
import api from '../services/api';

interface SLAMetrics {
    averageAnalysisTime: number; // em horas
    averageApprovalTime: number;
    averageDistributionTime: number;
    totalCycleTime: number;
    documentsInSLA: number;
    documentsOutOfSLA: number;
    slaComplianceRate: number;
    pendingAnalysis: number;
    overdueAnalysis: number;
    byCategory: Array<{
        category: string;
        count: number;
        avgTime: number;
    }>;
    byReviewer: Array<{
        name: string;
        completed: number;
        avgTime: number;
    }>;
    timeline: Array<{
        date: string;
        received: number;
        analyzed: number;
        approved: number;
    }>;
}

// Valores de SLA padrão em horas
const SLA_LIMITS = {
    analysis: 48,      // 48h para análise
    approval: 24,      // 24h para aprovação
    distribution: 8,   // 8h para distribuição
    totalCycle: 120    // 5 dias úteis
};

export default function DocumentSLADashboard() {
    const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30'); // últimos 30 dias

    useEffect(() => {
        loadMetrics();
    }, [period]);

    const loadMetrics = async () => {
        try {
            // Simulando dados por enquanto - depois integrar com API real
            const mockMetrics: SLAMetrics = {
                averageAnalysisTime: 36,
                averageApprovalTime: 18,
                averageDistributionTime: 6,
                totalCycleTime: 72,
                documentsInSLA: 45,
                documentsOutOfSLA: 8,
                slaComplianceRate: 84.9,
                pendingAnalysis: 12,
                overdueAnalysis: 3,
                byCategory: [
                    { category: 'ARQ', count: 24, avgTime: 32 },
                    { category: 'EST', count: 18, avgTime: 42 },
                    { category: 'ELE', count: 12, avgTime: 28 },
                    { category: 'HID', count: 8, avgTime: 36 },
                    { category: 'MEC', count: 6, avgTime: 48 }
                ],
                byReviewer: [
                    { name: 'Carlos Silva', completed: 15, avgTime: 28 },
                    { name: 'Ana Santos', completed: 12, avgTime: 32 },
                    { name: 'Roberto Lima', completed: 10, avgTime: 38 },
                    { name: 'Maria Oliveira', completed: 8, avgTime: 42 }
                ],
                timeline: [
                    { date: '2026-01-01', received: 8, analyzed: 6, approved: 5 },
                    { date: '2026-01-02', received: 12, analyzed: 10, approved: 8 },
                    { date: '2026-01-03', received: 6, analyzed: 8, approved: 7 },
                    { date: '2026-01-04', received: 10, analyzed: 9, approved: 6 },
                    { date: '2026-01-05', received: 4, analyzed: 6, approved: 8 }
                ]
            };
            setMetrics(mockMetrics);
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatHours = (hours: number) => {
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    const getSLAStatus = (actual: number, limit: number) => {
        const ratio = actual / limit;
        if (ratio <= 0.7) return { color: 'text-green-500', bg: 'bg-green-100', label: 'Excelente' };
        if (ratio <= 1) return { color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'No prazo' };
        return { color: 'text-red-500', bg: 'bg-red-100', label: 'Atrasado' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!metrics) return null;

    const analysisStatus = getSLAStatus(metrics.averageAnalysisTime, SLA_LIMITS.analysis);
    const approvalStatus = getSLAStatus(metrics.averageApprovalTime, SLA_LIMITS.approval);
    const distributionStatus = getSLAStatus(metrics.averageDistributionTime, SLA_LIMITS.distribution);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BarChart2 className="text-blue-500" />
                        Dashboard de Performance
                    </h1>
                    <p className="text-gray-500">Métricas de SLA e produtividade</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="365">Último ano</option>
                </select>
            </div>

            {/* SLA Compliance Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm">Taxa de Conformidade SLA</p>
                        <p className="text-4xl font-bold">{metrics.slaComplianceRate}%</p>
                        <p className="text-blue-100 text-sm mt-2">
                            {metrics.documentsInSLA} no prazo • {metrics.documentsOutOfSLA} atrasados
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="w-32 h-32 relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64" cy="64" r="56"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="64" cy="64" r="56"
                                    stroke="white"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${metrics.slaComplianceRate * 3.52} 352`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle size={32} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SLA Times Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Tempo de Análise */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Clock className={analysisStatus.color} size={24} />
                        <span className={`px-2 py-1 rounded-full text-xs ${analysisStatus.bg} ${analysisStatus.color}`}>
                            {analysisStatus.label}
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{formatHours(metrics.averageAnalysisTime)}</p>
                    <p className="text-sm text-gray-500">Tempo médio de análise</p>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full">
                        <div
                            className={`h-2 rounded-full ${metrics.averageAnalysisTime <= SLA_LIMITS.analysis ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min((metrics.averageAnalysisTime / SLA_LIMITS.analysis) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">SLA: {formatHours(SLA_LIMITS.analysis)}</p>
                </div>

                {/* Tempo de Aprovação */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <CheckCircle className={approvalStatus.color} size={24} />
                        <span className={`px-2 py-1 rounded-full text-xs ${approvalStatus.bg} ${approvalStatus.color}`}>
                            {approvalStatus.label}
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{formatHours(metrics.averageApprovalTime)}</p>
                    <p className="text-sm text-gray-500">Tempo médio de aprovação</p>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full">
                        <div
                            className={`h-2 rounded-full ${metrics.averageApprovalTime <= SLA_LIMITS.approval ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min((metrics.averageApprovalTime / SLA_LIMITS.approval) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">SLA: {formatHours(SLA_LIMITS.approval)}</p>
                </div>

                {/* Tempo de Distribuição */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <TrendingUp className={distributionStatus.color} size={24} />
                        <span className={`px-2 py-1 rounded-full text-xs ${distributionStatus.bg} ${distributionStatus.color}`}>
                            {distributionStatus.label}
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{formatHours(metrics.averageDistributionTime)}</p>
                    <p className="text-sm text-gray-500">Tempo médio de distribuição</p>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full">
                        <div
                            className={`h-2 rounded-full ${metrics.averageDistributionTime <= SLA_LIMITS.distribution ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min((metrics.averageDistributionTime / SLA_LIMITS.distribution) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">SLA: {formatHours(SLA_LIMITS.distribution)}</p>
                </div>

                {/* Alertas */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <AlertTriangle className="text-orange-500" size={24} />
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                            Atenção
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{metrics.overdueAnalysis}</p>
                    <p className="text-sm text-gray-500">Análises em atraso</p>
                    <p className="text-sm text-gray-400 mt-2">
                        {metrics.pendingAnalysis} pendentes no total
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Por Categoria */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" />
                        Por Disciplina
                    </h3>
                    <div className="space-y-3">
                        {metrics.byCategory.map(cat => (
                            <div key={cat.category} className="flex items-center gap-3">
                                <span className="w-12 font-mono font-medium text-sm">{cat.category}</span>
                                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-6 bg-blue-500 rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${(cat.count / metrics.byCategory[0].count) * 100}%` }}
                                    >
                                        <span className="text-xs text-white font-medium">{cat.count}</span>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500 w-16 text-right">{formatHours(cat.avgTime)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Por Revisor */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users size={18} className="text-purple-500" />
                        Por Revisor
                    </h3>
                    <div className="space-y-3">
                        {metrics.byReviewer.map((reviewer, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                                    {reviewer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{reviewer.name}</p>
                                    <p className="text-xs text-gray-500">{reviewer.completed} análises</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${reviewer.avgTime <= SLA_LIMITS.analysis ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatHours(reviewer.avgTime)}
                                    </p>
                                    <p className="text-xs text-gray-400">média</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
