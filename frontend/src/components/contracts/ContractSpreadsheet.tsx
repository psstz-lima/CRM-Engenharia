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
function SortableRow({ id, children, isContainer, isSuppressed, isAddedByAddendum, idx }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    // Row background logic
    let bgClass = idx % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50';
    if (isContainer) bgClass = 'bg-gray-50/80';
    if (isDragging) bgClass = 'bg-primary-900/50 opacity-50';

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`${bgClass} border-b border-gray-300 hover:bg-gray-200 transition-colors`}
        >
            <td
                {...listeners}
                className="p-1 text-center cursor-grab text-gray-500 hover:text-gray-900"
                style={{ width: '30px' }}
            >
                ⠿
            </td>
            {children}
        </tr>
    );
}

export function ContractSpreadsheet({ contractId, onContractUpdate }: ContractSpreadsheetProps) {
    const [treeItems, setTreeItems] = useState<any[]>([]); // Store tree structure
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
                // Rebuild hierarchy and calculate subtotals, store as tree
                const tree = rebuildHierarchy(vigentRes.data.items || []);
                const withSubtotals = calculateSubtotals(tree);
                setTreeItems(withSubtotals);
            } catch {
                // Fallback to raw items with subtotals
                const withSubtotals = calculateSubtotals(rawTreeItems);
                setTreeItems(withSubtotals);
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }, [contractId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Flatten items dynamically based on collapsedGroups state
    const flatItems = React.useMemo(() => flattenItems(treeItems), [treeItems, collapsedGroups]);
    const flatRawItems = flattenItems(rawItems);

    // Drag and drop
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));


    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = flatItems.findIndex((i: any) => i.id === active.id);
        const newIndex = flatItems.findIndex((i: any) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
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

    if (loading) return <div className="p-10 text-center text-gray-600">Carregando planilha...</div>;

    const activeAddendums = addendums.filter((a: any) => a.status !== 'CANCELLED');

    return (
        <div className="card border border-gray-300 bg-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 bg-gray-50 border-b border-gray-300 flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📊</span> Planilha do Contrato
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Search Filter */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="🔍 Filtrar..."
                            className="bg-gray-100 border border-gray-400 text-gray-800 text-sm rounded-lg pl-3 pr-8 py-2 w-64 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        />
                        {searchFilter && (
                            <button
                                onClick={() => setSearchFilter('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Expand/Collapse Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-400">
                        <button
                            onClick={expandAll}
                            title="Expandir Todos"
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        >
                            ➕
                        </button>
                        <button
                            onClick={() => collapseAllGroups(rawItems)}
                            title="Recolher Todos"
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        >
                            ➖
                        </button>
                    </div>

                    <button onClick={() => openItemModal()} className="btn btn-sm btn-primary flex items-center gap-1">
                        <span>+</span> Item
                    </button>
                    <button onClick={() => setShowAddendumModal(true)} className="btn btn-sm bg-purple-600 hover:bg-purple-500 text-gray-900 flex items-center gap-1">
                        <span>+</span> Aditivo
                    </button>
                    <button onClick={loadData} className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg border border-gray-400 transition-colors" title="Atualizar">
                        🔄
                    </button>
                </div>
            </div>

            {/* Addendums Bar */}
            {activeAddendums.length > 0 && (
                <div className="px-4 py-2 bg-yellow-900/10 border-b border-yellow-500/20 flex gap-4 overflow-x-auto">
                    {activeAddendums.map((add: any) => (
                        <div key={add.id} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium border ${add.status === 'APPROVED'
                            ? 'bg-green-900/20 text-green-400 border-green-500/20'
                            : 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20'
                            }`}>
                            <span className="font-bold">Aditivo {add.number}</span>
                            <span className="opacity-70">{new Date(add.date).toLocaleDateString('pt-BR')}</span>
                            <span>{add.status === 'APPROVED' ? '✅' : '📝'}</span>
                            {add.status === 'DRAFT' && (
                                <>
                                    <button onClick={() => handleApprove(add.id)} className="ml-2 px-2 py-0.5 bg-green-600 text-gray-900 rounded hover:bg-green-500">Aprovar</button>
                                    <button onClick={() => handleCancel(add.id, false)} className="ml-1 px-2 py-0.5 bg-red-600 text-gray-900 rounded hover:bg-red-500">✕</button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 z-20" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        {/* Main Header Row */}
                        <tr style={{ background: 'linear-gradient(180deg, #1a1a24 0%, #12121a 100%)' }} className="border-b border-gray-400">
                            <th className="p-3 text-center w-10 text-gray-500 font-normal">
                                <span className="opacity-50">⋮⋮</span>
                            </th>
                            <th className="p-3 w-20 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
                                Tipo
                            </th>
                            <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                                Código
                            </th>
                            <th className="p-3 text-left min-w-[280px] text-xs font-bold uppercase tracking-wider text-gray-600">
                                Descrição
                            </th>
                            <th className="p-3 w-16 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
                                Un
                            </th>
                            <th className="p-3 w-28 text-right text-xs font-bold uppercase tracking-wider text-gray-600">
                                P. Unitário
                            </th>
                            {/* Base Section */}
                            <th colSpan={2} className="p-3 text-center bg-blue-950/40 border-l border-gray-400">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Base</span>
                                </div>
                            </th>
                            {/* Addendums */}
                            {activeAddendums.map((add: any) => (
                                <th key={add.id} colSpan={2} className={`p-3 text-center border-l border-gray-400 ${add.status === 'APPROVED'
                                    ? 'bg-emerald-950/40'
                                    : 'bg-amber-950/40'
                                    }`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${add.status === 'APPROVED' ? 'bg-emerald-400' : 'bg-amber-400'
                                            }`}></span>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${add.status === 'APPROVED' ? 'text-emerald-300' : 'text-amber-300'
                                            }`}>
                                            Aditivo {add.number}
                                        </span>
                                    </div>
                                </th>
                            ))}
                            {/* Vigente Section */}
                            <th colSpan={2} className="p-3 text-center bg-emerald-950/50 border-l border-gray-400">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Vigente</span>
                                </div>
                            </th>
                            <th className="p-3 w-24 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
                                Ações
                            </th>
                        </tr>
                        {/* Subheader Row */}
                        <tr className="text-[11px] text-gray-500 border-b border-gray-300" style={{ backgroundColor: '#0d0d12' }}>
                            <th colSpan={6} className="p-0"></th>
                            {/* Base subheaders */}
                            <th className="px-3 py-2 text-right bg-blue-950/20 border-l border-gray-300 font-medium uppercase">
                                QTD
                            </th>
                            <th className="px-3 py-2 text-right bg-blue-950/20 border-l border-gray-300 font-medium uppercase">
                                VALOR
                            </th>
                            {/* Addendums subheaders */}
                            {activeAddendums.map((add: any) => (
                                <React.Fragment key={`sub-${add.id}`}>
                                    <th className={`px-3 py-2 text-right border-l border-gray-300 font-medium uppercase ${add.status === 'APPROVED' ? 'bg-emerald-950/20' : 'bg-amber-950/20'
                                        }`}>
                                        Δ QTD
                                    </th>
                                    <th className={`px-3 py-2 text-right border-l border-gray-300 font-medium uppercase ${add.status === 'APPROVED' ? 'bg-emerald-950/20' : 'bg-amber-950/20'
                                        }`}>
                                        Δ VALOR
                                    </th>
                                </React.Fragment>
                            ))}
                            {/* Vigente subheaders */}
                            <th className="px-3 py-2 text-right bg-emerald-950/30 border-l border-gray-300 font-medium text-emerald-400 uppercase">
                                QTD
                            </th>
                            <th className="px-3 py-2 text-right bg-emerald-950/30 border-l border-gray-300 font-medium text-emerald-400 uppercase">
                                VALOR
                            </th>
                            <th className="p-0"></th>
                        </tr>
                    </thead>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={flatItems.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                            <tbody className="divide-y divide-dark-700">
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

                                    // Row Styling
                                    let textColor = 'text-gray-700';
                                    if (isContainer) textColor = 'text-blue-200 font-semibold';
                                    if (item.isSuppressed) textColor = 'text-red-400 line-through';
                                    if (item.isAddedByAddendum) textColor = 'text-green-300';

                                    const getAddendumDelta = (addendumId: string) => {
                                        const h = item.history?.find((x: any) => x.addendumId === addendumId);
                                        if (!h) return { qty: null, value: null };
                                        const hi = item.history?.findIndex((x: any) => x.addendumId === addendumId);
                                        const prev = hi > 0 ? item.history[hi - 1] : null;
                                        return { qty: h.quantity - (prev ? prev.quantity : baseQty), value: h.totalValue - (prev ? prev.totalValue : baseValue) };
                                    };

                                    return (
                                        <SortableRow
                                            key={item.id}
                                            id={item.id}
                                            isContainer={isContainer}
                                            isSuppressed={item.isSuppressed}
                                            isAddedByAddendum={item.isAddedByAddendum}
                                            idx={idx}
                                        >
                                            <td className="p-2 border-r border-gray-300 text-center">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isContainer ? 'bg-blue-900/30 text-blue-300' : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                    {typeLabels[item.type]?.substring(0, 4) || item.type}
                                                </span>
                                            </td>
                                            <td className={`p-2 border-r border-gray-300 whitespace-nowrap ${textColor}`}>
                                                {isContainer && item.hasChildren && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCollapse(item.id); }}
                                                        className="mr-2 text-gray-500 hover:text-gray-900 focus:outline-none"
                                                    >
                                                        {item.isCollapsed ? '▶' : '▼'}
                                                    </button>
                                                )}
                                                {item.code || '-'}
                                                {item.isSuppressed && <span className="ml-1 text-red-500" title="Suprimido">🚫</span>}
                                                {item.isAddedByAddendum && <span className="ml-1 text-green-500" title="Adicionado">➕</span>}
                                            </td>
                                            <td className={`p-2 border-r border-gray-300 max-w-xs truncate ${textColor}`} title={item.description}>
                                                {item.description}
                                            </td>
                                            <td className="p-2 text-center border-r border-gray-300 text-gray-600">{isContainer ? '' : item.unit}</td>
                                            <td className="p-2 text-right border-r border-gray-300 text-gray-600 font-mono">{isContainer ? '' : formatCurrency(basePrice)}</td>

                                            {/* Base Data */}
                                            <td className="p-2 text-right bg-blue-900/5 text-gray-700 border-l border-gray-300 font-mono">
                                                {isContainer ? '' : item.isAddedByAddendum ? '-' : formatNumber(baseQty)}
                                            </td>
                                            <td className="p-2 text-right bg-blue-900/5 text-blue-200 border-r border-gray-300 font-mono">
                                                {isContainer ? formatCurrency(item._subtotalValue || 0) : item.isAddedByAddendum ? '-' : formatCurrency(baseValue)}
                                            </td>

                                            {/* Addendums */}
                                            {activeAddendums.map((add: any) => {
                                                const d = getAddendumDelta(add.id);
                                                const canEdit = add.status === 'DRAFT' && !isContainer;
                                                const cellBg = add.status === 'APPROVED' ? 'bg-green-900/5' : 'bg-yellow-900/5';

                                                return (
                                                    <React.Fragment key={`d-${add.id}`}>
                                                        <td
                                                            onClick={() => canEdit && openOperationModal(item, add)}
                                                            className={`p-2 text-right cursor-${canEdit ? 'pointer hover:bg-white/5' : 'default'} ${cellBg} font-mono`}
                                                        >
                                                            {isContainer ? '' : d.qty !== null ? (
                                                                <span className={d.qty > 0 ? 'text-green-400' : d.qty < 0 ? 'text-red-400' : 'text-gray-500'}>
                                                                    {d.qty > 0 ? '+' : ''}{formatNumber(d.qty)}
                                                                </span>
                                                            ) : (canEdit ? <span className="text-dark-600">+</span> : '-')}
                                                        </td>
                                                        <td
                                                            onClick={() => canEdit && openOperationModal(item, add)}
                                                            className={`p-2 text-right border-r border-gray-300 cursor-${canEdit ? 'pointer hover:bg-white/5' : 'default'} ${cellBg} font-mono`}
                                                        >
                                                            {d.value !== null ? (
                                                                <span className={d.value > 0 ? 'text-green-400' : d.value < 0 ? 'text-red-400' : 'text-gray-500'}>
                                                                    {d.value > 0 ? '+' : ''}{formatCurrency(d.value)}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Vigente Data */}
                                            <td className="p-2 text-right bg-green-900/10 text-gray-100 font-bold border-l border-gray-300 font-mono">
                                                {isContainer ? '' : item.isSuppressed ? <span className="text-red-400">0</span> : formatNumber(item.vigentQuantity || baseQty)}
                                            </td>
                                            <td className="p-2 text-right bg-green-900/10 text-green-300 font-bold font-mono">
                                                {isContainer ? formatCurrency(item._subtotalValue || 0) : item.isSuppressed ? <span className="text-red-400">R$ 0,00</span> : formatCurrency(item.vigentTotalValue || baseValue)}
                                            </td>

                                            <td className="p-2 text-center text-xs">
                                                <div className="flex justify-end gap-1">
                                                    {isContainer && (
                                                        <button
                                                            onClick={() => openItemModal(undefined, item.id)}
                                                            className="p-1 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50"
                                                            title="Adicionar filho"
                                                        >
                                                            +
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openItemModal(item)}
                                                        className="p-1 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50"
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                                                        title="Excluir"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </SortableRow>
                                    );
                                })}
                            </tbody>
                        </SortableContext>
                    </DndContext>
                    <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-400 font-bold text-gray-800">
                            <td></td>
                            <td colSpan={5} className="p-3 text-right text-gray-600">📊 TOTAIS GERAIS:</td>
                            <td className="p-3 text-right bg-blue-900/10 border-l border-gray-400 font-mono">-</td>
                            <td className="p-3 text-right bg-blue-900/10 text-blue-300 border-r border-gray-400 font-mono">
                                {formatCurrency(flatItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0))}
                            </td>
                            {activeAddendums.map((add: any) => (
                                <React.Fragment key={`tot-${add.id}`}>
                                    <td className="p-3 text-right bg-black/20 font-mono">-</td>
                                    <td className={`p-3 text-right bg-black/20 border-r border-gray-400 font-mono ${Number(add.netValue) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {Number(add.netValue) > 0 ? '+' : ''}{formatCurrency(Number(add.netValue) || 0)}
                                    </td>
                                </React.Fragment>
                            ))}
                            <td className="p-3 text-right bg-green-900/20 border-l border-gray-400 font-mono">-</td>
                            <td className="p-3 text-right bg-green-900/20 text-green-300 text-base font-mono">
                                {formatCurrency(flatItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((s: number, i: any) => s + (Number(i.vigentTotalValue) || ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0))), 0))}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 border-t border-gray-300 text-sm text-gray-600">
                <div className="font-bold mb-2 flex items-center gap-2">
                    <span>ℹ️</span> Legenda
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-500">Categorias:</span>
                        <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs font-bold">ETAPA</span>
                        <span className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 rounded text-xs font-bold">SUB-ETAPA</span>
                        <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-xs font-bold">NÍVEL</span>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">ITEM</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-500">Status:</span>
                        <span className="flex items-center gap-1"><span className="text-red-500">🚫</span> Suprimido</span>
                        <span className="flex items-center gap-1"><span className="text-green-500">➕</span> Adicionado</span>
                        <span className="text-green-400">▲ Acréscimo</span>
                        <span className="text-red-400">▼ Supressão</span>
                    </div>
                </div>
            </div>

            {/* Modals - Using generic styles for consistency */}
            {showAddendumModal && (
                <div className="modal-overlay" onClick={() => setShowAddendumModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Novo Aditivo</h3>
                            <button onClick={() => setShowAddendumModal(false)} className="text-gray-600 hover:text-gray-900">✕</button>
                        </div>
                        <form onSubmit={handleCreateAddendum} className="p-4">
                            <div className="mb-4">
                                <label className="label">Data</label>
                                <input type="date" required value={addendumDate} onChange={e => setAddendumDate(e.target.value)} className="input" />
                            </div>
                            <div className="mb-4">
                                <label className="label">Descrição</label>
                                <textarea required value={addendumDescription} onChange={e => setAddendumDescription(e.target.value)} className="input" rows={3} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddendumModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showOperationModal && selectedItem && selectedAddendum && (
                <div className="modal-overlay" onClick={() => setShowOperationModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-300">
                            <h3 className="font-bold text-gray-900">Alterar Item no Aditivo {selectedAddendum.number}</h3>
                        </div>
                        <div className="p-4">
                            <div className="bg-gray-50 p-3 rounded mb-4 text-sm border border-gray-400">
                                <span className="font-bold text-primary-400">{selectedItem.code}</span>
                                <p className="text-gray-700 mt-1">{selectedItem.description}</p>
                            </div>
                            <form onSubmit={handleAddOperation}>
                                <div className="mb-4">
                                    <label className="label">Tipo de Alteração</label>
                                    <select value={operationType} onChange={e => setOperationType(e.target.value)} className="input">
                                        <option value="MODIFY_QTY">Modificar Quantidade</option>
                                        <option value="MODIFY_PRICE">Modificar Preço</option>
                                        <option value="MODIFY_BOTH">Modificar Ambos</option>
                                        <option value="SUPPRESS">Suprimir Item</option>
                                    </select>
                                </div>
                                {(operationType === 'MODIFY_QTY' || operationType === 'MODIFY_BOTH') && (
                                    <div className="mb-4">
                                        <label className="label">Nova Quantidade</label>
                                        <input type="number" step="0.001" required value={newQuantity} onChange={e => setNewQuantity(e.target.value)} className="input" />
                                    </div>
                                )}
                                {(operationType === 'MODIFY_PRICE' || operationType === 'MODIFY_BOTH') && (
                                    <div className="mb-4">
                                        <label className="label">Novo Preço Unitário</label>
                                        <input type="number" step="0.01" required value={newPrice} onChange={e => setNewPrice(e.target.value)} className="input" />
                                    </div>
                                )}
                                {operationType === 'SUPPRESS' && (
                                    <div className="p-3 bg-red-900/20 border border-red-500/20 text-red-300 rounded mb-4 text-sm font-bold text-center">
                                        ⚠️ Este item será removido do contrato vigente.
                                    </div>
                                )}
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowOperationModal(false)} className="btn btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Aplicar Alteração</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showItemModal && (
                <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-300">
                            <h3 className="font-bold text-gray-900">{editingItemId ? 'Editar Item' : 'Novo Item'}</h3>
                        </div>
                        <form onSubmit={handleSaveItem} className="p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="label">Tipo</label>
                                    <select value={itemType} onChange={e => setItemType(e.target.value)} className="input">
                                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Código</label>
                                    <input value={itemCode} onChange={e => setItemCode(e.target.value)} className="input" placeholder="Ex: 1.1" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="label">Descrição</label>
                                <input required value={itemDescription} onChange={e => setItemDescription(e.target.value)} className="input" />
                            </div>
                            {itemType === 'ITEM' && (
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="label">Unidade</label>
                                        <input value={itemUnit} onChange={e => setItemUnit(e.target.value)} className="input" placeholder="Ex: m²" />
                                    </div>
                                    <div>
                                        <label className="label">Quantidade</label>
                                        <input value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} className="input" type="number" step="0.001" />
                                    </div>
                                    <div>
                                        <label className="label">Preço Unit.</label>
                                        <input value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="input" type="number" step="0.01" />
                                    </div>
                                </div>
                            )}
                            <div className="mb-4">
                                <label className="label">Item Pai (Hierarquia)</label>
                                <select value={itemParentId || ''} onChange={e => setItemParentId(e.target.value || null)} className="input">
                                    <option value="">(Raiz - Sem pai)</option>
                                    {flatRawItems.filter(i => i.type !== 'ITEM' && i.id !== editingItemId).map(i => (
                                        <option key={i.id} value={i.id}>{i.code} - {i.description?.substring(0, 40)}...</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowItemModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
