import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Addendum } from '../../types/addendum';
import { Card } from '../ui/Card';
import { Plus, Edit2, Trash2, Eye, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AddendumListProps {
    contractId: string;
    onUpdate: () => void;
    onEdit: (addendum: Addendum) => void;
}

export function AddendumList({ contractId, onUpdate, onEdit }: AddendumListProps) {
    const [addendums, setAddendums] = useState<Addendum[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAddendums();
    }, [contractId]);

    const loadAddendums = async () => {
        try {
            const { data } = await api.get(`/contracts/${contractId}/addendums`);
            setAddendums(data);
        } catch (error) {
            console.error('Error loading addendums:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, status: string) => {
        if (status !== 'DRAFT') return;
        if (!confirm('Tem certeza que deseja excluir este aditivo?')) return;

        try {
            await api.delete(`/contracts/addendums/${id}`); // Adjust route if needed, usually DELETE not implemented for addendum root yet in my previous check? 
            // Wait, AddendumController didn't have delete root addendum method, only operations. 
            // I should verify controller capabilities. 
            // Controller had `cancel` but not `delete` for the addendum itself.
            // For now, I'll omit delete button or assume only cancel.
            // Let's implement Cancel mainly.
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    // Using Cancel instead of Delete for now to be safe with Controller logic
    const handleCancel = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este aditivo?')) return;
        try {
            await api.post(`/contracts/addendums/${id}/cancel`, { confirmCancellation: true }); // Using the route I saw
            loadAddendums();
            onUpdate();
        } catch (err) {
            alert('Erro ao cancelar');
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    if (loading) return <div className="text-center py-4">Carregando aditivos...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="text-blue-500" />
                    Aditivos Contratuais
                </h3>
                <button
                    onClick={() => onEdit({} as Addendum)} // New
                    className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                    <Plus size={16} />
                    Novo Aditivo
                </button>
            </div>

            {addendums.length === 0 ? (
                <Card className="p-8 text-center opacity-70">
                    <p>Nenhum aditivo cadastrado para este contrato.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {addendums.map(addendum => (
                        <Card key={addendum.id} className="p-4 flex items-center justify-between hover:border-blue-300 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-lg">Aditivo #{addendum.number}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${addendum.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                            addendum.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'
                                        }`}>
                                        {addendum.status === 'APPROVED' ? 'APROVADO' :
                                            addendum.status === 'CANCELLED' ? 'CANCELADO' : 'RASCUNHO'}
                                    </span>
                                    <span className="text-sm text-gray-400">{formatDate(addendum.date)}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{addendum.description}</p>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-emerald-600 font-medium">Acres: {formatCurrency(Number(addendum.totalAddition))}</span>
                                    <span className="text-red-600 font-medium">Supres: {formatCurrency(Number(addendum.totalSuppression))}</span>
                                    <span className="font-bold text-gray-800">Líquido: {formatCurrency(Number(addendum.netValue))}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(addendum)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"
                                    title="Ver/Editar"
                                >
                                    {addendum.status === 'DRAFT' ? <Edit2 size={18} /> : <Eye size={18} />}
                                </button>
                                {addendum.status === 'DRAFT' && (
                                    <button
                                        onClick={() => handleCancel(addendum.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                                        title="Cancelar"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
