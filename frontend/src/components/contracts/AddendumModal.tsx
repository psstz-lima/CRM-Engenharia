import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Addendum, AddendumOperation } from '../../types/addendum';
import { X, Plus, Trash2, Save, CheckCircle } from 'lucide-react';

interface AddendumModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
    addendum: Addendum | null; // If null, create new. If set, edit/view.
    onSuccess: () => void;
}

export function AddendumModal({ isOpen, onClose, contractId, addendum, onSuccess }: AddendumModalProps) {
    const [formData, setFormData] = useState({
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [operations, setOperations] = useState<AddendumOperation[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentAddendum, setCurrentAddendum] = useState<Addendum | null>(null);

    // Load initial data
    useEffect(() => {
        if (isOpen) {
            if (addendum && addendum.id) {
                // Edit/View mode
                setCurrentAddendum(addendum);
                setFormData({
                    description: addendum.description,
                    date: new Date(addendum.date).toISOString().split('T')[0]
                });
                loadOperations(addendum.id);
            } else {
                // Create mode
                setCurrentAddendum(null);
                setFormData({
                    description: '',
                    date: new Date().toISOString().split('T')[0]
                });
                setOperations([]);
            }
        }
    }, [isOpen, addendum]);

    const loadOperations = async (addendumId: string) => {
        try {
            const { data } = await api.get(`/contracts/addendums/${addendumId}`);
            setOperations(data.operations || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateDraft = async () => {
        try {
            setLoading(true);
            const { data } = await api.post(`/contracts/${contractId}/addendums`, formData);
            setCurrentAddendum(data);
            alert('Rascunho criado! Agora adicione as operações.');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar aditivo');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!currentAddendum) return;
        if (!confirm('Confirma a aprovação deste aditivo? Os valores do contrato serão atualizados e não será possível reverter facilmente.')) return;

        try {
            setLoading(true);
            await api.post(`/contracts/addendums/${currentAddendum.id}/approve`);
            alert('Aditivo aprovado com sucesso!');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao aprovar');
        } finally {
            setLoading(false);
        }
    };

    // Simplified Operation Handler for now (real logic would need item selection)
    // For this POC, we might implemented a VERY basic operation add form inside here
    // But given the complexity, maybe just showing "Work in Progress" for operations or a rudimentary text list is acceptable for Step 1?
    // Let's implement a placeholder for operations management or a simple "Add" button that mocks an operation for testing.

    // ...

    if (!isOpen) return null;

    const isReadOnly = currentAddendum?.status && currentAddendum.status !== 'DRAFT';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {currentAddendum ? `Aditivo #${currentAddendum.number}` : 'Novo Aditivo'}
                    </h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Descrição / Justificativa</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                disabled={!!currentAddendum || isReadOnly} // Disable if created (for now) or readonly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Data</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                disabled={!!currentAddendum || isReadOnly}
                            />
                        </div>
                    </div>

                    {!currentAddendum && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleCreateDraft}
                                disabled={loading || !formData.description}
                                className="btn bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Save size={18} /> Criar Rascunho
                            </button>
                        </div>
                    )}

                    {currentAddendum && (
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg">Operações do Aditivo</h3>
                                {/* Operations Add Button - Placeholder */}
                                {!isReadOnly && (
                                    <button
                                        className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                                        disabled
                                        title="Funcionalidade de adicionar itens em desenvolvimento"
                                    >
                                        + Adicionar Operação (Em Breve)
                                    </button>
                                )}
                            </div>

                            {/* Operations List */}
                            <div className="bg-gray-50 rounded-lg p-4 border text-center text-gray-500">
                                {operations.length === 0 ? (
                                    <p>Nenhuma operação registrada.</p>
                                ) : (
                                    operations.map(op => (
                                        <div key={op.id}>{op.newItemDescription || 'Item alterado'} ...</div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                        Fechar
                    </button>
                    {currentAddendum?.status === 'DRAFT' && (
                        <button
                            onClick={handleApprove}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <CheckCircle size={18} /> Aprovar Aditivo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
