import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
    id: string;
    title: string;
    isRequired: boolean;
    isDone: boolean;
    notes: string;
}

interface ContractChecklistProps {
    contractId: string;
}

export function ContractChecklist({ contractId }: ContractChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [isRequired, setIsRequired] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/contracts/${contractId}/checklist`);
            setItems(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [contractId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await api.post(`/contracts/${contractId}/checklist`, { title: title.trim(), isRequired });
        setTitle('');
        setIsRequired(true);
        load();
    };

    const toggleDone = async (item: ChecklistItem) => {
        await api.patch(`/contracts/checklist/${item.id}`, { isDone: !item.isDone });
        load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este item')) return;
        await api.delete(`/contracts/checklist/${id}`);
        load();
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-center">
                <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Novo item de conformidade"
                    className="input flex-1 min-w-[220px]"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={e => setIsRequired(e.target.checked)}
                    />
                    Obrigatório
                </label>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                    <Plus size={16} />
                    Adicionar
                </button>
            </form>

            {loading  (
                <div className="text-sm text-gray-500">Carregando checklist...</div>
            ) : items.length === 0  (
                <div className="text-sm text-gray-500">Nenhum item cadastrado.</div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/80 border border-gray-200 rounded-lg">
                            <button
                                onClick={() => toggleDone(item)}
                                className="flex items-center gap-2 text-left"
                                title={item.isDone  'Marcar como pendente' : 'Marcar como concluído'}
                            >
                                {item.isDone  <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-gray-400" />}
                                <span className={`text-sm ${item.isDone  'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {item.title}
                                </span>
                                {item.isRequired && (
                                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700">Obrigatório</span>
                                )}
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="btn btn-xs btn-danger"
                                title="Excluir"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
