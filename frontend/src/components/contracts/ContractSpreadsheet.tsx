import React, { useState, useEffect, useCallback, useRef } from 'react';



import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';



import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';



import { CSS } from '@dnd-kit/utilities';



import { ChevronDown, ChevronRight, Info, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { AttachmentList } from '../common/AttachmentList';



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



function SortableRow({ id, children, isContainer, isSuppressed, isAddedByAddendum, idx, onDoubleClick }: any) {



    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });







    // Row background logic



    let bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-white/80';



    if (isContainer) bgClass = 'bg-white/80/80';



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
            onDoubleClick={onDoubleClick}



            className={`${bgClass} border-b border-gray-300 hover:bg-amber-50/60 transition-colors`}



        >



            <td



                {...listeners}



                className="p-1 text-center cursor-grab text-gray-500 hover:text-gray-900 border-l border-r border-gray-300"



                style={{ width: '30px' }}



            >
                ::
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
    const [addendumModalPos, setAddendumModalPos] = useState({ x: 0, y: 0 });
    const [isDraggingAddendum, setIsDraggingAddendum] = useState(false);
    const addendumDragOffset = useRef({ x: 0, y: 0 });
    const addendumWasDragged = useRef(false);
    const addendumDragEndedAt = useRef(0);



    const [addendumDate, setAddendumDate] = useState(new Date().toISOString().split('T')[0]);



    const [addendumDescription, setAddendumDescription] = useState('');



    const [showOperationModal, setShowOperationModal] = useState(false);



    const [selectedAddendum, setSelectedAddendum] = useState<any>(null);



    const [selectedItem, setSelectedItem] = useState<any>(null);



    const [operationType, setOperationType] = useState<string>('MODIFY_QTY');



    const [newQuantity, setNewQuantity] = useState('');



    const [newPrice, setNewPrice] = useState('');
    const [showCriteriaModal, setShowCriteriaModal] = useState(false);
    const [criteriaItem, setCriteriaItem] = useState<any>(null);
    const [measurementCriteria, setMeasurementCriteria] = useState('');
    const [criteriaModalPos, setCriteriaModalPos] = useState({ x: 0, y: 0 });
    const [isDraggingCriteria, setIsDraggingCriteria] = useState(false);
    const criteriaDragOffset = useRef({ x: 0, y: 0 });
    const criteriaWasDragged = useRef(false);
    const criteriaDragEndedAt = useRef(0);
    const [measurementStatusMap, setMeasurementStatusMap] = useState<Record<string, { status: string; lastDate: string; count: number }>>({});



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



                if (item.type !== 'ITEM' && item.children.length > 0) {



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

            try {
                const statusRes = await api.get(`/contracts/${contractId}/measurement-item-status`);
                setMeasurementStatusMap(statusRes.data || {});
            } catch {
                setMeasurementStatusMap({});
            }



        } catch (error) { console.error(error); }



        finally { setLoading(false); }



    }, [contractId]);







    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (!isDraggingAddendum) return;

        const handleMove = (event: MouseEvent) => {
            setAddendumModalPos({
                x: event.clientX - addendumDragOffset.current.x,
                y: event.clientY - addendumDragOffset.current.y,
            });
        };

        const handleUp = () => {
            setIsDraggingAddendum(false);
            addendumDragEndedAt.current = Date.now();
            addendumWasDragged.current = false;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isDraggingAddendum]);

    useEffect(() => {
        if (!isDraggingCriteria) return;

        const handleMove = (event: MouseEvent) => {
            setCriteriaModalPos({
                x: event.clientX - criteriaDragOffset.current.x,
                y: event.clientY - criteriaDragOffset.current.y,
            });
        };

        const handleUp = () => {
            endCriteriaDrag();
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        };
    }, [isDraggingCriteria]);







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



        } catch (err: any) { alert(err.response.data.error || 'Erro'); }



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



        } catch (err: any) { alert(err.response.data.error || 'Erro'); }



    }







    async function handleApprove(id: string) {



        if (!confirm('Aprovar')) return;



        try { await api.post(`/contracts/addendums/${id}/approve`); loadData(); onContractUpdate(); }



        catch (err: any) { alert(err.response.data.error || 'Erro'); }



    }







    async function handleCancel(id: string, approved: boolean) {



        if (!confirm(approved ? 'Cancelar aditivo aprovado?' : 'Cancelar?')) return;



        try { await api.post(`/contracts/addendums/${id}/cancel`, { confirmCancellation: approved }); loadData(); onContractUpdate(); }



        catch (err: any) { alert(err.response.data.error || 'Erro'); }



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



        } catch (err: any) { alert(err.response.data.error || 'Erro'); }



    }







    async function handleDeleteItem(itemId: string) {



        if (!confirm('Excluir')) return;



        try { await api.delete(`/contracts/items/${itemId}`); loadData(); onContractUpdate(); }



        catch (err: any) { alert(err.response.data.error || 'Erro'); }



    }

    function openCriteriaModal(item: any) {
        setCriteriaItem(item);
        setMeasurementCriteria(item.measurementCriteria || '');
        setCriteriaModalPos({ x: 0, y: 0 });
        criteriaWasDragged.current = false;
        setIsDraggingCriteria(false);
        setShowCriteriaModal(true);
    }

    function endCriteriaDrag() {
        setIsDraggingCriteria(false);
        criteriaDragEndedAt.current = Date.now();
        criteriaWasDragged.current = false;
    }

    async function handleSaveCriteria(e: React.FormEvent) {
        e.preventDefault();
        if (!criteriaItem) return;

        try {
            await api.put(`/contracts/items/${criteriaItem.id}`, { measurementCriteria });
            setShowCriteriaModal(false);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar critério de medição');
        }
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

    const getMeasurementBadge = (itemId: string) => {
        const status = measurementStatusMap[itemId]?.status;
        if (status === 'APPROVED') return { label: 'Medição aprovada', className: 'bg-emerald-100 text-emerald-700' };
        if (status === 'CLOSED') return { label: 'Medição fechada', className: 'bg-blue-100 text-blue-700' };
        if (status === 'DRAFT') return { label: 'Medição em rascunho', className: 'bg-amber-100 text-amber-800' };
        return { label: 'Sem medição', className: 'bg-gray-200 text-gray-600' };
    };







    return (



        <div className="card border border- bg-white/70 overflow-hidden">



            {/* Toolbar */}



            <div className="p-4 bg-white/70 border-b border- flex flex-wrap justify-between items-center gap-4">



                <h3 className="text-lg font-semibold text-">Planilha do Contrato</h3>



                <div className="flex flex-wrap gap-2 items-center">



                    {/* Search Filter */}



                    <div className="relative">



                        <input



                            type="text"



                            value={searchFilter}



                            onChange={(e) => setSearchFilter(e.target.value)}



                            placeholder="Filtrar..."



                            className="input w-64"



                        />



                        {searchFilter && (



                            <button



                                onClick={() => setSearchFilter('')}



                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"



                            ><X size={14} /></button>



                        )}



                    </div>







                    {/* Expand/Collapse Buttons */}



                    <div className="flex bg-white/70 rounded-lg p-1 border border-">



                        <button



                            onClick={expandAll}



                            title="Expandir Todos"



                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"



                        ><ChevronDown size={16} /></button>



                        <button



                            onClick={() => collapseAllGroups(rawItems)}



                            title="Recolher Todos"



                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"



                        ><ChevronRight size={16} /></button>



                    </div>







                    <button onClick={() => openItemModal()} className="btn btn-sm btn-primary flex items-center gap-2">



                        <Plus size={16} /> Item



                    </button>



                    <button onClick={() => setShowAddendumModal(true)} className="btn btn-sm btn-secondary flex items-center gap-2">



                        <Plus size={16} /> Aditivo



                    </button>



                    <button onClick={loadData} className="btn btn-sm btn-secondary" title="Atualizar"><RefreshCw size={16} /></button>



                </div>



            </div>







            {/* Addendums Bar */}



            {activeAddendums.length > 0 && (



                <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/60 flex gap-4 overflow-x-auto">



                    {activeAddendums.map((add: any) => (



                        <div
                            key={add.id}
                            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium border ${
                                add.status === 'APPROVED'
                                    ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50/70 text-amber-700 border-amber-200'
                            }`}
                        >



                            <span className="font-bold">Aditivo {add.number}</span>



                            <span className="opacity-70">{new Date(add.date).toLocaleDateString('pt-BR')}</span>



                            <span className={`text-[11px] font-semibold ${add.status === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'}`}>



                                {add.status === 'APPROVED' ? 'Aprovado' : 'Rascunho'}



                            </span>



                            {add.status === 'DRAFT' && (



                                <>



                                    <button onClick={() => handleApprove(add.id)} className="ml-2 btn btn-xs btn-success">Aprovar</button>



                                    <button onClick={() => handleCancel(add.id, false)} className="ml-1 btn btn-xs btn-danger">



                                        <X size={14} />



                                    </button>



                                </>



                            )}



                        </div>



                    ))}



                </div>



            )}







            {/* Table */}



            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>



                <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">



                    <table className="w-full text-center border-collapse text-sm">



                    <thead className="sticky top-0 z-20">



                        <tr className="text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-300" style={{ backgroundColor: '#f6efe4' }}>



                            <th rowSpan={2} className="p-3 text-center w-10 text-gray-500 font-normal border-l border-gray-300 border-r border-gray-300">



                                <span className="opacity-50">::</span>



                            </th>



                            <th rowSpan={2} className="p-3 w-28 text-center text-xs font-bold uppercase tracking-wider text-gray-600 border-r border-gray-300">Tipo</th>



                            <th rowSpan={2} className="p-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600 border-r border-gray-300">Código</th>



                            <th rowSpan={2} className="p-3 text-center min-w-[280px] text-xs font-bold uppercase tracking-wider text-gray-600 border-r border-gray-300">Descrição</th>



                            <th rowSpan={2} className="p-3 w-16 text-center text-xs font-bold uppercase tracking-wider text-gray-600 border-r border-gray-300">UN</th>



                            <th rowSpan={2} className="p-3 w-28 text-center text-xs font-bold uppercase tracking-wider text-gray-600 border-r border-gray-300">R$ Unitário</th>



                            <th colSpan={2} className="p-3 text-center bg-[#f6efe4] border-l border-gray-300 border-r border-gray-300 text-blue-700">Bases Contratuais</th>



                            {activeAddendums.length > 0 && (



                                <th colSpan={activeAddendums.length * 2} className="p-3 text-center bg-amber-100/70 border-l border-gray-300 border-r border-gray-300 text-amber-700">Aditivos</th>



                            )}



                            <th colSpan={2} className="p-3 text-center bg-[#f6efe4] border-l border-gray-300 border-r border-gray-300 text-emerald-700">Ativo</th>



                            <th rowSpan={2} className="p-3 w-24 text-center text-xs font-bold uppercase tracking-wider text-gray-600 border-r border-gray-300">Ações</th>



                        </tr>



                        <tr className="text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-300" style={{ backgroundColor: '#f6efe4' }}>



                            <th className="px-3 py-2 text-center bg-[#f6efe4] border-l border-gray-300 border-r border-gray-300 text-blue-700">Qtd.</th>



                            <th className="px-3 py-2 text-center bg-[#f6efe4] border-l border-gray-300 border-r border-gray-300 text-blue-700">Valor</th>



                            {activeAddendums.map((add: any) => (



                                <React.Fragment key={`sub-${add.id}`}>



                                    <th className={`px-3 py-2 text-center border-l border-gray-300 border-r border-gray-300 ${add.status === 'APPROVED' ? 'bg-emerald-50/60' : 'bg-amber-50/60'}`}>Qtd.</th>



                                    <th className={`px-3 py-2 text-center border-l border-gray-300 border-r border-gray-300 ${add.status === 'APPROVED' ? 'bg-emerald-50/60' : 'bg-amber-50/60'}`}>Valor</th>



                                </React.Fragment>



                            ))}



                            <th className="px-3 py-2 text-center bg-[#f6efe4] border-l border-gray-300 border-r border-gray-300 text-emerald-700">Qtd.</th>



                            <th className="px-3 py-2 text-center bg-[#f6efe4] border-l border-gray-300 border-r border-gray-300 text-emerald-700">Valor</th>



                        </tr>



                    </thead>



                        <SortableContext items={flatItems.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>



                            <tbody className="divide-y divide-dark-700">



                                {flatItems.filter((item: any) => {



                                    if (!searchFilter.trim()) return true;



                                    const search = searchFilter.toLowerCase();



                                    const matchesCode = item.code.toLowerCase().includes(search);



                                    const matchesDescription = item.description.toLowerCase().includes(search);



                                    return matchesCode || matchesDescription;



                                }).map((item: any, idx: number) => {



                                    const isContainer = item.type !== 'ITEM';



                                    const baseQty = Number(item.quantity) || 0;



                                    const basePrice = Number(item.unitPrice) || 0;



                                    const baseValue = baseQty * basePrice;







                                    // Row Styling



                                    let textColor = 'text-gray-700';



                                    if (isContainer) textColor = 'text-slate-700 font-semibold';



                                    if (item.isSuppressed) textColor = 'text-red-600 line-through';



                                    if (item.isAddedByAddendum) textColor = 'text-emerald-700';







                                    const getAddendumDelta = (addendumId: string) => {



                                        const h = item.history.find((x: any) => x.addendumId === addendumId);



                                        if (!h) return { qty: null, value: null };



                                        const hi = item.history.findIndex((x: any) => x.addendumId === addendumId);



                                        const prev = hi > 0 ? item.history[hi - 1] : null;



                                        return {
                                            qty: h.quantity - (prev ? prev.quantity : baseQty),
                                            value: h.totalValue - (prev ? prev.totalValue : baseValue),
                                        };



                                    };







                                    return (



                                        <SortableRow



                                            key={item.id}



                                            id={item.id}



                                            isContainer={isContainer}



                                            isSuppressed={item.isSuppressed}



                                            isAddedByAddendum={item.isAddedByAddendum}



                                            idx={idx}
                                            onDoubleClick={() => item.type === 'ITEM' && openCriteriaModal(item)}



                                        >



                                            <td className="p-2 border-r border-gray-300 text-center">



                                                <span
                                                    className={`inline-block whitespace-nowrap text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                        item.type === 'STAGE'
                                                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                                            : item.type === 'SUBSTAGE'
                                                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                                : item.type === 'LEVEL'
                                                                    ? 'bg-violet-100 text-violet-700 border border-violet-200'
                                                                    : 'bg-gray-200 text-gray-600'
                                                    }`}
                                                >



                                                    {typeLabels[item.type] || item.type}



                                                </span>



                                            </td>



                                            <td className={`p-2 border-r border-gray-300 whitespace-nowrap text-center relative ${textColor} sticky left-10 bg-inherit z-10`}>



                                                {isContainer && item.hasChildren && (



                                                    <button



                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCollapse(item.id); }}



                                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 focus:outline-none"



                                                    >



                                                        {item.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}



                                                    </button>



                                                )}



                                                <span className="block text-center">{item.code || '-'}</span>



                                                {item.isSuppressed && <span className="ml-1 text-red-500" title="Suprimido">x</span>}



                                                {item.isAddedByAddendum && <span className="ml-1 text-green-500" title="Adicionado">+</span>}



                                            </td>



                                            <td className={`p-2 border-r border-gray-300 max-w-xs text-left ${textColor}`} title={item.description}>
                                                <div className="flex flex-col">
                                                    <span className="truncate">{item.description}</span>
                                                    {item.type === 'ITEM' && (
                                                        <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                                                            {!item.measurementCriteria?.trim() && (
                                                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                                                    Sem critério
                                                                </span>
                                                            )}
                                                            {item.measurementCriteria?.trim() && (() => {
                                                                const badge = getMeasurementBadge(item.id);
                                                                return (
                                                                    <span className={`px-2 py-0.5 rounded ${badge.className}`}>
                                                                        {badge.label}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {(() => {
                                                                const missing: string[] = [];
                                                                if (!item.unit) missing.push('unidade');
                                                                if (!(Number(item.quantity) > 0)) missing.push('quantidade');
                                                                if (!(Number(item.unitPrice) > 0)) missing.push('preço');
                                                                if (!item.measurementCriteria?.trim()) missing.push('critério');
                                                                if (!missing.length) return null;
                                                                return (
                                                                    <span
                                                                        className="px-2 py-0.5 rounded bg-red-100 text-red-700"
                                                                        title={`Campos pendentes: ${missing.join(', ')}`}
                                                                    >
                                                                        Campos pendentes
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>



                                            <td className="p-2 text-center border-r border-gray-300 text-gray-600">{isContainer ? '' : item.unit}</td>



                                            <td className="p-2 text-center border-r border-gray-300 text-gray-600 font-mono">{isContainer ? '' : formatCurrency(basePrice)}</td>







                                            {/* Base Data */}



                                            <td className="p-2 text-center text-gray-700 border-l border-gray-300 border-r border-gray-300 font-mono">



                                                {isContainer ? '' : item.isAddedByAddendum ? '-' : formatNumber(baseQty)}



                                            </td>



                                            <td className="p-2 text-center text-gray-700 border-r border-gray-300 font-mono">



                                                {isContainer ? formatCurrency(item._subtotalValue || 0) : item.isAddedByAddendum ? '-' : formatCurrency(baseValue)}



                                            </td>







                                            {/* Addendums */}



                                            {activeAddendums.map((add: any) => {



                                                const d = getAddendumDelta(add.id);



                                                const canEdit = add.status === 'DRAFT' && !isContainer;



                                                const cellBg = add.status === 'APPROVED' ? 'bg-emerald-50/60' : 'bg-amber-50/60';







                                                return (



                                                    <React.Fragment key={`d-${add.id}`}>



                                                        <td



                                                            onClick={() => canEdit && openOperationModal(item, add)}



                                                            className={`p-2 text-center cursor-${canEdit ? 'pointer hover:bg-black/5' : 'default'} ${cellBg} font-mono`}



                                                        >



                                                            {isContainer ? '' : d.qty !== null ? (



                                                                <span className={d.qty > 0 ? 'text-emerald-700' : d.qty < 0 ? 'text-red-600' : 'text-gray-500'}>



                                                                    {d.qty > 0 ? '+' : ''}{formatNumber(d.qty)}



                                                                </span>



                                                            ) : (canEdit ? <span className="text-dark-600"><Plus size={14} /></span> : '-')}



                                                        </td>



                                                        <td



                                                            onClick={() => canEdit && openOperationModal(item, add)}



                                                            className={`p-2 text-center border-r border-gray-300 cursor-${canEdit ? 'pointer hover:bg-black/5' : 'default'} ${cellBg} font-mono`}



                                                        >



                                                            {d.value !== null ? (



                                                                <span className={d.value > 0 ? 'text-emerald-700' : d.value < 0 ? 'text-red-600' : 'text-gray-500'}>



                                                                    {d.value > 0 ? '+' : ''}{formatCurrency(d.value)}



                                                                </span>



                                                            ) : '-'}



                                                        </td>



                                                    </React.Fragment>



                                                );



                                            })}







                                            {/* Vigente Data */}



                                            <td className="p-2 text-center text-gray-800 font-bold border-l border-gray-300 border-r border-gray-300 font-mono">



                                                {isContainer ? '' : item.isSuppressed ? <span className="text-red-600">0</span> : formatNumber(item.vigentQuantity || baseQty)}



                                            </td>



                                            <td className="p-2 text-center text-gray-700 font-bold font-mono border-r border-gray-300">



                                                {isContainer ? formatCurrency(item._subtotalValue || 0) : item.isSuppressed ? <span className="text-red-600">R$ 0,00</span> : formatCurrency(item.vigentTotalValue || baseValue)}



                                            </td>







                                            <td className="p-2 text-center text-xs">



                                                <div className="flex justify-center gap-1">



                                                    {isContainer && (



                                                    <button



                                                        onClick={() => openItemModal(undefined, item.id)}



                                                        className="btn btn-xs btn-success"



                                                        title="Adicionar item"



                                                    >



                                                        <Plus size={14} />



                                                    </button>



                                                    )}



                                                    <button



                                                        onClick={() => openItemModal(item)}



                                                        className="btn btn-xs btn-secondary"



                                                        title="Editar item"



                                                    >



                                                        <Pencil size={14} />



                                                    </button>



                                                    <button



                                                        onClick={() => handleDeleteItem(item.id)}



                                                        className="btn btn-xs btn-danger"



                                                        title="Excluir item"



                                                    >



                                                        <Trash2 size={14} />



                                                    </button>



                                                </div>



                                            </td>



                                        </SortableRow>



                                    );



                                })}



                            </tbody>



                        </SortableContext>



                    <tfoot>



                        <tr className="bg-white/80 border-t border-b border-gray-400 font-bold text-gray-800">



                            <td></td>



                            <td colSpan={5} className="p-3 text-right text-gray-600 pr-6">Totais gerais:</td>



                            <td className="p-3 text-center font-mono"></td>



                            <td className="p-3 text-center text-gray-700 font-mono">



                                {formatCurrency(flatItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0))}



                            </td>



                            {activeAddendums.map((add: any) => (



                                <React.Fragment key={`tot-${add.id}`}>



                                    <td className="p-3 text-center bg-amber-50/40 font-mono"></td>



                                    <td className={`p-3 text-center bg-amber-50/40 font-mono ${Number(add.netValue) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>



                                        {Number(add.netValue) > 0 ? '+' : ''}{formatCurrency(Number(add.netValue) || 0)}



                                    </td>



                                </React.Fragment>



                            ))}



                            <td className="p-3 text-center font-mono"></td>



                            <td className="p-3 text-center text-gray-700 text-base font-mono">



                                {formatCurrency(flatItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((s: number, i: any) => s + (Number(i.vigentTotalValue) || ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0))), 0))}



                            </td>



                            <td></td>



                        </tr>



                    </tfoot>



                    </table>



                </div>



            </DndContext>







            {/* Legend */}



            <div className="p-4 bg-white/70 border-t border-gray-200 text-sm text-gray-600">



                <div className="font-bold mb-2 flex items-center gap-2">



                    <Info size={16} /> Legenda



                </div>



                <div className="flex flex-wrap gap-4">



                    <div className="flex items-center gap-2">



                        <span className="font-semibold text-gray-500">Categorias:</span>



                        <span className="px-2 py-0.5 bg-sky-100 text-sky-700 border border-sky-200 rounded text-xs font-bold">ETAPA</span>



                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">SUB-ETAPA</span>



                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-bold">NÍVEL</span>
                        <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 rounded text-xs font-bold">SUB-NÍVEL</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">GRUPO</span>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-xs font-bold">SUB-GRUPO</span>



                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">ITEM</span>



                    </div>



                    <div className="w-px h-4 bg-gray-300"></div>



                    <div className="flex items-center gap-3">



                        <span className="font-semibold text-gray-500">Status:</span>



                        <span className="flex items-center gap-1"><span className="text-red-500">x</span> Suprimido</span>



                        <span className="flex items-center gap-1"><span className="text-green-500">+</span> Adicionado</span>



                        <span className="text-emerald-700">+ Acréscimo</span>



                        <span className="text-red-600">- Supressão</span>



                    </div>



                </div>



            </div>







            {/* Modals - Using generic styles for consistency */}



            {showAddendumModal && (



                <div
                    className="modal-overlay"
                    onClick={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (addendumWasDragged.current) return;
                        if (Date.now() - addendumDragEndedAt.current < 300) return;
                        setShowAddendumModal(false);
                    }}
                    style={{ background: 'rgba(20, 18, 14, 0.2)' }}
                >



                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onMouseUp={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}
                        onPointerUp={e => e.stopPropagation()}
                        style={{
                            transform: `translate(${addendumModalPos.x}px, ${addendumModalPos.y}px)`,
                            boxShadow: 'none',
                        }}
                    >



                        <div
                            className="p-4 border-b border-gray-300 flex justify-between items-center cursor-move select-none"
                            onMouseDown={(event) => {
                                event.preventDefault();
                                setIsDraggingAddendum(true);
                                addendumWasDragged.current = true;
                                addendumDragOffset.current = {
                                    x: event.clientX - addendumModalPos.x,
                                    y: event.clientY - addendumModalPos.y,
                                };
                            }}
                        >



                            <h3 className="font-bold text-gray-900">Novo Aditivo</h3>



                            <button onClick={() => setShowAddendumModal(false)} className="text-gray-600 hover:text-gray-900" aria-label="Fechar">
                                <X size={16} />
                            </button>



                        </div>



                        <form onSubmit={handleCreateAddendum} className="p-4">



                            <div className="mb-4">



                                <label className="label">Data</label>



                                <input type="date" required value={addendumDate} onChange={e => setAddendumDate(e.target.value)} className="input" />



                            </div>



                            <div className="mb-4">



                                <label className="label">Descrição</label>



                                <textarea
                                    required
                                    value={addendumDescription}
                                    onChange={e => setAddendumDescription(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onMouseUp={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="input"
                                    rows={3}
                                    style={{ resize: 'both' }}
                                />



                            </div>



                            <div className="flex justify-end gap-2">



                                <button type="button" onClick={() => setShowAddendumModal(false)} className="btn btn-secondary">Cancelar</button>



                                <button type="submit" className="btn btn-primary">Criar</button>



                            </div>



                        </form>



                    </div>



                </div>



            )}








            {showCriteriaModal && criteriaItem && (
                <div
                    className="modal-overlay"
                    onClick={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (criteriaWasDragged.current) return;
                        if (Date.now() - criteriaDragEndedAt.current < 300) return;
                        setShowCriteriaModal(false);
                        setCriteriaItem(null);
                    }}
                    style={{ background: 'rgba(20, 18, 14, 0.2)' }}
                >
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onMouseUp={(e) => {
                            e.stopPropagation();
                            if (isDraggingCriteria) endCriteriaDrag();
                        }}
                        onPointerDown={e => e.stopPropagation()}
                        onPointerUp={(e) => {
                            e.stopPropagation();
                            if (isDraggingCriteria) endCriteriaDrag();
                        }}
                        style={{
                            transform: `translate(${criteriaModalPos.x}px, ${criteriaModalPos.y}px)`,
                            boxShadow: 'none',
                        }}
                    >
                        <div
                            className="p-4 border-b border-gray-300 flex justify-between items-center cursor-move select-none"
                            onMouseDown={(event) => {
                                event.preventDefault();
                                setIsDraggingCriteria(true);
                                criteriaWasDragged.current = true;
                                criteriaDragOffset.current = {
                                    x: event.clientX - criteriaModalPos.x,
                                    y: event.clientY - criteriaModalPos.y,
                                };
                            }}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                setIsDraggingCriteria(true);
                                criteriaWasDragged.current = true;
                                criteriaDragOffset.current = {
                                    x: event.clientX - criteriaModalPos.x,
                                    y: event.clientY - criteriaModalPos.y,
                                };
                            }}
                            onMouseUp={endCriteriaDrag}
                            onMouseLeave={() => {
                                if (isDraggingCriteria) endCriteriaDrag();
                            }}
                            onPointerUp={endCriteriaDrag}
                        >
                            <div>
                                <h3 className="font-bold text-gray-900">Critério de medição</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {criteriaItem.code || '-'} · {criteriaItem.description || 'Sem descrição'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCriteriaModal(false);
                                    setCriteriaItem(null);
                                }}
                                className="text-gray-600 hover:text-gray-900"
                                aria-label="Fechar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCriteria} className="p-4">
                            <div className="mb-4">
                                <label className="label">Descrição</label>
                                <textarea
                                    value={measurementCriteria}
                                    onChange={e => setMeasurementCriteria(e.target.value)}
                                    onMouseDown={e => e.stopPropagation()}
                                    onMouseUp={e => e.stopPropagation()}
                                    onClick={e => e.stopPropagation()}
                                    onPointerDown={e => e.stopPropagation()}
                                    className="input"
                                    rows={4}
                                    style={{ resize: 'both' }}
                                />
                            </div>
                            <div className="mb-4 border-t border-gray-200 pt-4">
                                <AttachmentList
                                    targetType="measurement-criteria"
                                    targetId={criteriaItem.id}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCriteriaModal(false);
                                        setCriteriaItem(null);
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
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



                            <div className="bg-white/80 p-3 rounded mb-4 text-sm border border-gray-400">



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



                                        Atenção: este item será removido do contrato vigente.



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



                                    <input value={itemCode} onChange={e => setItemCode(e.target.value)} className="input" placeholder="Ex: m²" />



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



                                        <option key={i.id} value={i.id}>{i.code} - {i.description.substring(0, 40)}...</option>



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



