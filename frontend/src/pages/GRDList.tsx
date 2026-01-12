import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Send, CheckCircle, Clock, AlertCircle,
    Plus, Eye, Download, Search, Filter
} from 'lucide-react';
import api from '../services/api';

interface GRD {
    id: string;
    number: string;
    recipient: string;
    recipientCompany?: string;
    sendMethod: string;
    reason: string;
    status: string;
    sentAt?: string;
    confirmedAt?: string;
    createdAt: string;
    contract?: { number: string; company: { name: string } };
    items: any[];
    _count?: { items: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
    SENT: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
    RECEIVED: { label: 'Recebido', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

const methodLabels: Record<string, string> = {
    EMAIL: '📧 Email',
    PHYSICAL: '📬 Físico',
    CLOUD: '☁️ Nuvem',
    CD_DVD: '💿 CD/DVD',
    PENDRIVE: '💾 Pendrive'
};

const reasonLabels: Record<string, string> = {
    INITIAL: 'Envio Inicial',
    REVISION: 'Revisão',
    REPLACEMENT: 'Substituição',
    INFORMATION: 'Para Informação',
    APPROVAL: 'Para Aprovação'
};

export default function GRDList() {
    const navigate = useNavigate();
    const [grds, setGRDs] = useState<GRD[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [dashboard, setDashboard] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [selectedStatus]);

    const loadData = async () => {
        try {
            const [grdsRes, dashRes] = await Promise.all([
                api.get('/grd', { params: { status: selectedStatus } }),
                api.get('/grd/dashboard')
            ]);
            setGRDs(grdsRes.data);
            setDashboard(dashRes.data);
        } catch (error) {
            console.error('Erro ao carregar GRDs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const filteredGRDs = grds.filter(grd =>
        grd.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grd.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <Send className="text-blue-500" />
                        Guias de Remessa (GRD)
                    </h1>
                    <p className="text-gray-500">{grds.length} guias de remessa</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    <Plus size={18} />
                    Nova GRD
                </button>
            </div>

            {/* Dashboard Cards */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Rascunho', value: dashboard.stats.draft, color: 'bg-gray-500' },
                        { label: 'Enviadas', value: dashboard.stats.sent, color: 'bg-blue-500' },
                        { label: 'Recebidas', value: dashboard.stats.received, color: 'bg-green-500' },
                        { label: 'Pendentes', value: dashboard.stats.pending, color: 'bg-yellow-500' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                                <FileText size={20} />
                            </div>
                            <p className="text-2xl font-bold">{stat.value || 0}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por número ou destinatário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
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
                </div>
            </div>

            {/* GRD List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatário</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docs</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredGRDs.map(grd => {
                            const status = statusConfig[grd.status] || statusConfig.DRAFT;
                            const StatusIcon = status.icon;
                            return (
                                <tr
                                    key={grd.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                    onClick={() => navigate(`/grd/${grd.id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-mono font-medium text-blue-600">{grd.number}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{grd.contract?.number}</td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-sm">{grd.recipient}</p>
                                            {grd.recipientCompany && (
                                                <p className="text-xs text-gray-500">{grd.recipientCompany}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{methodLabels[grd.sendMethod] || grd.sendMethod}</td>
                                    <td className="px-4 py-3 text-sm">{reasonLabels[grd.reason] || grd.reason}</td>
                                    <td className="px-4 py-3 text-sm text-center">{grd._count?.items || grd.items?.length || 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
                                            <StatusIcon size={12} />
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(grd.sentAt || grd.createdAt)}</td>
                                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => navigate(`/grd/${grd.id}`)}
                                            className="p-1 text-gray-500 hover:text-blue-500"
                                            title="Visualizar"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredGRDs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Send size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhuma GRD encontrada</p>
                    </div>
                )}
            </div>

            {/* Create Modal - Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Nova Guia de Remessa</h2>
                        <p className="text-gray-500 mb-4">Formulário de criação será implementado aqui...</p>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
