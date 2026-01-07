import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { FileText, Plus, Eye, Edit2, Trash2, Building2, Calendar, AlertCircle, Info, ClipboardList, Search, Filter } from 'lucide-react';
import { FavoriteToggle } from '../components/common/FavoriteToggle';

export function Contracts() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [number, setNumber] = useState('');
    const [object, setObject] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadContracts();
        loadCompanies();
    }, []);

    const loadContracts = async () => {
        try {
            const { data } = await api.get('/contracts');
            setContracts(data);
        } catch { }
    };

    const loadCompanies = async () => {
        try {
            const { data } = await api.get('/companies');
            setCompanies(data);
        } catch { }
    };

    const openModal = (contract?: any) => {
        if (contract) {
            setEditingId(contract.id);
            setNumber(contract.number);
            setObject(contract.object || '');
            setCompanyId(contract.companyId);
            setStartDate(contract.startDate ? contract.startDate.split('T')[0] : '');
            setEndDate(contract.endDate ? contract.endDate.split('T')[0] : '');
        } else {
            setEditingId(null);
            setNumber('');
            setObject('');
            setCompanyId('');
            setStartDate('');
            setEndDate('');
        }
        setShowModal(true);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                number,
                object,
                companyId,
                startDate,
                endDate
            };

            if (editingId) {
                await api.put(`/contracts/${editingId}`, payload);
            } else {
                await api.post('/contracts', payload);
            }

            setShowModal(false);
            loadContracts();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar contrato');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = confirm(
            '⚠️ ATENÇÃO: Ação Irreversível!\n\n' +
            'Ao excluir este contrato, serão PERMANENTEMENTE removidos:\n\n' +
            '• Todos os itens do contrato\n' +
            '• Todas as medições vinculadas\n' +
            '• Todas as memórias de cálculo\n' +
            '• Todos os aditivos\n\n' +
            'Deseja realmente excluir?'
        );
        if (!confirmed) return;

        try {
            await api.delete(`/contracts/${id}`);
            loadContracts();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir contrato');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Gestão de Contratos"
                subtitle="Gerencie os contratos de obras, serviços e seus prazos."
                icon={<ClipboardList className="text-" />}
                center
                actions={
                    <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
                        <Plus size={16} />
                        Novo Contrato
                    </button>
                }
            />

            {/* Filtros */}
            <Card className="mb-4">
                <div className="p-4 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por número ou objeto..."
                            className="input pl-10 w-full"
                        />
                    </div>
                    <select
                        value={filterCompany}
                        onChange={e => setFilterCompany(e.target.value)}
                        className="input w-48"
                    >
                        <option value="">Todas Empresas</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="input w-36"
                    >
                        <option value="">Todos Status</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>
                    {(searchTerm || filterCompany || filterStatus) && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterCompany(''); setFilterStatus(''); }}
                            className="btn btn-secondary text-sm"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg- text- text-xs uppercase font-semibold border-b border-">
                            <tr>
                                <th className="p-4 text-center w-16">Fav</th>
                                <th className="p-4 text-center">Número</th>
                                <th className="p-4 text-left">Empresa</th>
                                <th className="p-4 text-center">Período</th>
                                <th className="p-4 text-center">Valor Total</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-">
                            {contracts
                                .filter(c => {
                                    if (searchTerm && !c.number.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                        !c.object?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                                    if (filterCompany && c.companyId !== filterCompany) return false;
                                    if (filterStatus === 'active' && !c.isActive) return false;
                                    if (filterStatus === 'inactive' && c.isActive) return false;
                                    return true;
                                })
                                .length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center text-">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg- flex items-center justify-center">
                                                <AlertCircle size={32} className="opacity-50" />
                                            </div>
                                            <p className="text-lg">Nenhum contrato encontrado.</p>
                                            <button onClick={() => openModal()} className="text- hover:underline">
                                                Clique para criar um novo contrato
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contracts
                                    .filter(c => {
                                        if (searchTerm && !c.number.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            !c.object?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                                        if (filterCompany && c.companyId !== filterCompany) return false;
                                        if (filterStatus === 'active' && !c.isActive) return false;
                                        if (filterStatus === 'inactive' && c.isActive) return false;
                                        return true;
                                    })
                                    .map(contract => (
                                        <tr key={contract.id} className="hover:bg- transition-colors text-sm group">
                                            <td className="p-4 text-center">
                                                <FavoriteToggle
                                                    targetType="CONTRACT"
                                                    targetId={contract.id}
                                                />
                                            </td>
                                            <td className="p-4 font-bold text- text-center">
                                                {contract.number}
                                            </td>
                                            <td className="p-4 text- text-left">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="opacity-50" />
                                                    {contract.company?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 text- text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Calendar size={14} className="opacity-50" />
                                                    <span className="text-xs">
                                                        {new Date(contract.startDate).toLocaleDateString()} a {new Date(contract.endDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text- text-center">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.totalValue || 0)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${contract.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {contract.isActive ? 'ATIVO' : 'INATIVO'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/contracts/${contract.id}`}
                                                        className="p-1.5 text- hover:bg-/10 rounded-lg transition-colors"
                                                        title="Detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => openModal(contract)}
                                                        className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(contract.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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
                    <div className="modal-content w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border- flex justify-between items-center bg-">
                            <h3 className="text-xl font-bold text- flex items-center gap-2">
                                {editingId ? <Edit2 size={20} className="text-amber-500" /> : <Plus size={20} className="text-" />}
                                {editingId ? 'Editar Contrato' : 'Novo Contrato'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text- hover:text-">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Número do Contrato *</label>
                                    <div className="relative">
                                        <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-" />
                                        <input
                                            type="text"
                                            className="input pl-10"
                                            value={number}
                                            onChange={e => setNumber(e.target.value)}
                                            required
                                            placeholder="Ex: 001/2024"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Empresa *</label>
                                    <div className="relative">
                                        <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-" />
                                        <select
                                            className="input pl-10"
                                            value={companyId}
                                            onChange={e => setCompanyId(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Objeto do Contrato</label>
                                    <textarea
                                        className="input resize-none"
                                        value={object}
                                        onChange={e => setObject(e.target.value)}
                                        rows={3}
                                        placeholder="Descrição breve do objeto do contrato..."
                                    />
                                </div>
                                <div>
                                    <label className="label">Data Início *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Data Fim *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {!editingId && (
                                <div className="p-4 bg- border border-/20 rounded-lg flex items-start gap-3">
                                    <Info size={20} className="text- shrink-0 mt-0.5" />
                                    <p className="text-sm text-">
                                        O valor total do contrato será calculado automaticamente conforme você adicionar itens à planilha contratual na próxima tela.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Contrato</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
