
import React, { useState, useEffect } from 'react';
import { DraggableModal } from '../common/DraggableModal';
import api from '../../services/api';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ColumnDef {
    id: string;
    label: string;
    visible: boolean;
    unitLabel?: string;
    type?: 'column' | 'operator';
    operator?: '+' | '-' | '*' | '/';
    isAuxiliary?: boolean;
    isLinked?: boolean;
    formulaData?: {
        formulaId: string;
        inputVars: Record<string, string>;
    };
}

interface Unit {
    id: string;
    code: string;
    description: string;
}

interface ManageUnitsModalProps {
    open: boolean;
    onClose: () => void;
    onUnitsChange?: (newUnitCode?: string) => void;
    columnConfig: ColumnDef[];
    setColumnConfig: (cols: ColumnDef[]) => void;
}

function SortableColumnItem({
    column,
    onToggle,
    onRename,
    onDelete
}: {
    column: ColumnDef;
    onToggle: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'grid',
        gridTemplateColumns: 'auto 30px 1fr 100px 60px', // Drag, Check, Label, Unit, Actions
        alignItems: 'center',
        padding: '8px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        marginBottom: '0',
    };

    const isProtected = ['stations', 'km', 'description'].includes(column.id) || column.id.startsWith('unit_');

    // Render operator differently
    if (column.type === 'operator') {
        return (
            <div ref={setNodeRef} style={{ ...style, gridTemplateColumns: 'auto 1fr 60px', background: '#fef3c7', border: '1px dashed #f59e0b' }}>
                <div {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '10px', color: '#f59e0b', display: 'flex', alignItems: 'center' }}>⋮⋮</div>
                <span style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#b45309' }}>
                    {column.operator === '+' && '➕ Adição'}
                    {column.operator === '-' && '➖ Subtração'}
                    {column.operator === '*' && '✖️ Multiplicação'}
                    {column.operator === '/' && '➗ Divisão'}
                </span>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => onDelete(column.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2em' }}
                        title="Remover"
                    >
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '10px', color: '#999', display: 'flex', alignItems: 'center', width: '20px', fontSize: '1.2em' }}>⋮⋮</div>
            <input
                type="checkbox"
                checked={column.visible}
                onChange={() => onToggle(column.id)}
                style={{ cursor: 'pointer' }}
            />
            <span style={{ paddingLeft: '10px' }}>{column.label}</span>
            <span style={{ paddingLeft: '10px', color: '#666' }}>{column.unitLabel || ''}</span>

            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                {!['description', 'stations', 'km', 'location'].includes(column.id) && (
                    <>
                        <button
                            onClick={() => {
                                const newName = prompt('Novo nome:', column.label);
                                if (newName && newName.trim()) {
                                    onRename(column.id, newName.trim());
                                }
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontSize: '1.2em' }}
                            title="Editar"
                        >
                            &#9998;
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Excluir esta coluna?')) {
                                    onDelete(column.id);
                                }
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2em' }}
                            title="Excluir"
                        >
                            &times;
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export const ManageUnitsModal: React.FC<ManageUnitsModalProps> = ({ open, onClose, onUnitsChange, columnConfig, setColumnConfig }) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUnitCode, setNewUnitCode] = useState('');
    const [newUnitDesc, setNewUnitDesc] = useState('');
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]); // IDs for deletion
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (open) {
            fetchUnits();
        }
    }, [open]);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const response = await api.get('/units');
            setUnits(response.data);
        } catch (err) {
            console.error('Failed to fetch units', err);
            setError('Erro ao carregar unidades');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUnit = () => {
        if (!newUnitDesc) {
            setError('Informe a descrição do campo');
            return;
        }

        // Generate unique ID for the new column
        const newId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Add new column to config
        const newColumn: ColumnDef = {
            id: newId,
            label: newUnitDesc,
            visible: true,
            unitLabel: newUnitCode || undefined
        };

        setColumnConfig([...columnConfig, newColumn]);
        setNewUnitCode('');
        setNewUnitDesc('');
        setError('');
    };

    const startEdit = (unit: Unit) => {
        setNewUnitCode(unit.code);
        setNewUnitDesc(unit.description);
        setEditingUnitId(unit.id);
    };

    const cancelEdit = () => {
        setNewUnitCode('');
        setNewUnitDesc('');
        setEditingUnitId(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta unidade?')) return;
        try {
            await api.delete(`/units/${id}`);
            fetchUnits();
            if (onUnitsChange) onUnitsChange();
        } catch (err) {
            console.error('Failed to delete unit', err);
            setError('Erro ao excluir unidade');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUnits.length === 0) return;
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedUnits.length} unidades?`)) return;

        try {
            await Promise.all(selectedUnits.map(id => api.delete(`/units/${id}`)));
            setSelectedUnits([]);
            fetchUnits();
            if (onUnitsChange) onUnitsChange();
        } catch (err) {
            console.error('Failed to delete units', err);
            setError('Erro ao excluir unidades');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedUnits(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    return (
        <DraggableModal
            isOpen={open}
            onClose={onClose}
            title="Campos disponíveis"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Settings Section (Sortable) */}
                <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9em', color: '#0369a1' }}>Campos disponíveis</h4>
                        <button
                            onClick={() => {
                                if (confirm('Restaurar colunas padrão?')) {
                                    setColumnConfig([
                                        { id: 'unit', label: 'Unidade', visible: true },
                                        { id: 'description', label: 'Descrição', visible: true },
                                        { id: 'stations', label: 'Estacas', visible: false },
                                        { id: 'km', label: 'Quilômetro', visible: false },
                                        { id: 'quantity', label: 'Quantidade', visible: true },
                                        { id: 'width', label: 'Largura', visible: true, unitLabel: 'm' },
                                        { id: 'height', label: 'Altura', visible: true, unitLabel: 'm' },
                                    ]);
                                }
                            }}
                            style={{
                                fontSize: '0.8em',
                                color: '#0369a1',
                                background: 'none',
                                border: '1px solid #bae6fd',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            Restaurar Padrão
                        </button>
                    </div>

                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 30px 1fr 100px 60px',
                        padding: '8px',
                        background: '#f1f5f9',
                        borderBottom: '1px solid #ddd',
                        fontWeight: 'bold',
                        fontSize: '0.9em',
                        color: '#475569'
                    }}>
                        <div></div>
                        <div></div>
                        <div>Descrição</div>
                        <div>Unidade</div>
                        <div></div>
                    </div>

                    <div style={{ border: '1px solid #eee', background: 'white', borderRadius: '4px' }}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => {
                                const { active, over } = event;
                                if (active.id !== over?.id) {
                                    const oldIndex = columnConfig.findIndex((item) => item.id === active.id);
                                    const newIndex = columnConfig.findIndex((item) => item.id === over?.id);
                                    setColumnConfig(arrayMove(columnConfig, oldIndex, newIndex));
                                }
                            }}
                        >
                            <SortableContext
                                items={columnConfig.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {columnConfig.map((col) => (
                                    <SortableColumnItem
                                        key={col.id}
                                        column={col}
                                        onRename={(id, newName) => {
                                            setColumnConfig(columnConfig.map(c => c.id === id ? { ...c, label: newName } : c));
                                        }}
                                        onDelete={(id) => {
                                            setColumnConfig(columnConfig.filter(c => c.id !== id));
                                        }}
                                        onToggle={(id) => {
                                            const newConfig = columnConfig.map(c =>
                                                c.id === id ? { ...c, visible: !c.visible } : c
                                            );
                                            // Handle mutual exclusivity
                                            if (id === 'stations' && !col.visible) {
                                                // If enabling stations, disable km
                                                const kmIdx = newConfig.findIndex(c => c.id === 'km');
                                                if (kmIdx !== -1) newConfig[kmIdx].visible = false;
                                            }
                                            if (id === 'km' && !col.visible) {
                                                // If enabling km, disable stations
                                                const stIdx = newConfig.findIndex(c => c.id === 'stations');
                                                if (stIdx !== -1) newConfig[stIdx].visible = false;
                                            }
                                            setColumnConfig(newConfig);
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Add New Field Form */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ display: 'block', fontSize: '0.8em', marginBottom: '4px', color: '#475569' }}>Descrição do Campo</label>
                            <input
                                type="text"
                                value={newUnitDesc}
                                onChange={(e) => setNewUnitDesc(e.target.value)}
                                placeholder="Ex: Comprimento"
                                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.8em', marginBottom: '4px', color: '#475569' }}>Unidade</label>
                            <input
                                type="text"
                                value={newUnitCode}
                                onChange={(e) => setNewUnitCode(e.target.value)}
                                placeholder="Ex: m"
                                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <button
                            onClick={handleSaveUnit}
                            disabled={!newUnitCode}
                            style={{
                                padding: '8px 16px',
                                background: !newUnitCode ? '#ccc' : '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: newUnitCode ? 'pointer' : 'not-allowed',
                                height: '35px'
                            }}
                        >
                            + Adicionar
                        </button>
                    </div>
                    {error && <div style={{ color: 'red', marginTop: '10px', fontSize: '0.85em' }}>{error}</div>}
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={onClose} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button>
            </div>
        </DraggableModal >
    );
};
