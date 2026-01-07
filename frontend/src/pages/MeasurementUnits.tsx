import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Scale, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';

export function MeasurementUnits() {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<any>(null);

    // Form States
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    // Filter
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/units');
            setUnits(data);
        } catch (err) {
            console.error('Erro ao carregar unidades', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (unitObj?: any) => {
        if (unitObj) {
            setEditingUnit(unitObj);
            setCode(unitObj.code);
            setDescription(unitObj.description || '');
        } else {
            setEditingUnit(null);
            setCode('');
            setDescription('');
        }
        setShowModal(true);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                code,
                description
            };

            if (editingUnit) {
                await api.put(`/units/${editingUnit.id}`, payload);
            } else {
                await api.post('/units', payload);
            }

            setShowModal(false);
            loadUnits();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar unidade');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;
        try {
            await api.delete(`/units/${id}`);
            loadUnits();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir unidade');
        }
    };

    const filteredUnits = units.filter(u =>
        u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Unidades de Medida"
                subtitle="Gerencie as unidades utilizadas nos contratos e medições."
                icon={<Scale className="text-primary-500" />}
                actions={
                    <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
                        <Plus size={16} />
                        Nova Unidade
                    </button>
                }
            />

            <Card className="mb-4">
                <div className="p-4">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por sigla ou descrição..."
                            className="input pl-10"
                        />
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-24">Sigla</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 w-32 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredUnits.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle size={32} className="opacity-50" />
                                            <p>Nenhuma unidade encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUnits.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4 font-bold text-gray-900 bg-gray-50/50">
                                            {u.code}
                                        </td>
                                        <td className="p-4 text-gray-700">{u.description}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(u)}
                                                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.id)}
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
                {!loading && units.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-right">
                        Total de {units.length} unidades cadastradas
                    </div>
                )}
            </Card>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="label">Sigla (Código) *</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    className="input font-mono uppercase"
                                    placeholder="Ex: M2, KG"
                                    maxLength={10}
                                />
                            </div>
                            <div>
                                <label className="label">Descrição *</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    className="input"
                                    placeholder="Ex: Metro Quadrado"
                                />
                            </div>

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
