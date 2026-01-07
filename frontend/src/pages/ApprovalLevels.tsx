import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Award, Plus, Edit2, Trash2, Check, X, MoveUp, MoveDown } from 'lucide-react';

export function ApprovalLevels() {
    const [levels, setLevels] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any>(null);

    // Form States
    const [name, setName] = useState('');
    const [level, setLevel] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        loadLevels();
    }, []);

    const loadLevels = async () => {
        try {
            const { data } = await api.get('/approvals/levels');
            // Ensure sorting by level
            setLevels(data.sort((a: any, b: any) => a.level - b.level));
        } catch (err) {
            console.error('Erro ao carregar níveis', err);
        }
    };

    const handleOpenModal = (levelObj?: any) => {
        if (levelObj) {
            setEditingLevel(levelObj);
            setName(levelObj.name);
            setLevel(levelObj.level);
            setDescription(levelObj.description || '');
            setIsActive(levelObj.isActive);
        } else {
            setEditingLevel(null);
            setName('');
            // Suggest next level
            const nextLevel = levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1;
            setLevel(String(nextLevel));
            setDescription('');
            setIsActive(true);
        }
        setShowModal(true);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name,
                level: parseInt(level),
                description,
                isActive
            };

            if (editingLevel) {
                await api.put(`/approvals/levels/${editingLevel.id}`, payload);
            } else {
                await api.post('/approvals/levels', payload);
            }

            setShowModal(false);
            loadLevels();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar nível');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este nível? Se houver medições aprovadas, ele não poderá ser excluído.')) return;
        try {
            await api.delete(`/approvals/levels/${id}`);
            loadLevels();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir nível');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Níveis de Aprovação"
                subtitle="Configure a hierarquia de aprovação para medições."
                icon={<Award className="text-primary-500" />}
                actions={
                    <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
                        <Plus size={16} />
                        Novo Nível
                    </button>
                }
            />

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-16 text-center">Nível</th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {levels.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Nenhum nível de aprovação configurado.
                                    </td>
                                </tr>
                            ) : (
                                levels.map((l) => (
                                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-center font-bold text-gray-700 bg-gray-50/50">
                                            {l.level}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{l.name}</td>
                                        <td className="p-4 text-gray-600">{l.description || '-'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${l.isActive
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {l.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(l)}
                                                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(l.id)}
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
                    <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {editingLevel ? 'Editar Nível' : 'Novo Nível'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="label">Ordem do Nível (1, 2, 3...)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={level}
                                    onChange={e => setLevel(e.target.value)}
                                    required
                                    className="input"
                                    placeholder="Ex: 1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Aprovações seguem esta ordem sequencial.</p>
                            </div>
                            <div>
                                <label className="label">Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="input"
                                    placeholder="Ex: Engenharia"
                                />
                            </div>
                            <div>
                                <label className="label">Descrição</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="input resize-none"
                                    rows={3}
                                    placeholder="Descrição da responsabilidade deste nível..."
                                />
                            </div>

                            {editingLevel && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <label className="flex items-center cursor-pointer gap-3 select-none">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={e => setIsActive(e.target.checked)}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-5 h-5"
                                        />
                                        <span className="font-medium text-gray-700">Nível Ativo</span>
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
