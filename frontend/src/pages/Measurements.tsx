import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Ruler, Calendar, ArrowRight, FileText, Plus, AlertCircle, Eye } from 'lucide-react';

export function Measurements() {
    const { id } = useParams(); // Contract ID
    const navigate = useNavigate();
    const [contract, setContract] = useState<any>(null);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal
    const [showModal, setShowModal] = useState(false);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            const [contractRes, measurementsRes] = await Promise.all([
                api.get(`/contracts/${id}`),
                api.get(`/contracts/${id}/measurements`)
            ]);
            setContract(contractRes.data);
            setMeasurements(measurementsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            const { data } = await api.post(`/contracts/${id}/measurements`, {
                periodStart,
                periodEnd,
                notes
            });
            navigate(`/measurements/${data.id}`);
        } catch (err: any) {
            alert('Erro ao criar medição');
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                <p>Carregando dados...</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title={`Medições: Contrato ${contract?.number}`}
                subtitle={contract?.object}
                icon={<Ruler className="text-[var(--accent-primary)]" />}
                breadcrumb={[
                    { label: 'Contratos', href: '/contracts' },
                    { label: 'Medições', href: '/measurements' },
                    { label: contract?.number || 'Contrato' }
                ]}
                actions={
                    <div className="flex gap-3">
                        <Link to={`/contracts/${id}`} className="btn btn-secondary flex items-center gap-2">
                            <FileText size={16} />
                            Ver Contrato
                        </Link>
                        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
                            <Plus size={16} />
                            Nova Medição
                        </button>
                    </div>
                }
            />

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase font-semibold border-b border-[var(--border-subtle)]">
                            <tr>
                                <th className="p-4">Número</th>
                                <th className="p-4">Período</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Observações</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {measurements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-[var(--text-muted)]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                                <AlertCircle size={32} className="opacity-50" />
                                            </div>
                                            <p className="text-lg">Nenhuma medição encontrada.</p>
                                            <button onClick={() => setShowModal(true)} className="text-[var(--accent-primary)] hover:underline">
                                                Clique em "+ Nova Medição" para começar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                measurements.map(m => (
                                    <tr key={m.id} className="hover:bg-[var(--bg-hover)] transition-colors text-sm group">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">
                                            #{m.number}
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="opacity-50" />
                                                {new Date(m.periodStart).toLocaleDateString()} a {new Date(m.periodEnd).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${m.status === 'CLOSED'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {m.status === 'CLOSED' ? 'FECHADO' : 'RASCUNHO'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)] max-w-xs truncate">
                                            {m.notes || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                to={`/measurements/${m.id}`}
                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-gray-900 transition-all shadow-sm"
                                                title="Abrir Medição"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Plus size={20} className="text-[var(--accent-primary)]" />
                                Nova Medição
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Início</label>
                                    <input type="date" required value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">Fim</label>
                                    <input type="date" required value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="input" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Observações</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={3} placeholder="Opcional..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Criar Medição</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
