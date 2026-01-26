import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Addendum, AddendumOperation } from '../../types/addendum';
import { Save, CheckCircle } from 'lucide-react';
import { DraggableModal } from '../common/DraggableModal';

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

    if (!isOpen) return null;

    const isReadOnly = currentAddendum?.status && currentAddendum.status !== 'DRAFT';
    const title = currentAddendum ? `Aditivo #${currentAddendum.number}` : 'Novo Aditivo';

    return (
        <DraggableModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            width="960px"
            className="max-w-[96vw]"
        >
            <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="label">Descrição / Justificativa</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            disabled={!!currentAddendum || isReadOnly}
                        />
                    </div>
                    <div>
                        <label className="label">Data</label>
                        <input
                            type="date"
                            className="input"
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
                            className="btn btn-primary"
                        >
                            <Save size={18} /> Criar rascunho
                        </button>
                    </div>
                )}

                {currentAddendum && (
                    <div className="grid gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-">Operações do aditivo</h3>
                            {!isReadOnly && (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled
                                    title="Funcionalidade de adicionar itens em desenvolvimento"
                                >
                                    + Adicionar operação (em breve)
                                </button>
                            )}
                        </div>

                        <div className="card p-4 text-sm text-gray-600">
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

                <div className="modal-divider" />

                <div className="flex flex-wrap justify-end gap-3">
                    <button onClick={onClose} className="btn btn-secondary">
                        Fechar
                    </button>
                    {currentAddendum?.status === 'DRAFT' && (
                        <button
                            onClick={handleApprove}
                            className="btn btn-success"
                        >
                            <CheckCircle size={18} /> Aprovar aditivo
                        </button>
                    )}
                </div>
            </div>
        </DraggableModal>
    );
}


