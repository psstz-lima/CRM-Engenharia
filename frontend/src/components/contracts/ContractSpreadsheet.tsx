import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../services/api';

interface ContractSpreadsheetProps {
    contractId: string;
    onContractUpdate: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value: number, decimals = 3) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

const typeLabels: Record<string, string> = {
    'STAGE': 'ETAPA', 'SUBSTAGE': 'SUB-ETAPA', 'LEVEL': 'NÍVEL', 'SUBLEVEL': 'SUB-NÍVEL',
    'GROUP': 'GRUPO', 'SUBGROUP': 'SUB-GRUPO', 'ITEM': 'ITEM'
};

// SortableRow component for drag-and-drop
function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    return (
        <tr ref={setNodeRef} style={style} {...attributes}>
            <td {...listeners} style={{ padding: '4px', textAlign: 'center' as const, borderBottom: '1px solid #e5e7eb', cursor: 'grab', color: '#9ca3af', width: '30px' }}>⠿</td>
            {children}
        </tr>
    );
}

export function ContractSpreadsheet({ contractId, onContractUpdate }: ContractSpreadsheetProps) {
    const [items, setItems] = useState<any[]>([]);
    const [rawItems, setRawItems] = useState<any[]>([]);
    const [addendums, setAddendums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAddendumModal, setShowAddendumModal] = useState(false);
    const [addendumDate, setAddendumDate] = useState(new Date().toISOString().split('T')[0]);
    const [addendumDescription, setAddendumDescription] = useState('');
    const [showOperationModal, setShowOperationModal] = useState(false);
    const [selectedAddendum, setSelectedAddendum] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [operationType, setOperationType] = useState<string>('MODIFY_QTY');
    const [newQuantity, setNewQuantity] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [itemCode, setItemCode] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemUnit, setItemUnit] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemType, setItemType] = useState('ITEM');
    const [itemParentId, setItemParentId] = useState<string | null>(null);

    // Search filter state
    const [searchFilter, setSearchFilter] = useState('');

    // Collapsed groups state (set of collapsed group IDs)
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const toggleCollapse = (groupId: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const expandAll = () => setCollapsedGroups(new Set());
    const collapseAllGroups = (items: any[]) => {
        const groupIds = new Set<string>();
        const collectGroups = (list: any[]) => {
            list.forEach(item => {
                if (item.type !== 'ITEM' && item.children?.length > 0) {
                    groupIds.add(item.id);
                    collectGroups(item.children);
                }
            });
        };
        collectGroups(items);
        setCollapsedGroups(groupIds);
    };

    function flattenItems(items: any[]): any[] {
        let flat: any[] = [];
        items.forEach(i => {
            const hasChildren = i.children && i.children.length > 0;
            const isCollapsed = collapsedGroups.has(i.id);
            flat.push({ ...i, hasChildren, isCollapsed });
            if (hasChildren && !isCollapsed) {
                flat = flat.concat(flattenItems(i.children));
            }
        });
        return flat;
    }

    // Rebuild hierarchy from flat items using parentId
    function rebuildHierarchy(flatItems: any[]): any[] {
        const itemMap = new Map<string, any>();
        const roots: any[] = [];

        // First pass: create map with copies
        flatItems.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] });
        });

        // Second pass: build tree
        flatItems.forEach(item => {
            const node = itemMap.get(item.id);
            if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    // Calculate subtotals for each container from its children (works on tree structure)
    function calculateSubtotals(items: any[]): any[] {
        return items.map(item => {
            // For any item with children (containers like STAGE, SUBSTAGE, LEVEL, etc.)
            if (item.children && item.children.length > 0) {
                const childrenWithSubtotals = calculateSubtotals(item.children);
                let subtotalValue = 0;

                for (const child of childrenWithSubtotals) {
                    if (child.type === 'ITEM') {
                        // Direct item child - add its value if not suppressed
                        if (!child.isSuppressed) {
                            subtotalValue += Number(child.vigentTotalValue) || ((Number(child.quantity) || 0) * (Number(child.unitPrice) || 0));
                        }
                    } else {
                        // Child is another container - add its subtotal
                        subtotalValue += child._subtotalValue || 0;
                    }
                }

                return { ...item, children: childrenWithSubtotals, _subtotalValue: subtotalValue };
            }
            return item;
        });
    }

    // Process items: rebuild hierarchy -> calculate subtotals -> flatten for display
    function processItems(flatItems: any[]): any[] {
        const tree = rebuildHierarchy(flatItems);
        const withSubtotals = calculateSubtotals(tree);
        return flattenItems(withSubtotals);
    }

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [contractRes, addendumsRes] = await Promise.all([
                api.get(`/contracts/${contractId}`),
                api.get(`/contracts/${contractId}/addendums`)
            ]);
            const rawTreeItems = contractRes.data.items || [];
            setRawItems(rawTreeItems);
            setAddendums(addendumsRes.data || []);
            try {
                const vigentRes = await api.get(`/contracts/${contractId}/vigent-items`);
                // Rebuild hierarchy and calculate subtotals
                setItems(processItems(vigentRes.data.items || []));
            } catch {
                // Fallback to raw items with subtotals
                setItems(processItems(flattenItems(rawTreeItems)));
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }, [contractId]);

    useEffect(() => { loadData(); }, [loadData]);

    const flatItems = items;
    const flatRawItems = flattenItems(rawItems);

    // Drag and drop
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = flatItems.findIndex((i: any) => i.id === active.id);
        const newIndex = flatItems.findIndex((i: any) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        setItems(arrayMove([...flatItems], oldIndex, newIndex));
        try {
            await api.put(`/contracts/items/${active.id}/reorder`, { targetItemId: over.id, position: newIndex > oldIndex ? 'after' : 'before' });
            loadData(); onContractUpdate();
        } catch { loadData(); }
    }

    // Addendum functions
    async function handleCreateAddendum(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.post(`/contracts/${contractId}/addendums`, { description: addendumDescription, date: addendumDate });
            setShowAddendumModal(false); setAddendumDescription(''); loadData(); onContractUpdate();
        } catch (err: any) { alert(err.response?.data?.error || 'Erro'); }
    }

    async function handleAddOperation(e: React.FormEvent) {
        e.preventDefault();
        try {
            const payload: any = { operationType, contractItemId: selectedItem.id };
            if (operationType === 'MODIFY_QTY') payload.newQuantity = Number(newQuantity);
            else if (operationType === 'MODIFY_PRICE') payload.newPrice = Number(newPrice);
            else if (operationType === 'MODIFY_BOTH') { payload.newQuantity = Number(newQuantity); payload.newPrice = Number(newPrice); }
            await api.post(`/contracts/addendums/${selectedAddendum.id}/operations`, payload);
            setShowOperationModal(false); setNewQuantity(''); setNewPrice(''); loadData(); onContractUpdate();
        } catch (err: any) { alert(err.response?.data?.error || 'Erro'); }
    }

    async function handleApprove(id: string) {
        if (!confirm('Aprovar?')) return;
        try { await api.post(`/contracts/addendums/${id}/approve`); loadData(); onContractUpdate(); }
        catch (err: any) { alert(err.response?.data?.error || 'Erro'); }
    }

    async function handleCancel(id: string, approved: boolean) {
        if (!confirm(approved ? '⚠️ Cancelar aditivo aprovado?' : 'Cancelar?')) return;
        try { await api.post(`/contracts/addendums/${id}/cancel`, { confirmCancellation: approved }); loadData(); onContractUpdate(); }
        catch (err: any) { alert(err.response?.data?.error || 'Erro'); }
    }

    // Item CRUD
    function openItemModal(item?: any, parentId?: string | null) {
        if (item) {
            setEditingItemId(item.id); setItemCode(item.code || ''); setItemDescription(item.description || '');
            setItemUnit(item.unit || ''); setItemQuantity(String(item.quantity || '')); setItemPrice(String(item.unitPrice || ''));
            setItemType(item.type || 'ITEM'); setItemParentId(item.parentId || null);
        } else {
            setEditingItemId(null); setItemCode(''); setItemDescription(''); setItemUnit('');
            setItemQuantity(''); setItemPrice(''); setItemType('ITEM'); setItemParentId(parentId || null);
        }
        setShowItemModal(true);
    }

    async function handleSaveItem(e: React.FormEvent) {
        e.preventDefault();
        try {
            const data: any = {
                code: itemCode, description: itemDescription, type: itemType,
                unit: itemType === 'ITEM' ? itemUnit : null,
                quantity: itemType === 'ITEM' ? Number(itemQuantity.replace(',', '.')) : null,
                unitPrice: itemType === 'ITEM' ? Number(itemPrice.replace(',', '.')) : null,
                parentId: itemParentId
            };
            if (editingItemId) await api.put(`/contracts/items/${editingItemId}`, data);
            else await api.post(`/contracts/${contractId}/items`, data);
            setShowItemModal(false); loadData(); onContractUpdate();
        } catch (err: any) { alert(err.response?.data?.error || 'Erro'); }
    }

    async function handleDeleteItem(itemId: string) {
        if (!confirm('Excluir?')) return;
        try { await api.delete(`/contracts/items/${itemId}`); loadData(); onContractUpdate(); }
        catch (err: any) { alert(err.response?.data?.error || 'Erro'); }
    }

    function openOperationModal(item: any, addendum: any) {
        setSelectedItem(item); setSelectedAddendum(addendum);
        setOperationType('MODIFY_QTY');
        setNewQuantity(String(item.vigentQuantity || item.quantity || 0));
        setNewPrice(String(item.vigentUnitPrice || item.unitPrice || 0));
        setShowOperationModal(true);
    }

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;

    const activeAddendums = addendums.filter((a: any) => a.status !== 'CANCELLED');

    return (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '12px 15px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1em' }}>📊 Planilha do Contrato</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search Filter */}
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="🔍 Filtrar por código ou descrição..."
                        style={{
                            width: '280px',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9em',
                            outline: 'none'
                        }}
                    />
                    {searchFilter && (
                        <button
                            onClick={() => setSearchFilter('')}
                            style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9em' }}
                        >
                            ✕
                        </button>
                    )}
                    {/* Expand/Collapse Buttons */}
                    <button
                        onClick={expandAll}
                        title="Expandir Todos"
                        style={{ padding: '6px 10px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}
                    >
                        ➕
                    </button>
                    <button
                        onClick={() => collapseAllGroups(rawItems)}
                        title="Recolher Todos"
                        style={{ padding: '6px 10px', background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}
                    >
                        ➖
                    </button>
                    <button onClick={() => openItemModal()} style={{ padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}>+ Item</button>
                    <button onClick={() => setShowAddendumModal(true)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}>+ Aditivo</button>
                    <button onClick={loadData} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>🔄</button>
                </div>
            </div>

            {/* Addendums Bar */}
            {activeAddendums.length > 0 && (
                <div style={{ padding: '8px 15px', background: '#fefce8', borderBottom: '1px solid #fde047', display: 'flex', gap: '15px', alignItems: 'center', fontSize: '0.85em', flexWrap: 'wrap' }}>
                    {activeAddendums.map((add: any) => (
                        <div key={add.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: add.status === 'APPROVED' ? '#dcfce7' : '#fef9c3', borderRadius: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>Aditivo {add.number}</span>
                            <span style={{ color: '#666', fontSize: '0.9em' }}>{new Date(add.date).toLocaleDateString('pt-BR')}</span>
                            <span>{add.status === 'APPROVED' ? '✅' : '📝'}</span>
                            {add.status === 'DRAFT' && (
                                <>
                                    <button onClick={() => handleApprove(add.id)} style={{ padding: '2px 8px', fontSize: '11px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Aprovar</button>
                                    <button onClick={() => handleCancel(add.id, false)} style={{ padding: '2px 8px', fontSize: '11px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>✕</button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto', margin: '0 15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82em', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ width: '30px', padding: '10px 4px', color: '#64748b' }}>☰</th>
                            <th style={{ padding: '10px 6px', textAlign: 'center', width: '75px', color: '#475569', fontWeight: 600 }}>Tipo</th>
                            <th style={{ padding: '10px 6px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Código</th>
                            <th style={{ padding: '10px 6px', textAlign: 'left', minWidth: '200px', color: '#475569', fontWeight: 600 }}>Descrição</th>
                            <th style={{ padding: '10px 6px', textAlign: 'center', width: '50px', color: '#475569', fontWeight: 600 }}>Un</th>
                            <th style={{ padding: '10px 6px', textAlign: 'right', width: '100px', color: '#475569', fontWeight: 600 }}>P. Unit.</th>
                            <th colSpan={2} style={{ padding: '10px 6px', textAlign: 'center', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>📋 Base</th>
                            {activeAddendums.map((add: any) => (
                                <th key={add.id} colSpan={2} style={{ padding: '10px 6px', textAlign: 'center', background: add.status === 'APPROVED' ? '#dcfce7' : '#fef3c7', color: add.status === 'APPROVED' ? '#166534' : '#92400e', fontWeight: 600 }}>
                                    {add.status === 'DRAFT' ? '📝' : '✅'} Ad.{add.number}
                                </th>
                            ))}
                            <th colSpan={2} style={{ padding: '10px 6px', textAlign: 'center', background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>✅ Vigente</th>
                            <th style={{ width: '90px', color: '#475569', fontWeight: 600 }}>Ações</th>
                        </tr>
                        <tr style={{ background: '#f1f5f9', fontSize: '0.9em', color: '#64748b' }}>
                            <th></th><th></th><th></th><th></th><th></th><th></th>
                            <th style={{ padding: '6px', textAlign: 'right', fontWeight: 500 }}>Qtd</th>
                            <th style={{ padding: '6px', textAlign: 'right', fontWeight: 500 }}>Valor</th>
                            {activeAddendums.map((add: any) => (
                                <React.Fragment key={`sub-${add.id}`}>
                                    <th style={{ padding: '6px', textAlign: 'right', fontWeight: 500 }}>Δ Qtd</th>
                                    <th style={{ padding: '6px', textAlign: 'right', fontWeight: 500 }}>Δ Valor</th>
                                </React.Fragment>
                            ))}
                            <th style={{ padding: '6px', textAlign: 'right', fontWeight: 500 }}>Qtd</th>
                            <th style={{ padding: '6px', textAlign: 'right', fontWeight: 500 }}>Valor</th>
                            <th></th>
                        </tr>
                    </thead>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={flatItems.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                            <tbody>
                                {flatItems.filter((item: any) => {
                                    if (!searchFilter.trim()) return true;
                                    const search = searchFilter.toLowerCase();
                                    const matchesCode = item.code?.toLowerCase().includes(search);
                                    const matchesDescription = item.description?.toLowerCase().includes(search);
                                    return matchesCode || matchesDescription;
                                }).map((item: any, idx: number) => {
                                    const isContainer = item.type !== 'ITEM';
                                    const baseQty = Number(item.quantity) || 0;
                                    const basePrice = Number(item.unitPrice) || 0;
                                    const baseValue = baseQty * basePrice;
                                    const rowBg = isContainer ? '#f0f9ff' : item.isSuppressed ? '#fef2f2' : item.isAddedByAddendum ? '#f0fdf4' : (idx % 2 === 0 ? '#fff' : '#f9fafb');

                                    const getAddendumDelta = (addendumId: string) => {
                                        const h = item.history?.find((x: any) => x.addendumId === addendumId);
                                        if (!h) return { qty: null, value: null };
                                        const hi = item.history?.findIndex((x: any) => x.addendumId === addendumId);
                                        const prev = hi > 0 ? item.history[hi - 1] : null;
                                        return { qty: h.quantity - (prev ? prev.quantity : baseQty), value: h.totalValue - (prev ? prev.totalValue : baseValue) };
                                    };

                                    return (
                                        <SortableRow key={item.id} id={item.id}>
                                            <td style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '10px', color: isContainer ? '#1e40af' : '#6b7280', fontWeight: isContainer ? 'bold' : 'normal' }}>
                                                {typeLabels[item.type] || item.type}
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', background: rowBg, fontWeight: isContainer ? 'bold' : 'normal', color: isContainer ? '#1e40af' : 'inherit' }}>
                                                {isContainer && item.hasChildren && (
                                                    <button
                                                        onClick={() => toggleCollapse(item.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            marginRight: '4px',
                                                            fontSize: '0.8em',
                                                            color: '#6b7280',
                                                            padding: '2px 4px'
                                                        }}
                                                        title={item.isCollapsed ? 'Expandir' : 'Recolher'}
                                                    >
                                                        {item.isCollapsed ? '▶' : '▼'}
                                                    </button>
                                                )}
                                                {item.code || '-'}
                                                {item.isSuppressed && <span style={{ marginLeft: '4px' }}>🚫</span>}
                                                {item.isAddedByAddendum && <span style={{ marginLeft: '4px', color: '#16a34a' }}>➕</span>}
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: isContainer ? 'bold' : 'normal', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: isContainer ? 'uppercase' : 'none' }} title={item.description}>{item.description}</td>
                                            <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{isContainer ? '' : item.unit}</td>
                                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>{isContainer ? '' : formatCurrency(basePrice)}</td>
                                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: '#eff6ff' }}>{isContainer ? '' : item.isAddedByAddendum ? '-' : formatNumber(baseQty)}</td>
                                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: '#eff6ff' }}>{isContainer ? formatCurrency(item._subtotalValue || 0) : item.isAddedByAddendum ? '-' : formatCurrency(baseValue)}</td>
                                            {activeAddendums.map((add: any) => {
                                                const d = getAddendumDelta(add.id);
                                                const canEdit = add.status === 'DRAFT' && !isContainer;
                                                return (
                                                    <React.Fragment key={`d-${add.id}`}>
                                                        <td onClick={() => canEdit && openOperationModal(item, add)} style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: add.status === 'APPROVED' ? '#f0fdf4' : '#fefce8', cursor: canEdit ? 'pointer' : 'default' }}>
                                                            {isContainer ? '' : d.qty !== null ? <span style={{ color: d.qty > 0 ? '#16a34a' : d.qty < 0 ? '#dc2626' : '#9ca3af' }}>{d.qty > 0 ? '+' : ''}{formatNumber(d.qty)}</span> : (canEdit ? <span style={{ color: '#9ca3af' }}>+</span> : '-')}
                                                        </td>
                                                        <td onClick={() => canEdit && openOperationModal(item, add)} style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: add.status === 'APPROVED' ? '#f0fdf4' : '#fefce8', cursor: canEdit ? 'pointer' : 'default' }}>
                                                            {d.value !== null ? <span style={{ color: d.value > 0 ? '#16a34a' : d.value < 0 ? '#dc2626' : '#9ca3af' }}>{d.value > 0 ? '+' : ''}{formatCurrency(d.value)}</span> : '-'}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: '#dcfce7', fontWeight: 'bold' }}>{isContainer ? '' : item.isSuppressed ? <span style={{ color: '#dc2626' }}>0</span> : formatNumber(item.vigentQuantity || baseQty)}</td>
                                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: '#dcfce7', fontWeight: 'bold' }}>{isContainer ? formatCurrency(item._subtotalValue || 0) : item.isSuppressed ? <span style={{ color: '#dc2626' }}>R$ 0</span> : formatCurrency(item.vigentTotalValue || baseValue)}</td>
                                            <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                                                    {isContainer && (
                                                        <button onClick={() => openItemModal(undefined, item.id)} style={{ padding: '2px 6px', fontSize: '10px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '3px', cursor: 'pointer' }} title="Adicionar filho">+</button>
                                                    )}
                                                    <button onClick={() => openItemModal(item)} style={{ padding: '2px 6px', fontSize: '10px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '3px', cursor: 'pointer' }} title="Editar">✏️</button>
                                                    <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '2px 6px', fontSize: '10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '3px', cursor: 'pointer' }} title="Excluir">🗑️</button>
                                                </div>
                                            </td>
                                        </SortableRow>
                                    );
                                })}
                            </tbody>
                        </SortableContext>
                    </DndContext>
                    <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #e5e7eb', fontWeight: 600 }}>
                            <td></td>
                            <td colSpan={5} style={{ padding: '12px 8px', color: '#1e293b' }}>📊 TOTAIS</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', background: '#dbeafe', color: '#64748b' }}>-</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', background: '#dbeafe', color: '#1e40af' }}>{formatCurrency(flatItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0))}</td>
                            {activeAddendums.map((add: any) => (
                                <React.Fragment key={`tot-${add.id}`}>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', background: '#fef3c7', color: '#64748b' }}>-</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', background: '#fef3c7', color: Number(add.netValue) >= 0 ? '#166534' : '#dc2626' }}>{Number(add.netValue) > 0 ? '+' : ''}{formatCurrency(Number(add.netValue) || 0)}</td>
                                </React.Fragment>
                            ))}
                            <td style={{ padding: '12px 8px', textAlign: 'right', background: '#d1fae5', color: '#64748b' }}>-</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', background: '#d1fae5', color: '#065f46', fontSize: '1.1em' }}>{formatCurrency(flatItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((s: number, i: any) => s + (Number(i.vigentTotalValue) || ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0))), 0))}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Legend */}
            <div style={{ margin: '15px', padding: '15px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '0.9em', color: '#1e293b' }}>📋 Legenda</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.8em' }}>
                    {/* Types Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#475569' }}>📁 Categorias:</span>
                        <span style={{ padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontWeight: '500' }}>ETAPA</span>
                        <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: '500' }}>SUB-ETAPA</span>
                        <span style={{ padding: '2px 8px', background: '#ede9fe', color: '#5b21b6', borderRadius: '4px', fontWeight: '500' }}>NÍVEL</span>
                        <span style={{ padding: '2px 8px', background: '#fae8ff', color: '#86198f', borderRadius: '4px', fontWeight: '500' }}>GRUPO</span>
                        <span style={{ padding: '2px 8px', background: '#f3f4f6', color: '#374151', borderRadius: '4px' }}>ITEM</span>
                    </div>

                    {/* Divider */}
                    <div style={{ borderLeft: '2px solid #e2e8f0', height: '24px' }}></div>

                    {/* Status Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: '#475569' }}>📊 Status:</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#9ca3af' }}>⠿</span> Arraste</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🚫 Suprimido</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>➕ Adicionado</span>
                        <span style={{ color: '#16a34a', fontWeight: '500' }}>▲ Acréscimo</span>
                        <span style={{ color: '#dc2626', fontWeight: '500' }}>▼ Supressão</span>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddendumModal && (
                <div onClick={() => setShowAddendumModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', minWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>+ Novo Aditivo</h3>
                        <form onSubmit={handleCreateAddendum}>
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Data</label><input type="date" required value={addendumDate} onChange={e => setAddendumDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição</label><textarea required value={addendumDescription} onChange={e => setAddendumDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }} /></div>
                            <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={() => setShowAddendumModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button><button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Criar</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showOperationModal && selectedItem && selectedAddendum && (
                <div onClick={() => setShowOperationModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', minWidth: '450px' }}>
                        <h3 style={{ marginTop: 0 }}>Alterar - Aditivo {selectedAddendum.number}</h3>
                        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}><strong>{selectedItem.code}</strong> - {selectedItem.description?.substring(0, 50)}</div>
                        <form onSubmit={handleAddOperation}>
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo</label><select value={operationType} onChange={e => setOperationType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}><option value="MODIFY_QTY">Modificar Quantidade</option><option value="MODIFY_PRICE">Modificar Preço</option><option value="MODIFY_BOTH">Modificar Ambos</option><option value="SUPPRESS">Suprimir</option></select></div>
                            {(operationType === 'MODIFY_QTY' || operationType === 'MODIFY_BOTH') && <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nova Quantidade</label><input type="number" step="0.001" required value={newQuantity} onChange={e => setNewQuantity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>}
                            {(operationType === 'MODIFY_PRICE' || operationType === 'MODIFY_BOTH') && <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Novo Preço</label><input type="number" step="0.01" required value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>}
                            {operationType === 'SUPPRESS' && <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', marginBottom: '15px', color: '#991b1b' }}>⚠️ Item será suprimido</div>}
                            <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={() => setShowOperationModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button><button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Aplicar</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showItemModal && (
                <div onClick={() => setShowItemModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', minWidth: '450px' }}>
                        <h3 style={{ marginTop: 0 }}>{editingItemId ? 'Editar Item' : 'Novo Item'}</h3>
                        <form onSubmit={handleSaveItem}>
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo</label><select value={itemType} onChange={e => setItemType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código</label><input value={itemCode} onChange={e => setItemCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição</label><input required value={itemDescription} onChange={e => setItemDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                            {itemType === 'ITEM' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unidade</label><input value={itemUnit} onChange={e => setItemUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantidade</label><input value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Preço Unit.</label><input value={itemPrice} onChange={e => setItemPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                                </div>
                            )}
                            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pai</label><select value={itemParentId || ''} onChange={e => setItemParentId(e.target.value || null)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}><option value="">(Raiz)</option>{flatRawItems.filter(i => i.type !== 'ITEM' && i.id !== editingItemId).map(i => <option key={i.id} value={i.id}>{i.code} - {i.description?.substring(0, 30)}</option>)}</select></div>
                            <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={() => setShowItemModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button><button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
