import { useState, useEffect } from 'react';
import api from '../../services/api';

interface AddendumManagerProps {
    contractId: string;
    items: any[]; // Contract items to select from
    onUpdate: () => void; // Refresh contract
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value: number, decimals = 3) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

const operationTypeLabels: Record<string, string> = {
    'SUPPRESS': '🚫 Supressão',
    'ADD': '➕ Adição',
    'MODIFY_QTY': '📊 Mod. Quantidade',
    'MODIFY_PRICE': '💰 Mod. Preço',
    'MODIFY_BOTH': '🔄 Mod. Qtd+Preço'
};

export function AddendumManager({ contractId, items, onUpdate }: AddendumManagerProps) {
    const [addendums, setAddendums] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Addendum State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    // Add Operation State
    const [showOperationModal, setShowOperationModal] = useState(false);
    const [selectedAddendum, setSelectedAddendum] = useState<any>(null);
    const [operationType, setOperationType] = useState<string>('MODIFY_QTY');
    const [selectedContractItem, setSelectedContractItem] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    const [newPrice, setNewPrice] = useState('');

    // For ADD operation (new item)
    const [newItemType, setNewItemType] = useState('ITEM');
    const [newItemCode, setNewItemCode] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('');
    const [newItemParentId, setNewItemParentId] = useState('');

    // Flatten items for selection
    function flattenItems(items: any[]): any[] {
        let flat: any[] = [];
        items.forEach(i => {
            flat.push(i);
            if (i.children) flat = flat.concat(flattenItems(i.children));
        });
        return flat;
    }

    const allItems = flattenItems(items);
    const leafItems = allItems.filter((i: any) => i.type === 'ITEM');
    const containerItems = allItems.filter((i: any) => i.type !== 'ITEM');

    useEffect(() => {
        loadAddendums();
    }, [contractId]);

    async function loadAddendums() {
        setLoading(true);
        try {
            const { data } = await api.get(`/contracts/${contractId}/addendums`);
            setAddendums(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAddendum(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.post(`/contracts/${contractId}/addendums`, { description, date });
            setShowCreateModal(false);
            setDescription('');
            loadAddendums();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar aditivo');
        }
    }

    async function handleAddOperation(e: React.FormEvent) {
        e.preventDefault();
        try {
            const payload: any = { operationType };

            if (operationType === 'ADD') {
                // New item
                payload.newItemType = newItemType;
                payload.newItemCode = newItemCode;
                payload.newItemDescription = newItemDescription;
                payload.newItemUnit = newItemUnit;
                payload.newItemParentId = newItemParentId || null;
                payload.newQuantity = newQuantity ? Number(newQuantity) : null;
                payload.newPrice = newPrice ? Number(newPrice) : null;
            } else {
                // Modify existing item
                payload.contractItemId = selectedContractItem;
                if (operationType !== 'SUPPRESS') {
                    if (operationType === 'MODIFY_QTY' || operationType === 'MODIFY_BOTH') {
                        payload.newQuantity = newQuantity ? Number(newQuantity) : null;
                    }
                    if (operationType === 'MODIFY_PRICE' || operationType === 'MODIFY_BOTH') {
                        payload.newPrice = newPrice ? Number(newPrice) : null;
                    }
                }
            }

            await api.post(`/contracts/addendums/${selectedAddendum.id}/operations`, payload);
            setShowOperationModal(false);
            resetOperationForm();
            loadAddendums();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao adicionar operação');
        }
    }

    function resetOperationForm() {
        setOperationType('MODIFY_QTY');
        setSelectedContractItem('');
        setNewQuantity('');
        setNewPrice('');
        setNewItemType('ITEM');
        setNewItemCode('');
        setNewItemDescription('');
        setNewItemUnit('');
        setNewItemParentId('');
    }

    async function handleRemoveOperation(operationId: string) {
        if (!confirm('Remover esta operação?')) return;
        try {
            await api.delete(`/contracts/addendums/operations/${operationId}`);
            loadAddendums();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao remover operação');
        }
    }

    async function handleApprove(addendumId: string) {
        if (!confirm('Aprovar este aditivo? As alterações passarão a valer.')) return;
        try {
            await api.post(`/contracts/addendums/${addendumId}/approve`);
            loadAddendums();
            onUpdate();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao aprovar aditivo');
        }
    }

    async function handleCancel(addendumId: string, isApproved: boolean) {
        const msg = isApproved
            ? '⚠️ ATENÇÃO: Este aditivo já foi aprovado!\n\nCancelar pode causar inconsistências. Recomenda-se criar um novo aditivo para reverter.\n\nDeseja cancelar mesmo assim?'
            : 'Cancelar este aditivo?';

        if (!confirm(msg)) return;

        try {
            await api.post(`/contracts/addendums/${addendumId}/cancel`, {
                confirmCancellation: isApproved
            });
            loadAddendums();
            onUpdate();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao cancelar aditivo');
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return { bg: '#dcfce7', color: '#166534' };
            case 'CANCELLED': return { bg: '#fee2e2', color: '#991b1b' };
            default: return { bg: '#fef9c3', color: '#854d0e' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'Aprovado';
            case 'CANCELLED': return 'Cancelado';
            default: return 'Rascunho';
        }
    };

    return (
        <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>📋 Aditivos Contratuais</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
                >
                    + Novo Aditivo
                </button>
            </div>

            {loading && <p>Carregando...</p>}

            {addendums.length === 0 && !loading && (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Nenhum aditivo registrado</p>
            )}

            {addendums.map(addendum => {
                const statusStyle = getStatusColor(addendum.status);
                return (
                    <div key={addendum.id} style={{ border: '1px solid #ddd', background: 'white', marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#f9fafb', borderBottom: '1px solid #eee' }}>
                            <div>
                                <strong style={{ fontSize: '1.1em' }}>Aditivo #{addendum.number}</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {new Date(addendum.date).toLocaleDateString('pt-BR')}
                                </span>
                                <span style={{ marginLeft: '10px', fontSize: '0.85em', padding: '3px 8px', borderRadius: '4px', background: statusStyle.bg, color: statusStyle.color }}>
                                    {getStatusLabel(addendum.status)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {addendum.status === 'DRAFT' && (
                                    <>
                                        <button
                                            onClick={() => { setSelectedAddendum(addendum); setShowOperationModal(true); }}
                                            style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '4px' }}
                                        >
                                            + Operação
                                        </button>
                                        <button
                                            onClick={() => handleApprove(addendum.id)}
                                            style={{ padding: '6px 12px', fontSize: '13px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            ✓ Aprovar
                                        </button>
                                    </>
                                )}
                                {addendum.status !== 'CANCELLED' && (
                                    <button
                                        onClick={() => handleCancel(addendum.id, addendum.status === 'APPROVED')}
                                        style={{ padding: '6px 12px', fontSize: '13px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ✕ Cancelar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Description and Totals */}
                        <div style={{ padding: '12px 15px' }}>
                            <p style={{ margin: '0 0 10px 0', color: '#666' }}>{addendum.description}</p>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9em' }}>
                                <span style={{ color: '#16a34a' }}>➕ Acréscimo: {formatCurrency(Number(addendum.totalAddition))}</span>
                                <span style={{ color: '#dc2626' }}>➖ Supressão: {formatCurrency(Number(addendum.totalSuppression))}</span>
                                <span style={{ fontWeight: 'bold', color: Number(addendum.netValue) >= 0 ? '#16a34a' : '#dc2626' }}>
                                    Líquido: {formatCurrency(Number(addendum.netValue))}
                                </span>
                            </div>
                        </div>

                        {/* Operations List */}
                        {addendum.operations && addendum.operations.length > 0 && (
                            <div style={{ padding: '0 15px 15px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', background: '#f1f5f9' }}>
                                            <th style={{ padding: '8px' }}>Operação</th>
                                            <th style={{ padding: '8px' }}>Item</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Qtd Original</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Nova Qtd</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Preço Original</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Novo Preço</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Impacto</th>
                                            {addendum.status === 'DRAFT' && <th style={{ padding: '8px' }}></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addendum.operations.map((op: any) => (
                                            <tr key={op.id} style={{ borderTop: '1px solid #eee' }}>
                                                <td style={{ padding: '8px' }}>{operationTypeLabels[op.operationType]}</td>
                                                <td style={{ padding: '8px' }}>
                                                    {op.operationType === 'ADD'
                                                        ? <span style={{ color: '#16a34a' }}>{op.newItemCode} - {op.newItemDescription}</span>
                                                        : op.contractItem?.code || op.contractItem?.description || '-'
                                                    }
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{op.originalQuantity ? formatNumber(Number(op.originalQuantity)) : '-'}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: op.newQuantity ? '#2563eb' : 'inherit' }}>
                                                    {op.newQuantity ? formatNumber(Number(op.newQuantity)) : '-'}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{op.originalPrice ? formatCurrency(Number(op.originalPrice)) : '-'}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: op.newPrice ? '#2563eb' : 'inherit' }}>
                                                    {op.newPrice ? formatCurrency(Number(op.newPrice)) : '-'}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: Number(op.operationValue) >= 0 ? '#16a34a' : '#dc2626' }}>
                                                    {formatCurrency(Number(op.operationValue))}
                                                </td>
                                                {addendum.status === 'DRAFT' && (
                                                    <td style={{ padding: '8px' }}>
                                                        <button
                                                            onClick={() => handleRemoveOperation(op.id)}
                                                            style={{ padding: '4px 8px', fontSize: '12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Create Addendum Modal */}
            {showCreateModal && (
                <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', minWidth: '400px', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0 }}>Novo Aditivo</h3>
                        <form onSubmit={handleCreateAddendum}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Data</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição/Justificativa</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ex: Aditivo de reequilíbrio econômico-financeiro"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Criar Aditivo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Operation Modal */}
            {showOperationModal && (
                <div onClick={() => { setShowOperationModal(false); resetOperationForm(); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', minWidth: '500px', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0 }}>Adicionar Operação ao Aditivo #{selectedAddendum?.number}</h3>
                        <form onSubmit={handleAddOperation}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo de Operação</label>
                                <select
                                    value={operationType}
                                    onChange={e => setOperationType(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="MODIFY_QTY">📊 Modificar Quantidade</option>
                                    <option value="MODIFY_PRICE">💰 Modificar Preço</option>
                                    <option value="MODIFY_BOTH">🔄 Modificar Quantidade e Preço</option>
                                    <option value="SUPPRESS">🚫 Suprimir Item</option>
                                    <option value="ADD">➕ Adicionar Novo Item</option>
                                </select>
                            </div>

                            {operationType !== 'ADD' && (
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Item do Contrato</label>
                                    <select
                                        required
                                        value={selectedContractItem}
                                        onChange={e => setSelectedContractItem(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">Selecione um item...</option>
                                        {leafItems.map((i: any) => (
                                            <option key={i.id} value={i.id}>
                                                {i.code || '(sem código)'} - {i.description?.substring(0, 50)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {operationType === 'ADD' && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo do Novo Item</label>
                                        <select
                                            value={newItemType}
                                            onChange={e => setNewItemType(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            <option value="STAGE">Etapa</option>
                                            <option value="SUBSTAGE">Sub-etapa</option>
                                            <option value="ITEM">Item</option>
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pai (opcional)</label>
                                        <select
                                            value={newItemParentId}
                                            onChange={e => setNewItemParentId(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            <option value="">Nenhum (raiz)</option>
                                            {containerItems.map((i: any) => (
                                                <option key={i.id} value={i.id}>{i.code} - {i.description?.substring(0, 40)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código</label>
                                            <input value={newItemCode} onChange={e => setNewItemCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unidade</label>
                                            <input value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="m², un, kg..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição</label>
                                        <input required value={newItemDescription} onChange={e => setNewItemDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                    </div>
                                </>
                            )}

                            {(operationType === 'MODIFY_QTY' || operationType === 'MODIFY_BOTH' || operationType === 'ADD') && (
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        {operationType === 'ADD' ? 'Quantidade' : 'Nova Quantidade'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        required={operationType === 'MODIFY_QTY' || operationType === 'ADD'}
                                        value={newQuantity}
                                        onChange={e => setNewQuantity(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            )}

                            {(operationType === 'MODIFY_PRICE' || operationType === 'MODIFY_BOTH' || operationType === 'ADD') && (
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        {operationType === 'ADD' ? 'Preço Unitário' : 'Novo Preço Unitário'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required={operationType === 'MODIFY_PRICE' || operationType === 'ADD'}
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            )}

                            {operationType === 'SUPPRESS' && (
                                <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', marginBottom: '15px', color: '#991b1b' }}>
                                    ⚠️ O item selecionado será marcado como suprimido. O valor total será subtraído do contrato.
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => { setShowOperationModal(false); resetOperationForm(); }} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Adicionar Operação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
