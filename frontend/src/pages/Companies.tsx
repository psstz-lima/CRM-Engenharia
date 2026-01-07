import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { Building2, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

export function Companies() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editCnpj, setEditCnpj] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/companies');
            setCompanies(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/companies', { name, cnpj });
            setShowCreateModal(false);
            loadCompanies();
            setName('');
            setCnpj('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar empresa');
        }
    };

    const openEditModal = (company: any) => {
        setEditingCompany(company);
        setEditName(company.name || '');
        setEditCnpj(company.cnpj || '');
        setEditIsActive(company.isActive);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/companies/${editingCompany.id}`, {
                name: editName,
                cnpj: editCnpj,
                isActive: editIsActive
            });
            setShowEditModal(false);
            loadCompanies();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao atualizar empresa');
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState('');

    const confirmDelete = (id: string) => {
        setDeleteId(id);
        setShowDeleteModal(true);
        setError('');
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/companies/${deleteId}`);
            setShowDeleteModal(false);
            setDeleteId(null);
            loadCompanies();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao excluir empresa');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <PageHeader
                title="Gestão de Empresas"
                subtitle="Gerencie as empresas parceiras e clientes do sistema."
                icon={<Building2 className="text-" />}
                actions={
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
                        <Plus size={16} />
                        Nova Empresa
                    </button>
                }
            />

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg- text- text-xs uppercase font-semibold border-b border-">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">CNPJ</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-">Carregando...</td></tr>
                            ) : companies.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-">Nenhuma empresa encontrada.</td></tr>
                            ) : (
                                companies.map(company => (
                                    <tr key={company.id} className="hover:bg- transition-colors text-sm group">
                                        <td className="p-4 font-medium text-">{company.name}</td>
                                        <td className="p-4 text- font-mono">{company.cnpj}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${company.isActive
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {company.isActive ? 'ATIVA' : 'INATIVA'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(company)}
                                                    className="p-2 rounded-lg hover:bg- text- hover:text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(company.id)}
                                                    className="p-2 rounded-lg hover:bg- text- hover:text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border- flex justify-between items-center bg-">
                            <h3 className="text-xl font-bold text-">Nova Empresa</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text- hover:text-">✕</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="label">Nome da Empresa</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" placeholder="Ex: Construtora XYZ" />
                            </div>
                            <div>
                                <label className="label">CNPJ</label>
                                <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} required className="input" placeholder="00.000.000/0000-00" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Criar Empresa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingCompany && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border- flex justify-between items-center bg-">
                            <h3 className="text-xl font-bold text-">Editar Empresa</h3>
                            <button onClick={() => setShowEditModal(false)} className="text- hover:text-">✕</button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="label">Nome da Empresa</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required className="input" />
                            </div>
                            <div>
                                <label className="label">CNPJ</label>
                                <input type="text" value={editCnpj} onChange={e => setEditCnpj(e.target.value)} required className="input" />
                            </div>
                            <div className="p-4 bg- rounded-lg border border-">
                                <label className="flex items-center cursor-pointer gap-3 text- select-none">
                                    <input
                                        type="checkbox"
                                        checked={editIsActive}
                                        onChange={e => setEditIsActive(e.target.checked)}
                                        className="rounded border- bg- text-primary-600 focus:ring-primary-500 w-5 h-5"
                                    />
                                    <span className="font-medium">Empresa Ativa</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-">Excluir Empresa?</h3>
                            <p className="text-">
                                Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e pode afetar contratos vinculados.
                            </p>

                            {error && (
                                <div className="bg-red-500/10 p-3 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn btn-secondary w-full"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn bg-red-500 hover:bg-red-600 text-gray-900 w-full shadow-lg shadow-red-500/20"
                                >
                                    Confirmar Exclusão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
