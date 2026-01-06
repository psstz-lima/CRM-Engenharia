
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
    };

    // Render operator differently
    if (column.type === 'operator') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="grid grid-cols-[auto_1fr_60px] items-center p-2 mb-1 bg-yellow-900/10 border border-dashed border-yellow-600/50 rounded"
            >
                <div {...attributes} {...listeners} className="cursor-grab mr-2 text-yellow-600 flex items-center">⋮⋮</div>
                <span className="font-bold text-yellow-500">
                    {column.operator === '+' && '➕ Adição'}
                    {column.operator === '-' && '➖ Subtração'}
                    {column.operator === '*' && '✖️ Multiplicação'}
                    {column.operator === '/' && '➗ Divisão'}
                </span>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => onDelete(column.id)}
                        className="text-red-400 hover:text-red-300 text-lg leading-none"
                        title="Remover"
                    >
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="grid grid-cols-[auto_30px_1fr_100px_60px] items-center p-2 bg-gray-50 border-b border-gray-300 hover:bg-gray-200 transition-colors"
        >
            <div {...attributes} {...listeners} className="cursor-grab mr-2 text-gray-500 flex items-center w-5 text-lg">⋮⋮</div>
            <input
                type="checkbox"
                checked={column.visible}
                onChange={() => onToggle(column.id)}
                className="cursor-pointer accent-primary-600 w-4 h-4 rounded border-gray-400 bg-gray-200"
            />
            <span className="pl-2.5 text-gray-700 text-sm truncate">{column.label}</span>
            <span className="pl-2.5 text-gray-500 text-xs">{column.unitLabel || ''}</span>

            <div className="flex gap-2 justify-end">
                {!['description', 'stations', 'km', 'location'].includes(column.id) && (
                    <>
                        <button
                            onClick={() => {
                                const newName = prompt('Novo nome:', column.label);
                                if (newName && newName.trim()) {
                                    onRename(column.id, newName.trim());
                                }
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Editar"
                        >
                            ✎
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Excluir esta coluna?')) {
                                    onDelete(column.id);
                                }
                            }}
                            className="text-red-500 hover:text-red-400 text-lg leading-none"
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

    return (
        <DraggableModal
            isOpen={open}
            onClose={onClose}
            title="Campos disponíveis"
            className="w-[800px]" // Make it wider
        >
            <div className="flex flex-col gap-5">

                {/* Settings Section (Sortable) */}
                <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-300">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="m-0 text-sm font-bold text-gray-100">Campos disponíveis</h4>
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
                            className="text-xs text-primary-400 hover:text-primary-300 border border-primary-500/30 hover:bg-primary-500/10 rounded px-2 py-1 transition-colors"
                        >
                            Restaurar Padrão
                        </button>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[auto_30px_1fr_100px_60px] p-2 bg-gray-200 text-gray-600 font-bold text-xs uppercase border-b border-gray-400 rounded-t">
                        <div></div>
                        <div></div>
                        <div>Descrição</div>
                        <div>Unidade</div>
                        <div></div>
                    </div>

                    <div className="border border-gray-300 bg-gray-100 rounded-b max-h-[400px] overflow-y-auto custom-scrollbar">
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
                                                const kmIdx = newConfig.findIndex(c => c.id === 'km');
                                                if (kmIdx !== -1) newConfig[kmIdx].visible = false;
                                            }
                                            if (id === 'km' && !col.visible) {
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
                    <div className="flex gap-3 items-end mt-4 p-3 bg-gray-200/30 rounded border border-gray-300">
                        <div className="flex-2">
                            <label className="label">Descrição do Campo</label>
                            <input
                                type="text"
                                value={newUnitDesc}
                                onChange={(e) => setNewUnitDesc(e.target.value)}
                                placeholder="Ex: Comprimento"
                                className="input"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="label">Unidade</label>
                            <input
                                type="text"
                                value={newUnitCode}
                                onChange={(e) => setNewUnitCode(e.target.value)}
                                placeholder="Ex: m"
                                className="input"
                            />
                        </div>
                        <button
                            onClick={handleSaveUnit}
                            disabled={!newUnitCode}
                            className={`btn ${!newUnitCode ? 'bg-gray-600 cursor-not-allowed' : 'btn-primary'} h-[38px]`}
                        >
                            + Adicionar
                        </button>
                    </div>
                    {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
                </div>
            </div>

            <div className="mt-5 text-right border-t border-gray-300 pt-3">
                <button onClick={onClose} className="btn btn-secondary">
                    Fechar
                </button>
            </div>
        </DraggableModal >
    );
};
