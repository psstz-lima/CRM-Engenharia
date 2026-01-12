import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Send, CheckCircle, Clock, AlertCircle,
    Printer, Edit, Trash2, Plus, FileText, User,
    Calendar, Mail, Building2, Package
} from 'lucide-react';
import api from '../services/api';
import GRDPrint from '../components/documents/GRDPrint';

interface GRD {
    id: string;
    number: string;
    recipient: string;
    recipientCompany?: string;
    recipientEmail?: string;
    sendMethod: string;
    reason: string;
    status: string;
    notes?: string;
    sentAt?: string;
    confirmedAt?: string;
    confirmedBy?: string;
    createdAt: string;
    contract?: { id: string; number: string; company: { name: string } };
    items: Array<{
        id: string;
        document: {
            id: string;
            code: string;
            title: string;
            revision: string;
            category?: { code: string; name: string; color: string };
        };
        copies: number;
    }>;
    createdBy?: { fullName: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
    SENT: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
    RECEIVED: { label: 'Recebido', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    PENDING: { label: 'Aguardando Confirmação', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

const methodLabels: Record<string, string> = {
    EMAIL: '📧 E-mail',
    PHYSICAL: '📬 Física (Correios)',
    CLOUD: '☁️ Nuvem (Link)',
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

export default function GRDDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [grd, setGRD] = useState<GRD | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPrint, setShowPrint] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadGRD();
    }, [id]);

    const loadGRD = async () => {
        try {
            const { data } = await api.get(`/grd/${id}`);
            setGRD(data);
        } catch (error) {
            console.error('Erro ao carregar GRD:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!confirm('Confirma o envio desta GRD?')) return;
        setActionLoading(true);
        try {
            await api.post(`/grd/${id}/send`);
            loadGRD();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao enviar GRD');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirm = async () => {
        const confirmedBy = prompt('Nome de quem confirmou o recebimento:');
        if (!confirmedBy) return;
        setActionLoading(true);
        try {
            await api.post(`/grd/${id}/confirm`, { confirmedBy });
            loadGRD();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao confirmar recebimento');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!grd) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">GRD não encontrada</p>
            </div>
        );
    }

    const status = statusConfig[grd.status] || statusConfig.DRAFT;
    const StatusIcon = status.icon;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/grd')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono text-blue-600">{grd.number}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                                <StatusIcon size={14} />
                                {status.label}
                            </span>
                        </div>
                        <p className="text-gray-500">Guia de Remessa de Documentos</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPrint(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <Printer size={18} />
                        Imprimir
                    </button>
                    {grd.status === 'DRAFT' && (
                        <button
                            onClick={handleSend}
                            disabled={actionLoading || grd.items.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            <Send size={18} />
                            Enviar
                        </button>
                    )}
                    {grd.status === 'SENT' && (
                        <button
                            onClick={handleConfirm}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            <CheckCircle size={18} />
                            Confirmar Recebimento
                        </button>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="text-gray-400" size={18} />
                        <span className="text-xs text-gray-500 uppercase">Contrato</span>
                    </div>
                    <p className="font-medium">{grd.contract?.number}</p>
                    <p className="text-sm text-gray-500">{grd.contract?.company.name}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <User className="text-gray-400" size={18} />
                        <span className="text-xs text-gray-500 uppercase">Destinatário</span>
                    </div>
                    <p className="font-medium">{grd.recipient}</p>
                    {grd.recipientCompany && <p className="text-sm text-gray-500">{grd.recipientCompany}</p>}
                    {grd.recipientEmail && <p className="text-sm text-blue-500">{grd.recipientEmail}</p>}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="text-gray-400" size={18} />
                        <span className="text-xs text-gray-500 uppercase">Envio</span>
                    </div>
                    <p className="font-medium">{methodLabels[grd.sendMethod] || grd.sendMethod}</p>
                    <p className="text-sm text-gray-500">{reasonLabels[grd.reason] || grd.reason}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="text-gray-400" size={18} />
                        <span className="text-xs text-gray-500 uppercase">Datas</span>
                    </div>
                    <p className="text-sm"><span className="text-gray-500">Criado:</span> {formatDate(grd.createdAt)}</p>
                    {grd.sentAt && <p className="text-sm"><span className="text-gray-500">Enviado:</span> {formatDate(grd.sentAt)}</p>}
                    {grd.confirmedAt && <p className="text-sm text-green-600"><span className="text-gray-500">Confirmado:</span> {formatDate(grd.confirmedAt)}</p>}
                </div>
            </div>

            {/* Documentos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" />
                        Documentos ({grd.items.length})
                    </h2>
                    {grd.status === 'DRAFT' && (
                        <button className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            <Plus size={16} />
                            Adicionar
                        </button>
                    )}
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disciplina</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revisão</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cópias</th>
                            {grd.status === 'DRAFT' && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {grd.items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-3">
                                    <span
                                        className="font-mono text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                                        onClick={() => navigate(`/documents/${item.document.id}`)}
                                    >
                                        {item.document.code}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">{item.document.title}</td>
                                <td className="px-4 py-3">
                                    {item.document.category && (
                                        <span
                                            className="px-2 py-1 rounded-full text-xs"
                                            style={{ backgroundColor: item.document.category.color + '20', color: item.document.category.color }}
                                        >
                                            {item.document.category.code}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-mono text-sm">{item.document.revision}</td>
                                <td className="px-4 py-3 text-center">{item.copies}</td>
                                {grd.status === 'DRAFT' && (
                                    <td className="px-4 py-3 text-right">
                                        <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {grd.items.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum documento adicionado</p>
                    </div>
                )}
            </div>

            {/* Notas */}
            {grd.notes && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold mb-2">Observações</h3>
                    <p className="text-gray-600">{grd.notes}</p>
                </div>
            )}

            {/* Print Modal */}
            {showPrint && (
                <GRDPrint grd={grd} onClose={() => setShowPrint(false)} />
            )}
        </div>
    );
}
