import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ContractSpreadsheet } from '../components/contracts/ContractSpreadsheet';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../components/contracts/SortableItem';

export function ContractDetails() {
    const { id } = useParams();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const [newItemType, setNewItemType] = useState('STAGE');
    const [possibleChildTypes, setPossibleChildTypes] = useState<string[]>([]);
    const [parentId, setParentId] = useState<string | null>(null);

    // Form Fields
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [costCenter, setCostCenter] = useState('');
    const [techSpecs, setTechSpecs] = useState('');

    const typeOrder: Record<string, number> = {
        'STAGE': 1,
        'SUBSTAGE': 2,
        'LEVEL': 3,
        'SUBLEVEL': 4,
        'GROUP': 5,
        'SUBGROUP': 6,
        'ITEM': 7
    };

    const typeLabels: Record<string, string> = {
        'STAGE': 'Etapa',
        'SUBSTAGE': 'Sub-etapa',
        'LEVEL': 'Nível',
        'SUBLEVEL': 'Sub-nível',
        'GROUP': 'Grupo',
        'SUBGROUP': 'Sub-grupo',
        'ITEM': 'Item'
    };

    useEffect(() => {
        loadContract();
    }, [id]);

    const loadContract = async () => {
        try {
            const { data } = await api.get(`/contracts/${id}`);
            setContract(data);
        } catch { } finally {
            setLoading(false);
        }
    };

    const openCreateModal = (parent: any = null) => {
        setModalMode('CREATE');
        setEditingItemId(null);
        setParentId(parent ? parent.id : null);

        // Determine possible types
        const parentOrder = parent ? typeOrder[parent.type] : 0;
        const validTypes = parent
            ? Object.entries(typeOrder).filter(([_, order]) => order > parentOrder).map(([type]) => type)
            : ['STAGE']; // Root items must be STAGE

        setPossibleChildTypes(validTypes);
        setNewItemType(validTypes[0] || 'ITEM');

        setCode('');
        setDescription('');
        setQuantity('');
        setUnit('');
        setUnitPrice('');
        setCostCenter('');
        setTechSpecs('');
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setModalMode('EDIT');
        setEditingItemId(item.id);
        setNewItemType(item.type);
        setParentId(item.parentId); // Load current parent

        // Potential Parents: All items dependent on type logic (roughly)
        // For simplicity, allow reparenting to any STAGE/SUBSTAGE/GROUP that is NOT self or descendant.
        // We can filter this list in the render or here.
        setCode(item.code);
        setDescription(item.description);
        setQuantity(item.quantity ? Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '');
        setUnit(item.unit || '');
        setUnitPrice(item.unitPrice ? Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        setCostCenter(item.costCenter || '');
        setTechSpecs(item.techSpecs || '');
        setShowModal(true);
    };

    const parseNumber = (value: string) => {
        if (!value) return null;
        // Remove thousands separator (.) and replace decimal (,) with (.)
        return Number(value.replace(/\./g, '').replace(',', '.'));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                code,
                description,
                quantity: parseNumber(quantity),
                unit,
                unitPrice: parseNumber(unitPrice),
                costCenter,
                techSpecs
            };

            if (modalMode === 'CREATE') {
                await api.post(`/contracts/${id}/items`, {
                    ...payload,
                    type: newItemType,
                    parentId
                });
            } else {
                await api.put(`/contracts/items/${editingItemId}`, { ...payload, parentId });
            }

            setShowModal(false);
            loadContract();
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.error || err.message || 'Erro ao salvar item';
            alert(`Erro: ${errorMessage}`);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Tem certeza? Isso pode excluir toda a árvore de filhos deste item.')) return;
        try {
            await api.delete(`/contracts/items/${itemId}`);
            loadContract();
        } catch (err: any) {
            alert('Erro ao excluir item');
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/contracts/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `contract-${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Erro ao exportar');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        if (!confirm('ATENÇÃO: A importação irá APAGAR todos os itens atuais e substituir pelos do Excel. Deseja continuar?')) {
            e.target.value = ''; // Reset
            return;
        }

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            setLoading(true);
            await api.post(`/contracts/${id}/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Importação realizada com sucesso!');
            loadContract();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao importar');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset
        }
    };

    // DnD Logic
    const sensors = useSensors(useSensor(PointerSensor));

    const findContainer = (id: string, items: any[]): any[] | undefined => {
        // Check root
        if (items.find(i => i.id === id)) return items;
        // Check children
        for (const item of items) {
            if (item.children && item.children.length > 0) {
                const found = findContainer(id, item.children);
                if (found) return found;
            }
        }
        return undefined;
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const items = contract.items || [];
        const container = findContainer(active.id as string, items);

        // Ensure both items are in the same container (sibling reorder only)
        // If not, we cancel (or could handle move, but preventing for now)
        const overContainer = findContainer(over.id as string, items);

        // If same container, just reorder
        if (container && container === overContainer) {
            const oldIndex = container.findIndex(i => i.id === active.id);
            const newIndex = container.findIndex(i => i.id === over.id);

            if (oldIndex === -1 || newIndex === -1) {
                loadContract();
                return;
            }

            // Calculate new order
            const newOrder = arrayMove(container, oldIndex, newIndex);

            // Prepare updates for backend
            const updates = newOrder.map((item, index) => ({
                id: item.id,
                orderIndex: index
            }));

            // Optimistic update: modify container in place so UI shows immediately
            container.splice(0, container.length, ...newOrder);
            // Force re-render by updating state with shallow clone
            setContract({ ...contract });

            try {
                await api.put('/contracts/items/reorder', { items: updates });
                // Success - keep optimistic state, no reload needed
            } catch (err: any) {
                console.error('Reorder error:', err);
                // Reload to restore original state on error
                loadContract();
                if (err.response?.status !== 404) {
                    const errorMessage = err.response?.data?.error || err.message || 'Erro ao reordenar';
                    alert(`Erro ao reordenar: ${errorMessage}`);
                }
            }
        } else if (container && overContainer) {
            // Reparenting (Moving to a different list)
            // We need to find the NEW PARENT.
            // 'overContainer' is the list of children of Someone.
            // Let's find who owns 'overContainer'.

            const findParentId = (items: any[], targetList: any[]): string | null => {
                for (const item of items) {
                    if (item.children === targetList) return item.id;
                    if (item.children) {
                        const found = findParentId(item.children, targetList);
                        if (found) return found;
                    }
                }
                return null; // Root items have null parent, but their 'items' list is 'contract.items'
            };

            const rootItems = contract.items || [];
            let newParentId = findParentId(rootItems, overContainer);

            // Special case: if overContainer IS the root list
            if (overContainer === rootItems) newParentId = null;
            // The recursion above might not catch root if passed explicitly? 
            // Actually 'findParentId' works if 'targetList' is explicitly 'item.children'.
            // If targetList is 'contract.items', it won't match any item.children. Correct.

            // Get the moved item
            const activeItem = container.find(i => i.id === active.id);
            if (!activeItem) return;

            // Optimistic/API
            try {
                // 1. Update Parent
                await api.put(`/contracts/items/${active.id}`, { parentId: newParentId });

                // 2. Reorder in Dest? (New item usually appended or inserted?)
                // Dnd-kit logic: we have the 'over' item index.
                // We should theoretically insert at that index.
                // But for simplicity, let's just move it first.
                // Or better: update parent AND order.

                // Since this is a two-step op, let's just reload. 
                // The user dropped it "over" something, so they expect it nearby.
                // But changing parent puts it at the end usually unless we handle order.
                // Improving: We can try to set orderIndex too? 
                // Let's just Reparent for now. User can reorder again if needed. 
                // Reparenting is the hard part.

                loadContract();
            } catch (err: any) {
                console.error(err);
                const errorMessage = err.response?.data?.error || err.message || 'Erro ao mover item';
                alert(`Erro ao mover: ${errorMessage}`);
            }
        }
    };

    const renderSortableItems = (items: any[], level: number = 0) => {
        return items.map(item => (
            <SortableItem
                key={item.id}
                item={item}
                level={level}
                typeLabels={typeLabels}
                onEdit={openEditModal}
                onDelete={handleDeleteItem}
                onCreateChild={openCreateModal}
                renderChildren={renderSortableItems}
            />
        ));
    };

    if (loading) return <div>Carregando...</div>;
    if (!contract) return <div>Contrato não encontrado</div>;

    return (
        <div>
            <div>
                <Link to="/contracts" style={{ display: 'inline-block', marginBottom: '10px', textDecoration: 'none', color: '#2563eb' }}>&larr; Voltar para Lista</Link>
                <h2>Contrato: {contract.number}</h2>
                <div style={{ marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p><strong>Empresa:</strong> {contract.company?.name}</p>
                    <p><strong>Objeto:</strong> {contract.object}</p>
                    <p><strong>Vigência:</strong> {new Date(contract.startDate).toLocaleDateString()} até {new Date(contract.endDate).toLocaleDateString()}</p>
                    <p><strong>Valor Total:</strong> <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#059669' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.totalValue)}</span></p>
                </div>

                {/* Toolbar com Export/Import */}
                <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={handleExport} style={{ padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📤 Exportar Excel</button>

                    <button
                        onClick={async () => {
                            try {
                                const response = await api.get('/contracts/template/download', { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'modelo_importacao_contrato.xlsx');
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                            } catch (err) {
                                alert('Erro ao baixar modelo');
                            }
                        }}
                        style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        📥 Baixar Modelo
                    </button>

                    <label style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                        📁 Importar Excel
                        <input type="file" accept=".xlsx" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                </div>

                {/* Planilha Unificada do Contrato */}
                {id && (
                    <ContractSpreadsheet
                        contractId={id}
                        onContractUpdate={loadContract}
                    />
                )}
            </div>

            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '24px', borderRadius: '8px', minWidth: '450px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginBottom: '16px' }}>{modalMode === 'CREATE' ? 'Adicionar' : 'Editar'} {typeLabels[newItemType] || newItemType}</h3>
                        <form onSubmit={handleSubmit}>

                            {modalMode === 'CREATE' && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Tipo do Item</label>
                                    <select value={newItemType} onChange={e => setNewItemType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                        {possibleChildTypes.map(type => (
                                            <option key={type} value={type}>{typeLabels[type] || type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Código (Ex: 1.1, 1.1.1)</label>
                                <input type="text" value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            {modalMode === 'EDIT' && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Mover para Pai (Reparentar)</label>
                                    <select
                                        value={parentId || ''}
                                        onChange={e => setParentId(e.target.value || null)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    >
                                        <option value="">(Raiz)</option>
                                        {/* Flatten the tree to show options? Or just show all items that are containers */}
                                        {contract?.items && (function flatten(items: any[], depth = 0): any[] {
                                            return items.reduce((acc, i) => {
                                                // Prevent resizing to self or descendants
                                                if (i.id === editingItemId) return acc;

                                                // Only show containers (STAGE, GROUP, etc) as valid parents
                                                const isContainer = ['STAGE', 'SUBSTAGE', 'GROUP', 'SUBGROUP'].includes(i.type);
                                                if (!isContainer) return acc;

                                                acc.push(
                                                    <option key={i.id} value={i.id}>
                                                        {'-'.repeat(depth)} {i.code} {i.description} ({typeLabels[i.type]})
                                                    </option>
                                                );
                                                if (i.children) acc.push(...flatten(i.children, depth + 1));
                                                return acc;
                                            }, [] as any[]);
                                        })(contract.items)}
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Descrição</label>
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            {newItemType === 'ITEM' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Unidade</label>
                                            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Quantidade</label>
                                            <input
                                                type="text"
                                                value={quantity}
                                                onChange={e => setQuantity(e.target.value)}
                                                required
                                                placeholder="0,000"
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Preço Unitário</label>
                                            <input
                                                type="text"
                                                value={unitPrice}
                                                onChange={e => setUnitPrice(e.target.value)}
                                                required
                                                placeholder="0,00"
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Centro de Custo</label>
                                            <input type="text" value={costCenter} onChange={e => setCostCenter(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em' }}>Especificações Técnicas</label>
                                        <textarea value={techSpecs} onChange={e => setTechSpecs(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }} />
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
