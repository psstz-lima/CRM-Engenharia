
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { ManageUnitsModal, ColumnDef } from './ManageUnitsModal';
import { DraggableModal } from '../common/DraggableModal';
import { DistanceCalculatorModal } from './DistanceCalculatorModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';


function SortableFormItem({ id, children, style }: { id: string; children: React.ReactNode; style?: React.CSSProperties }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const combinedStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative' as 'relative',
        zIndex: isDragging ? 50 : 'auto',
        ...style
    };

    return (
        <div ref={setNodeRef} style={combinedStyle}>
            {/* Horizontal Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    cursor: 'grab',
                    fontSize: '12px',
                    color: '#cbd5e1',
                    zIndex: 10,
                    padding: '2px',
                    lineHeight: 1
                }}
                title="Arrastar para mover"
            >
                â‹®â‹®
            </div>
            {children}
        </div>
    );
}

export interface CalculationMemoryModalProps {
    show: boolean;
    onClose: () => void;
    measurementId: string;
    measurementNumber?: number;
    contractItemId: string;
    itemName: string;
    onUpdate: () => void; // Trigger reload of parent
    availableItems?: any[];
    balances?: Record<string, number>;
    currentValues?: Record<string, string>;
    measurementItems?: any[];
}

type FormulaDef = { id: string; name: string; variables: { key: string; label: string }[]; calculate: (v: Record<string, number>) => number; title: string };

const ENGINEERING_FORMULAS: Record<string, FormulaDef> = {
    'triangle': {
        id: 'triangle',
        name: 'ðŸ“ Ãrea do Triângulo',
        variables: [{ key: 'B', label: 'Base (B)' }, { key: 'h', label: 'Altura (h)' }],
        calculate: (v) => (v.B * v.h) / 2,
        title: "(B Ã— h) Ã· 2"
    },
    'trapezoid': {
        id: 'trapezoid',
        name: 'â¬¡ Ãrea do Trapézio',
        variables: [{ key: 'B', label: 'Base Maior (B)' }, { key: 'b', label: 'Base Menor (b)' }, { key: 'h', label: 'Altura (h)' }],
        calculate: (v) => ((v.B + v.b) * v.h) / 2,
        title: "(B + b) Ã— h Ã· 2"
    },
    'circle_perimeter': {
        id: 'circle_perimeter',
        name: 'â­• Perímetro do Círculo',
        variables: [{ key: 'r', label: 'Raio (r)' }],
        calculate: (v) => 2 * Math.PI * v.r,
        title: "2 Ã— Ï€ Ã— r"
    },
    'sphere_vol': {
        id: 'sphere_vol',
        name: 'ðŸ”µ Volume da Esfera',
        variables: [{ key: 'r', label: 'Raio (r)' }],
        calculate: (v) => (4 / 3) * Math.PI * Math.pow(v.r, 3),
        title: "(4/3) Ã— Ï€ Ã— rÂ³"
    },
    'cone_vol': {
        id: 'cone_vol',
        name: 'â–² Volume do Cone',
        variables: [{ key: 'r', label: 'Raio (r)' }, { key: 'h', label: 'Altura (h)' }],
        calculate: (v) => (1 / 3) * Math.PI * Math.pow(v.r, 2) * v.h,
        title: "(1/3) Ã— Ï€ Ã— rÂ² Ã— h"
    },
    'pyramid_vol': {
        id: 'pyramid_vol',
        name: 'ðŸ”º Volume da Pirâmide',
        variables: [{ key: 'A', label: 'Ãrea da Base (A)' }, { key: 'h', label: 'Altura (h)' }],
        calculate: (v) => (v.A * v.h) / 3,
        title: "(A Ã— h) Ã· 3"
    },
    'cylinder_vol': { // Adding Cylinder separately if it was missing or implied?
        // Converting the existing "Cilindro" button which was likely just 3.14 * r^2 * h?
        // Actually I don't see Cylinder in the code snippet I viewed earlier (lines 630-790).
        // It might be missing from my view or I missed it.
        // I'll stick to replacing the visible ones first.
        id: 'cylinder_vol',
        name: 'ðŸ›¢ï¸ Volume do Cilindro',
        variables: [{ key: 'r', label: 'Raio (r)' }, { key: 'h', label: 'Altura (h)' }],
        calculate: (v) => Math.PI * Math.pow(v.r, 2) * v.h,
        title: "Ï€ Ã— rÂ² Ã— h"
    }
};

export function CalculationMemoryModal({ show, onClose, measurementId, measurementNumber, contractItemId, itemName, onUpdate, availableItems = [], balances = {}, currentValues = {}, measurementItems = [] }: CalculationMemoryModalProps) {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [contractItemUnit, setContractItemUnit] = useState('');
    const [useExtension, setUseExtension] = useState(true);
    const [auxDescription, setAuxDescription] = useState(''); // Default true

    // Distance Calculator Modal
    const [showDistanceCalculator, setShowDistanceCalculator] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [unit, setUnit] = useState('m');
    const [operation, setOperation] = useState('+');

    // Inputs
    const [genericLength, setGenericLength] = useState('');
    const [startPoint, setStartPoint] = useState('');
    const [endPoint, setEndPoint] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');

    const [formula, setFormula] = useState<{ type: 'field' | 'operator', value: string, isLinked?: boolean }[]>([]);

    // Link Item Logic
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkItemId, setLinkItemId] = useState('');
    // New structure: { memoryId: string, props: string[] } - allows multiple props per memory
    const [linkSelections, setLinkSelections] = useState<{ id: string; props: string[] }[]>([]);
    const [importedFields, setImportedFields] = useState<Record<string, boolean>>({});
    // Universal Linked Items Table
    const [linkedVariables, setLinkedVariables] = useState<{
        id: string;
        label: string;
        value: number;
        itemName: string;
        sourceBM: string;
        property: string;
        unit?: string;
        line?: number;
    }[]>([]);

    // Toggle a specific property for a memory line
    const toggleLinkProp = (memId: string, prop: string) => {
        setLinkSelections(prev => {
            const existing = prev.find(s => s.id === memId);
            if (!existing) {
                // Add new entry with this prop
                return [...prev, { id: memId, props: [prop] }];
            }
            // Toggle prop in existing entry
            const hasP = existing.props.includes(prop);
            const newProps = hasP
                ? existing.props.filter(p => p !== prop)
                : [...existing.props, prop];
            if (newProps.length === 0) {
                // Remove entry if no props
                return prev.filter(s => s.id !== memId);
            }
            return prev.map(s => s.id === memId ? { ...s, props: newProps } : s);
        });
    };

    // Check if a specific property is selected for a memory
    const isLinkPropSelected = (memId: string, prop: string) => {
        const sel = linkSelections.find(s => s.id === memId);
        return sel?.props.includes(prop) || false;
    };

    // Helper to get configuration from a source item
    const getSourceConfig = (itemId: string): ColumnDef[] => {
        const item = measurementItems?.find((mi: any) => mi.contractItemId === itemId);
        // Default Config if none found
        const defaults: ColumnDef[] = [
            { id: 'km', label: 'Quilômetro', visible: false },
            { id: 'length', label: 'Comp.', visible: true },
            { id: 'width', label: 'Larg.', visible: true },
            { id: 'height', label: 'Espe.', visible: true },
            { id: 'quantity', label: 'Qtd.', visible: true },
            { id: 'description', label: 'Descrição', visible: true }
        ];

        if (!item?.metadata?.columnConfig) return defaults;

        // Return saved config, but ensure defaults are present if missing/legacy
        // Actually, we should trust the saved config for order and custom fields
        return item.metadata.columnConfig as ColumnDef[];
    };

    // Helper to extract value from memory based on column definition
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setColumnConfig((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    const getValueFromMemory = (mem: any, col: ColumnDef, config: ColumnDef[]) => {
        if (!mem) return 0;

        // Standard Mapping
        if (col.id === 'length') return Number(mem.length) || 0;
        if (col.id === 'width') return Number(mem.width) || 0;
        if (col.id === 'height') return Number(mem.height) || 0;
        if (col.id === 'quantity') return Number(mem.quantity) || 0;

        // Custom Fields
        if (col.id.startsWith('custom_')) {
            // 1. Try Metadata (robust)
            if (mem.metadata?.customValues?.[col.id] !== undefined) {
                return Number(mem.metadata.customValues[col.id]);
            }
            // 2. Fallback to width/height based on index (legacy compatibility)
            const customFields = config.filter(c => c.visible && c.id.startsWith('custom_'));
            const fieldIndex = customFields.findIndex(c => c.id === col.id);
            if (fieldIndex === 0) return Number(mem.width) || 0;
            if (fieldIndex === 1) return Number(mem.height) || 0;
            return 0;
        }

        // Unit columns (map to quantity if needed, or specific logic)
        if (col.id.startsWith('unit_')) {
            if (mem.unit === col.unitLabel) return Number(mem.quantity) || 0;
            return 0; // mismatch
        }

        return 0;
    };

    const handleConfirmLink = async () => {
        if (!linkItemId || linkSelections.length === 0) return;
        const item = availableItems?.find((i: any) => i.id === linkItemId);
        if (!item) return;

        const sourceMeasItem = measurementItems?.find((mi: any) => mi.contractItemId === linkItemId);
        const sourceMemories = sourceMeasItem?.memories || [];
        const sourceConfig = getSourceConfig(linkItemId);



        // Reset imports
        setImportedFields({});
        let newFormulaVars = { ...formulaVars };
        let newImportedFields: Record<string, boolean> = {};

        // Helper to normalize string for comparison
        const norm = (s: string) => s.toLowerCase().trim();

        for (const sel of linkSelections) {
            console.log('Processing selection:', sel);
            const mem = sourceMemories.find((m: any) => m.id === sel.id);
            if (!mem) continue;

            for (const prop of sel.props) {
                console.log('Processing prop:', prop);
                // Determine Value and Label from Source
                let value = 0;
                let sourceLabel = '';

                if (prop === 'km') {
                    value = Number(mem.length) || 0;
                    sourceLabel = 'Quilômetro';
                } else if (prop === 'total_quantity') {
                    value = Number(mem.quantity) || 0;
                    sourceLabel = `${item?.code || 'Item'} Total`; // e.g. "1.1.1 Total" or just "Total"
                } else if (prop === 'description') {
                    const currentDesc = description ? description + ' ' : '';
                    setDescription(currentDesc + (mem.description || ''));
                    newImportedFields['description'] = true;
                    continue;
                } else {
                    const colDef = sourceConfig.find(c => c.id === prop);
                    if (colDef) {
                        value = getValueFromMemory(mem, colDef, sourceConfig);
                        sourceLabel = colDef.label;
                    } else {
                        value = (mem[prop as keyof typeof mem] as number || 0);
                        if (prop === 'length') sourceLabel = 'Comprimento';
                        else if (prop === 'width') sourceLabel = 'Largura';
                        else if (prop === 'height') sourceLabel = 'Altura';
                        else if (prop === 'quantity') sourceLabel = 'Quantidade';
                    }
                }

                const valStr = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
                console.log(`[DEBUG] Prop: ${prop}, SourceLabel: ${sourceLabel}, Value: ${value}`);

                // UNIVERSAL RULE: EVERYTHING GOES TO LINKED VARIABLES TABLE
                // This is the "Audit Trail" the user requested.

                const uniqueLabel = linkedVariables.some(v => v.label === sourceLabel)
                    ? `${sourceLabel} (${Date.now().toString().slice(-3)})`
                    : sourceLabel;

                const newItemName = (sourceMeasItem?.code && sourceMeasItem?.description)
                    ? `${sourceMeasItem.code} - ${sourceMeasItem.description}`
                    : (item?.code ? `${item.code} - ${item.description || ''}` : 'Item Referência');

                const lineNum = sourceMemories.indexOf(mem) + 1;
                const bmLabel = `BM ${String(lineNum).padStart(2, '0')}`;

                // Determine Unit based on Property Type
                let finalUnit = item?.unit || '';
                const lowerProp = prop.toLowerCase();
                const lowerSourceLabel = sourceLabel.toLowerCase();

                if (['length', 'width', 'height', 'thickness', 'depth', 'custom_width', 'custom_height'].includes(lowerProp) ||
                    ['comprimento', 'largura', 'altura', 'espessura', 'profundidade'].includes(lowerSourceLabel)) {
                    finalUnit = 'm';
                } else if (lowerProp === 'area' || lowerSourceLabel.includes('área')) {
                    finalUnit = 'mÂ²';
                } else if (lowerProp === 'volume' || lowerSourceLabel.includes('volume')) {
                    finalUnit = 'mÂ³';
                } else if (lowerProp === 'km') {
                    finalUnit = 'km';
                }

                const newVar = {
                    id: `link_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                    label: uniqueLabel,
                    value: value,
                    itemName: newItemName,
                    sourceBM: bmLabel,
                    property: sourceLabel,
                    unit: finalUnit,
                    line: lineNum
                };
                setLinkedVariables(prev => [...prev, newVar]);

                // CONVENIENCE SIDE-EFFECT:
                // If it maps to a standard field (L, W, H, Qty), pre-fill the form too.
                // But this does NOT prevent it from going to the table.

                // Try to map to existing column
                const targetCol = columnConfig.find(c => norm(c.label) === norm(sourceLabel));

                if (targetCol) {
                    if (targetCol.id === 'length' || targetCol.id === 'quantity') {
                        setGenericLength(valStr);
                        newImportedFields['quantity'] = true;
                    } else if (targetCol.id === 'width') {
                        setWidth(valStr);
                        newImportedFields['width'] = true;
                    } else if (targetCol.id === 'height') {
                        setHeight(valStr);
                        newImportedFields['height'] = true;
                    }
                } else {
                    // Fallback Portuguese names
                    if (['comprimento', 'comp.', 'comp', 'quantidade', 'qtd.', 'qtd'].includes(norm(sourceLabel))) {
                        setGenericLength(valStr);
                        newImportedFields['quantity'] = true;
                    } else if (['largura', 'larg.', 'larg'].includes(norm(sourceLabel))) {
                        setWidth(valStr);
                        newImportedFields['width'] = true;
                    } else if (['altura', 'alt.', 'alt', 'espessura', 'espe.', 'espe'].includes(norm(sourceLabel))) {
                        setHeight(valStr);
                        newImportedFields['height'] = true;
                    }
                }

                // Special case for "Total" -> also fill Quantity
                if (['total_quantity'].includes(prop) || ['total', 'item total', 'total do item'].some(s => norm(sourceLabel).includes(s))) {
                    setGenericLength(valStr);
                    newImportedFields['quantity'] = true;
                }
            }
        }


        setFormulaVars(newFormulaVars);
        setImportedFields(newImportedFields);
        setShowLinkModal(false);
        setLinkItemId('');
        setLinkSelections([]);
    };

    // Engineering Formula Calculator Modal
    const [showFormulaCalc, setShowFormulaCalc] = useState(false);
    const [activeFormula, setActiveFormula] = useState<FormulaDef | null>(null);

    // Save Status State
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [formulaVars, setFormulaVars] = useState<Record<string, string>>({});
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

    // Units Management
    const [availableUnits, setAvailableUnits] = useState<any[]>([]);
    const [showManageUnits, setShowManageUnits] = useState(false);

    // Dynamic Column Config
    // Dynamic Column Config
    const [columnConfig, setColumnConfig] = useState<ColumnDef[]>([
        { id: 'description', label: 'Descrição', visible: false },
        { id: 'stations', label: 'Estacas', visible: false },
        { id: 'km', label: 'Quilômetro', visible: false },
        { id: 'location', label: 'Local', visible: false },
    ]);

    // Initialize from Item Metadata
    useEffect(() => {
        if (show) {
            loadItemConfig();
        }
    }, [show, measurementId, contractItemId]);

    async function loadItemConfig() {
        try {
            // New endpoint to fetch item details including metadata
            const { data } = await api.get(`/contracts/measurements/${measurementId}/items/${contractItemId}`);
            if (data?.contractItem?.unit) setContractItemUnit(data.contractItem.unit);

            if (data?.metadata?.columnConfig) {
                const savedConfig = data.metadata.columnConfig as ColumnDef[];

                // Improved Merge Logic: Respect Saved Order
                // 1. Create a map of default system fields for easy lookup
                const systemFieldsMap = new Map<string, ColumnDef>([
                    ['description', { id: 'description', label: 'Descrição', visible: false }],
                    ['stations', { id: 'stations', label: 'Estacas', visible: false }],
                    ['km', { id: 'km', label: 'Quilômetro', visible: false }],
                    ['location', { id: 'location', label: 'Local', visible: false }],
                ]);

                // 2. Build the new config based on SAVED order
                const newConfig: ColumnDef[] = [];
                const processedIds = new Set<string>();

                savedConfig.forEach(savedCol => {
                    // prevent duplicates if backend sends garbage
                    if (processedIds.has(savedCol.id)) return;

                    if (savedCol.id.startsWith('custom_') || savedCol.id.startsWith('unit_') || savedCol.id.startsWith('linked_')) {
                        // Keep custom/unit/linked cols as is
                        newConfig.push(savedCol);
                    } else if (systemFieldsMap.has(savedCol.id)) {
                        // It causes a system field to be placed HERE (preserving order)
                        // We ensure the label/properties match our code defaults where appropriate, 
                        // effectively "hydrating" the saved state with code definitions if needed, 
                        // but respecting the saved visibility and ORDER.
                        const systemDef = systemFieldsMap.get(savedCol.id)!;
                        newConfig.push({ ...systemDef, visible: savedCol.visible });
                    }
                    processedIds.add(savedCol.id);
                });

                // 3. Append any system fields that were NOT in the saved config (e.g. added in a code update)
                systemFieldsMap.forEach((def, id) => {
                    if (!processedIds.has(id)) {
                        newConfig.push(def);
                    }
                });

                setColumnConfig(newConfig);
            }

            if (data?.metadata?.useExtension !== undefined) {
                setUseExtension(data.metadata.useExtension);
            }

            // Restore Linked Variables
            if (data?.metadata?.linkedVariables) {
                setLinkedVariables(data.metadata.linkedVariables);
            }
        } catch (err) {
            console.error('Failed to load item config', err);
        }
    }

    // Debounced Save to Item Config
    // Debounced Save to Item Config
    const saveTimeout = useRef<any>(null);

    // Mark as unsaved when dependencies change
    useEffect(() => {
        if (!show) return;
        setHasUnsavedChanges(true);
        setSaveStatus('saving');
    }, [columnConfig, useExtension, linkedVariables, show]);

    useEffect(() => {
        if (!show) return;

        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            try {
                setSaveStatus('saving');
                await api.put(`/contracts/measurements/${measurementId}/items/${contractItemId}/config`, {
                    metadata: { columnConfig, useExtension, linkedVariables }
                });
                setSaveStatus('saved');
                setHasUnsavedChanges(false);
            } catch (err) {
                console.error('Failed to save item config', err);
                setSaveStatus('error');
            }
        }, 2000);

        return () => clearTimeout(saveTimeout.current);
    }, [columnConfig, show, measurementId, contractItemId, useExtension, linkedVariables]);


    const OPERATIONS = [
        { label: 'Adição (+)', value: '+' },
        { label: 'Subtração (-)', value: '-' },
        { label: 'Divisão (/)', value: '/' },
        { label: 'Multiplicação (x)', value: 'x' }
    ];

    const isVisible = (id: string) => columnConfig.find(c => c.id === id)?.visible;

    useEffect(() => {
        if (show) {
            loadMemories();
            loadUnits();
        }
    }, [show, measurementId, contractItemId]);

    async function loadMemories() {
        try {
            setLoading(true);
            const { data } = await api.get(`/contracts/measurements/${measurementId}/items/${contractItemId}/memories`);
            setMemories(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function loadUnits(newUnitCode?: string) {
        try {
            const { data } = await api.get('/units');
            setAvailableUnits(data);

            if (newUnitCode) {
                setUnit(newUnitCode);
                /* Unit restoration logic removed as per user request
                setColumnConfig(prev => {
                    // Check if 'unit' column exists
                    const exists = prev.some(c => c.id === 'unit');
                    if (exists) {
                        return prev.map(c => c.id === 'unit' ? { ...c, visible: true } : c);
                    } else {
                        // Restore it if deleted
                        return [
                            { id: 'unit', label: 'Unidade', visible: true },
                            ...prev
                        ];
                    }
                });
                */
            } else if (data.length > 0 && !unit) {
                setUnit(data[0].code);
            }
        } catch (err) {
            console.error('Failed to load units', err);
        }
    }

    // Effect to sync units to columns - DISABLED auto-creation to prevent duplicates
    // Unit columns are now managed manually through the column configuration modal
    // Sync Linked Variables to Column Config (Ensure they exist for Drag/Drop)
    useEffect(() => {
        if (!formula.length || !linkedVariables.length) return;

        setColumnConfig(prev => {
            const usedLinkedLabels = formula.filter(f => f.type === 'field' && f.isLinked).map(f => f.value);
            const newCols: ColumnDef[] = [];
            let changed = false;

            usedLinkedLabels.forEach(label => {
                const linkedVar = linkedVariables.find(v => v.label === label);
                if (linkedVar) {
                    const id = `linked_${linkedVar.id}`;
                    // Only add if not already present
                    if (!prev.some(c => c.id === id)) {
                        newCols.push({ id, label: linkedVar.label, visible: true, isLinked: true });
                        changed = true;
                    }
                }
            });

            if (changed) return [...prev, ...newCols];
            return prev;
        });
    }, [formula, linkedVariables]);


    const parseNumber = (value: string) => {
        if (!value) return 0;
        return Number(value.replace(/\./g, '').replace(',', '.'));
    };

    const evaluateExpression = (expression: string): number => {
        const tokens: string[] = [];
        let i = 0;

        const pushNumber = (value: string) => {
            if (value.length > 0) tokens.push(value);
        };

        while (i < expression.length) {
            const ch = expression[i];
            if (/\s/.test(ch)) {
                i += 1;
                continue;
            }

            if (/\d|\./.test(ch)) {
                let num = ch;
                i += 1;
                while (i < expression.length && /[\d.]/.test(expression[i])) {
                    num += expression[i];
                    i += 1;
                }
                pushNumber(num);
                continue;
            }

            if (ch === '*' && expression[i + 1] === '*') {
                tokens.push('**');
                i += 2;
                continue;
            }

            if ('+-*/()'.includes(ch)) {
                tokens.push(ch);
                i += 1;
                continue;
            }

            return NaN;
        }

        const output: string[] = [];
        const operators: string[] = [];
        const precedence: Record<string, number> = { 'u-': 3, '**': 4, '*': 2, '/': 2, '+': 1, '-': 1 };
        const rightAssoc = new Set(['**', 'u-']);
        let prevType: 'number' | 'operator' | '(' | ')' | null = null;

        const isOperator = (token: string) => ['+', '-', '*', '/', '**', 'u-'].includes(token);

        tokens.forEach(token => {
            if (!isNaN(Number(token))) {
                output.push(token);
                prevType = 'number';
                return;
            }

            if (token === '(') {
                operators.push(token);
                prevType = '(';
                return;
            }

            if (token === ')') {
                while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop() as string);
                }
                if (operators.length > 0 && operators[operators.length - 1] === '(') {
                    operators.pop();
                }
                prevType = ')';
                return;
            }

            let op = token;
            if (op === '-' && (prevType === null || prevType === 'operator' || prevType === '(')) {
                op = 'u-';
            }

            while (operators.length > 0 && isOperator(operators[operators.length - 1])) {
                const top = operators[operators.length - 1];
                const precDiff = precedence[op] - precedence[top];
                const shouldPop = rightAssoc.has(op) ? precDiff < 0 : precDiff <= 0;
                if (!shouldPop) break;
                output.push(operators.pop() as string);
            }
            operators.push(op);
            prevType = 'operator';
        });

        while (operators.length > 0) {
            const op = operators.pop() as string;
            if (op === '(' || op === ')') return NaN;
            output.push(op);
        }

        const stack: number[] = [];
        for (const token of output) {
            if (!isNaN(Number(token))) {
                stack.push(Number(token));
                continue;
            }

            if (token === 'u-') {
                if (stack.length < 1) return NaN;
                stack.push(-stack.pop()!);
                continue;
            }

            if (stack.length < 2) return NaN;
            const b = stack.pop() as number;
            const a = stack.pop() as number;
            switch (token) {
                case '+':
                    stack.push(a + b);
                    break;
                case '-':
                    stack.push(a - b);
                    break;
                case '*':
                    stack.push(a * b);
                    break;
                case '/':
                    stack.push(b === 0 ? NaN : a / b);
                    break;
                case '**':
                    stack.push(a ** b);
                    break;
                default:
                    return NaN;
            }
        }

        return stack.length === 1 ? stack[0] : NaN;
    };

    const STATION_LENGTH = 20;
    const KM_LENGTH = 1000;

    const parseStation = (value: string) => {
        if (!value) return 0;
        if (value.includes('+')) {
            const parts = value.split('+');
            const station = parseNumber(parts[0]);
            const meters = parseNumber(parts[1]);
            return (station * STATION_LENGTH) + meters;
        }
        return parseNumber(value) * STATION_LENGTH;
    };

    const formatStation = (meters: number) => {
        if (!meters && meters !== 0) return '-';
        const station = Math.floor(meters / STATION_LENGTH);
        const remainder = meters % STATION_LENGTH;
        return `${station} + ${remainder.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
    };

    const parseKM = (value: string) => {
        if (!value) return 0;
        if (value.includes('+')) {
            const parts = value.split('+');
            const km = parseNumber(parts[0]);
            const meters = parseNumber(parts[1]);
            return (km * KM_LENGTH) + meters;
        }
        return parseNumber(value) * KM_LENGTH;
    };

    const formatKM = (meters: number) => {
        if (!meters && meters !== 0) return '-';
        const km = Math.floor(meters / KM_LENGTH);
        const remainder = meters % KM_LENGTH;
        return `${km} + ${remainder.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
    };

    // Auto-fill 'Comprimento' with calculated extension if enabled
    useEffect(() => {
        const useStations = isVisible('stations');
        const useKM = isVisible('km');

        if (useExtension && (useStations || useKM)) {
            const start = useStations ? parseStation(startPoint) : parseKM(startPoint);
            const end = useStations ? parseStation(endPoint) : parseKM(endPoint);
            const len = Math.abs(end - start);

            const compField = columnConfig.find(c => c.label.toLowerCase().includes('comprimento'));
            if (compField) {
                setFormulaVars(prev => {
                    // Only update if value implies a change to avoid infinite loops, 
                    // though setFormulaVars does shallow comparison usually.
                    // Formatting to match input format
                    const newVal = len.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
                    if (prev[compField.id] !== newVal) {
                        return { ...prev, [compField.id]: newVal };
                    }
                    return prev;
                });
            }
        }
    }, [useExtension, startPoint, endPoint, columnConfig, formulaVars, isVisible]); // isVisible dep might be tricky, it depends on columnConfig

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        try {
            let len = 0;
            let start = 0;
            let end = 0;
            let finalDescription = description;

            const useStations = isVisible('stations');
            const useKM = isVisible('km');
            const useUnit = isVisible('unit');

            // Gather Custom Field Values
            const customFields = columnConfig.filter(c => c.visible && c.id.startsWith('custom_'));
            const customValues: Record<string, number> = {};
            const metadataCustomValues: Record<string, number> = {};

            customFields.forEach(c => {
                const val = parseNumber(formulaVars[c.id]);
                customValues[c.label] = val;
                metadataCustomValues[c.id] = val;
            });

            // Include Linked Variables in calculation context
            linkedVariables.forEach(v => {
                customValues[v.label] = v.value;
            });

            // Add Standard Fields to Calculation Variables if they are visible
            if (isVisible('width')) customValues['Largura'] = parseNumber(width);
            if (isVisible('height')) customValues['Altura'] = parseNumber(height);
            customValues['Quantitativo'] = parseNumber(genericLength); // Always available alias
            customValues['Quantidade'] = parseNumber(genericLength); // Alternate alias

            // Handle Quantity/Length mapping correctly
            // If 'comprimento' exists as a custom column, it might be in formulaVars, but if it is the standard length...
            // Check for standard labels
            columnConfig.forEach(c => {
                if (c.id === 'width' && c.visible) customValues[c.label] = parseNumber(width);
                if (c.id === 'height' && c.visible) customValues[c.label] = parseNumber(height);
                if ((c.id === 'quantity' || c.id === 'length') && c.visible) customValues[c.label] = parseNumber(genericLength);
            });

            // KM/Stations Logic
            if (useStations) {
                start = parseStation(startPoint);
                end = parseStation(endPoint);
                len = Math.abs(end - start);
                finalDescription = description ? `${description} [Est]` : `[Est]`;
            } else if (useKM) {
                start = parseKM(startPoint);
                end = parseKM(endPoint);
                len = Math.abs(end - start);
                finalDescription = description ? `${description} [KM]` : `[KM]`;
            } else {
                len = parseNumber(genericLength) || 1;
            }

            // Calculate Quantity
            let qty = 0;

            // 1. Try User Built Formula
            if (formula.length > 0) {
                const expression = formula.map(item => {
                    if (item.type === 'operator') {
                        if (item.value === '×' || item.value === 'Ã—' || item.value === 'x') return '*';
                        if (item.value === '÷' || item.value === 'Ã·') return '/';
                        if (item.value === '−' || item.value === 'âˆ’') return '-';
                        if (item.value === '^') return '**';
                        return item.value;
                    } else {
                        return customValues[item.value] || 0;
                    }
                }).join(' ');

                try {
                    // Safety check: only allow numbers and operators
                    if (/^[\d\.\s\+\-\*\/\(\)]+$/.test(expression)) {
                        qty = evaluateExpression(expression);
                    }

                    // Apply Extension Logic to Formula
                    const hasComprimento = columnConfig.some(c => c.visible && c.label.toLowerCase().includes('comprimento'));
                    if ((useStations || useKM) && useExtension && !hasComprimento) {
                        qty = qty * len;
                    }

                } catch (e) { console.error('Formula error', e); }
            }
            // 2. Fallback: Multiply all custom fields
            else if (customFields.length > 0) {
                const product = Object.values(customValues).reduce((acc, val) => acc * val, 1);
                // If using stations/km, usage is typically Length * Width * Thickness
                // We have Length (len). We multiply by custom fields product.
                // BUT, if user has "Length" as custom field, we shouldn't double count?
                // Ambiguity here. Assuming len * product.
                // If user entered "Comprimento" manually, maybe they don't use KM/Stations.
                // If they use KM/Station, len is set.
                // If "Comprimento" IS present, the useEffect above has already populated it with 'len', so 'product' already includes 'len'.
                // Doubling it would be wrong.

                const hasComprimento = customFields.some(c => c.label.toLowerCase().includes('comprimento'));
                let multiplier = 1;

                if ((useStations || useKM) && useExtension) {
                    if (!hasComprimento) {
                        multiplier = len;
                    }
                    // else: multiplier is 1, because len is essentially inside 'product' via Comprimento field
                }

                qty = product * multiplier;
            }
            // 3. Fallback: Just Length
            else {
                qty = len;
            }

            // Map variables to legacy schema as best effort (for persistence of partials)
            // We only have length, width, height.
            const values = Object.values(customValues);
            const saveWidth = values.length > 0 ? values[0] : 0;
            const saveHeight = values.length > 1 ? values[1] : 0;

            await api.post(`/contracts/measurements/${measurementId}/memories`, {
                contractItemId,
                description: finalDescription,
                location: location || '',
                unit: useUnit ? unit : '',
                operation,
                startPoint: (useStations || useKM) ? start : 0,
                endPoint: (useStations || useKM) ? end : 0,
                length: len, // This is either from KM/Est or genericLength (if no custom fields?)
                // Actually, if we have custom fields, 'len' might be redundant if not from KM.
                // But we send it anyway.
                width: saveWidth,
                height: saveHeight,
                quantity: qty,
                metadata: {
                    customValues: metadataCustomValues
                }
            });

            setDescription('');
            setLocation('');
            setStartPoint('');
            setEndPoint('');
            setGenericLength('');
            setFormulaVars({}); // Clear inputs
            // setWidth/Height deprecated

            await loadMemories();
            onUpdate();
        } catch (err: any) {
            alert('Erro ao adicionar memória');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir este item da memória?')) return;
        try {
            await api.delete(`/contracts/measurements/memories/${id}`);
            await loadMemories();
            onUpdate();
        } catch (err) {
            alert('Erro ao excluir memória');
        }
    }

    function handleEditColumn(col: ColumnDef) {
        if (!col.formulaData) {
            alert('Dados da fórmula não encontrados para esta coluna.');
            return;
        }
        const formula = ENGINEERING_FORMULAS[col.formulaData.formulaId];
        if (formula) {
            setActiveFormula(formula);
            setFormulaVars(col.formulaData.inputVars || {});
            setAuxDescription(col.label);
            setEditingColumnId(col.id);
            setShowFormulaCalc(true);
        }
    }

    function handleDeleteColumn(col: ColumnDef) {
        if (!confirm(`Deseja remover a coluna "${col.label}"?`)) return;
        setColumnConfig(prev => prev.filter(c => c.id !== col.id));
    }

    if (!show) return null;

    const previousAccumulated = balances?.[contractItemId] || 0;

    const currentMeasurementTotal = (memories || []).reduce((acc, curr) => {
        const qty = Number(curr.quantity);
        const op = curr.operation || '+';
        switch (op) {
            case '+': return acc + qty;
            case '-': return acc - qty;
            case 'x': return acc * qty;
            case '/': return qty !== 0 ? acc / qty : acc;
            default: return acc + qty;
        }
    }, 0);

    const grandTotal = previousAccumulated + currentMeasurementTotal;

    // Backward compatibility for existing render references (temporarily until replaced)
    const totalQuantity = currentMeasurementTotal;

    // Calculate Grid Columns
    // Calculate Grid Columns
    let gridCols = ''; // Operation
    columnConfig.filter(c => c.visible).forEach(c => {
        if (c.id === 'stations' || c.id === 'km') gridCols += '2fr ';
        else if (c.id === 'description') gridCols += '2fr ';
        else if (c.id === 'unit') gridCols += '100px ';
        else gridCols += '1fr ';
    });
    gridCols += 'auto'; // Action Button

    // Calculate Table Columns (ColSpan for total)
    let totalColSpan = 1; // #
    columnConfig.filter(c => c.visible).forEach(c => {
        if (c.id === 'stations' || c.id === 'km') totalColSpan += 2;
        else if (c.id === 'description') { /* Skip description in table as it is hardcoded at end */ }
        else totalColSpan += 1;
    });

    return (
        <DraggableModal
            isOpen={show}
            onClose={onClose}
            title={`Memória de Cálculo: ${itemName}`}
            width="95vw"
            maxWidth="1400px"
        >

            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && <span className="text-amber-600 text-sm">â³ Salvando...</span>}
                    {saveStatus === 'saved' && <span className="text-emerald-500 text-sm">âœ”ï¸ Configuração salva</span>}
                    {saveStatus === 'error' && <span className="text-red-500 text-sm">âŒ Erro ao salvar</span>}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManageUnits(true)}
                        className="btn btn-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none"
                    >
                        Configurar Colunas / Medidas
                    </button>
                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="btn btn-sm bg-green-100 text-green-800 hover:bg-green-200 border-none"
                    >
                        ðŸ”— Vincular Item
                    </button>
                    {/* Distance Calculator Button - only for km unit items */}
                    {contractItemUnit?.toLowerCase().includes('km') && (
                        <button
                            type="button"
                            onClick={() => setShowDistanceCalculator(true)}
                            className="btn btn-sm bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-400 font-bold"
                        >
                            ðŸ“ Calcular Distância
                        </button>
                    )}
                </div>
            </div>

            {/* Formula Builder */}
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-400">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-amber-700 font-bold">Fórmula de Cálculo:</span>
                    <button
                        type="button"
                        onClick={() => setFormula([])}
                        className="ml-auto px-2 py-1 bg-red-50 border border-red-300 rounded text-xs text-red-600 hover:bg-red-100"
                    >
                        Limpar
                    </button>
                </div>

                {/* Current Formula Display */}
                <div className="flex gap-1.5 flex-wrap min-h-[40px] p-3 bg-amber-50/50 rounded mb-3 items-center border border-amber-200">
                    {formula.length === 0 ? (
                        <span className="text-amber-800 text-sm">Clique nos campos e operadores abaixo para construir a fórmula</span>
                    ) : (
                        formula.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => setFormula(formula.filter((_, i) => i !== idx))}
                                className={`px-3 py-1.5 rounded cursor-pointer font-bold text-sm text-gray-900 ${item.type === 'operator' ? 'bg-amber-500' : (item.isLinked ? 'bg-violet-500' : 'bg-blue-500')
                                    }`}
                                title="Clique para remover"
                            >
                                {item.value}
                            </div>
                        ))
                    )}
                </div>

                {/* Linked Variables Section */}
                {linkedVariables.length > 0 && (
                    <div className="mb-4 pb-2 border-b border-dashed border-gray-300">
                        <span className="text-sm text-sky-700 font-bold block mb-2">Itens Vinculados:</span>

                        <div className="overflow-x-auto border border-gray-200 rounded">
                            <table className="w-full text-xs border-collapse text-left">
                                <thead className="bg-sky-50 text-sky-900">
                                    <tr>
                                        <th className="px-2 py-1.5 border-b border-sky-100">Item</th>
                                        <th className="px-2 py-1.5 border-b border-sky-100">Origem</th>
                                        <th className="px-2 py-1.5 border-b border-sky-100 text-center">Linha</th>
                                        <th className="px-2 py-1.5 border-b border-sky-100">Propriedade</th>
                                        <th className="px-2 py-1.5 border-b border-sky-100 text-center">Unid.</th>
                                        <th className="px-2 py-1.5 border-b border-sky-100 text-right">Valor</th>
                                        <th className="px-2 py-1.5 border-b border-sky-100 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedVariables.map(v => (
                                        <tr key={v.id} className="border-b border-gray-100">
                                            <td className="px-2 py-1.5 max-w-[150px] truncate" title={v.itemName}>
                                                {v.itemName || '-'}
                                            </td>
                                            <td className="px-2 py-1.5 text-gray-500">
                                                {v.sourceBM || '-'}
                                            </td>
                                            <td className="px-2 py-1.5 text-center text-gray-500">
                                                {v.line || '-'}
                                            </td>
                                            <td className="px-2 py-1.5 font-bold text-sky-700">
                                                {v.property || v.label}
                                            </td>
                                            <td className="px-2 py-1.5 text-center text-slate-600 text-xs">
                                                {v.unit || '-'}
                                            </td>
                                            <td className="px-2 py-1.5 text-right font-mono">
                                                {v.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormula([...formula, { type: 'field', value: v.label, isLinked: true }]);
                                                            setColumnConfig(prev => {
                                                                const id = `linked_${v.id}`;
                                                                if (prev.some(c => c.id === id)) return prev;
                                                                return [...prev, { id, label: v.label, visible: true, isLinked: true }];
                                                            });
                                                        }}
                                                        className="px-2 py-0.5 bg-blue-500 text-gray-900 rounded text-xs hover:bg-blue-600"
                                                        title="Adicionar Ã  Fórmula"
                                                    >
                                                        Usar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLinkedVariables(prev => prev.filter(p => p.id !== v.id))}
                                                        className="px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200"
                                                        title="Remover Item Vinculado"
                                                    >
                                                        âœ•
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Available Fields - Only custom fields */}
                <div className="flex gap-2 flex-wrap mb-2">
                    <span className="text-xs text-slate-600 w-full">Campos:</span>
                    {columnConfig.filter(c => c.visible && c.id.startsWith('custom_')).map(col => (
                        <button
                            key={col.id}
                            type="button"
                            onClick={() => setFormula([...formula, { type: 'field', value: col.label }])}
                            className="px-2.5 py-1 bg-blue-500 text-gray-900 rounded text-sm hover:bg-blue-600"
                        >
                            {col.label}
                        </button>
                    ))}
                </div>

                {/* Operators - Extended */}
                <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 w-full">Operadores:</span>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: '+' }])} className="px-3 py-1 bg-amber-400 rounded font-bold hover:bg-amber-500">+</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: '-' }])} className="px-3 py-1 bg-amber-400 rounded font-bold hover:bg-amber-500">âˆ’</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: 'Ã—' }])} className="px-3 py-1 bg-amber-400 rounded font-bold hover:bg-amber-500">Ã—</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: 'Ã·' }])} className="px-3 py-1 bg-amber-400 rounded font-bold hover:bg-amber-500">Ã·</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: '^' }])} className="px-3 py-1 bg-orange-500 text-gray-900 rounded font-bold hover:bg-orange-600">^</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: 'âˆš' }])} className="px-3 py-1 bg-orange-500 text-gray-900 rounded font-bold hover:bg-orange-600">âˆš</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: '%' }])} className="px-3 py-1 bg-orange-500 text-gray-900 rounded font-bold hover:bg-orange-600">%</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: '(' }])} className="px-3 py-1 bg-slate-400 rounded font-bold hover:bg-slate-500">(</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: ')' }])} className="px-3 py-1 bg-slate-400 rounded font-bold hover:bg-slate-500">)</button>
                    <button type="button" onClick={() => setFormula([...formula, { type: 'operator', value: 'Ï€' }])} className="px-3 py-1 bg-violet-500 text-gray-900 rounded font-bold hover:bg-violet-600">Ï€</button>
                </div>

                {/* Engineering Formulas */}
                <div className="flex gap-2 flex-wrap mt-2 pt-2 border-t border-dashed border-gray-300">
                    <span className="text-xs text-slate-600 w-full">Fórmulas de Engenharia (clique para calcular):</span>
                    {Object.values(ENGINEERING_FORMULAS).map(f => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                                setActiveFormula(f);
                                setFormulaVars({});
                                setAuxDescription('');
                                setEditingColumnId(null);
                                setShowFormulaCalc(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-gray-900 rounded text-xs hover:bg-emerald-700"
                            title={f.title}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <form onSubmit={handleAdd} className="grid gap-3 items-end bg-gray-100 p-4 rounded-lg mb-5" style={{ gridTemplateColumns: gridCols }}>

                    <SortableContext items={columnConfig.filter(c => c.visible).map(c => c.id)} strategy={rectSortingStrategy}>
                        {columnConfig.map(col => {
                            if (!col.visible) return null;

                            // Special Case: Linked Variables behaving as columns
                            // The user wants linked variables used in the formula to appear as inputs (read-only)
                            // We need to check if we are rendering a linked variable placeholder or if we need to inject them.
                            // Current approach: iterating columnConfig.
                            // Issue: Linked Variables are NOT in columnConfig.
                            // Fix: We should inject them into the SortableContext or render them separately.
                            // Since we can't easily inject into columnConfig map without breaking sort, 
                            // we will render them BEFORE the loop or check if we can append them.
                            // ACTUALLY, the better spot is after the SortableContext loop or mixed in if possible.
                            // But since they are not sortable (fixed position?), let's render them explicitly if valid.

                            // Let's modify the map to include pseudo-columns for linked vars if they are active?
                            // No, that's complex.
                            // Let's just render them before the button but AFTER the regular columns? 
                            // Or better: The user wants them "as a column in the add line".
                            // The grid layout is auto-flow. Adding them as children of <form> works.

                            const usedVariables = new Set(formula.filter(f => f.type === 'field').map(f => f.value));

                            const isUsed = usedVariables.has(col.label) ||
                                (col.id === 'quantity' && (usedVariables.has('Quantitativo') || usedVariables.has('Quantidade'))) ||
                                (col.id === 'length' && (usedVariables.has('Quantitativo') || usedVariables.has('Quantidade'))); // Alias support

                            // Always show Metadata fields
                            const isMetadata = ['description', 'location', 'unit', 'stations', 'km'].includes(col.id) || col.id === 'unit_desc';

                            // If it's a calculation field (Quantity/Width/Height/Custom/Unit) AND not used in formula, hide it.
                            // Note: 'formula.length > 0' check implies: if empty, hide everything except metadata.
                            if (!isMetadata && formula.length === 0) return null;
                            if (!isMetadata && !isUsed) return null;


                            if (col.id === 'unit') return (
                                <SortableFormItem key="unit" id={col.id}>
                                    <label className="label text-xs">Und.</label>
                                    <select value={unit} onChange={e => setUnit(e.target.value)} className="input py-1.5 text-sm">
                                        {availableUnits.map(u => <option key={u.id} value={u.code}>{u.code}</option>)}
                                    </select>
                                </SortableFormItem>
                            );

                            if (col.id === 'unit_desc') return null; // Skip in input form

                            if (col.id === 'description') return (
                                <SortableFormItem key="desc" id={col.id}>
                                    <label className="label text-xs">Descrição / Eixo</label>
                                    <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="input py-1.5 text-sm" />
                                </SortableFormItem>
                            );

                            if (col.id === 'location') return (
                                <SortableFormItem key="loc" id={col.id}>
                                    <label className="label text-xs">Local</label>
                                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="input py-1.5 text-sm" />
                                </SortableFormItem>
                            );

                            if (col.id === 'stations') return (
                                <SortableFormItem key="stations" id={col.id}>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="label text-xs">Est. Inicial</label>
                                            <input required type="text" value={startPoint} onChange={e => setStartPoint(e.target.value)} placeholder="000 + 0,000" className="input py-1.5 text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="label text-xs">Est. Final</label>
                                            <input required type="text" value={endPoint} onChange={e => setEndPoint(e.target.value)} placeholder="000 + 0,000" className="input py-1.5 text-sm" />
                                        </div>
                                    </div>
                                </SortableFormItem>
                            );

                            if (col.id === 'km') return (
                                <SortableFormItem key="km" id={col.id}>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="label text-xs">KM Inicial</label>
                                            <input required type="text" value={startPoint} onChange={e => setStartPoint(e.target.value)} placeholder="000 + 0,000" className="input py-1.5 text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="label text-xs">KM Final</label>
                                            <input required type="text" value={endPoint} onChange={e => setEndPoint(e.target.value)} placeholder="000 + 0,000" className="input py-1.5 text-sm" />
                                        </div>
                                    </div>
                                </SortableFormItem>
                            );

                            if (col.id === 'quantity') return (
                                <SortableFormItem key="qty" id={col.id}>
                                    <label className="label text-xs">Quantidade</label>
                                    <input required type="text" value={genericLength} onChange={e => setGenericLength(e.target.value)} onBlur={e => {
                                        const v = e.target.value;
                                        if (v) { const n = parseNumber(v); if (!isNaN(n)) setGenericLength(n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 4 })); }
                                    }} placeholder="0,000" className={`input py-1.5 text-sm ${importedFields['quantity'] ? 'border-2 border-emerald-500 bg-emerald-50' : ''}`} />
                                </SortableFormItem>
                            );

                            if (col.id === 'width') return (
                                <SortableFormItem key="width" id={col.id}>
                                    <label className="label text-xs">Largura</label>
                                    <input required type="text" value={width} onChange={e => setWidth(e.target.value)} onBlur={e => {
                                        const v = e.target.value;
                                        if (v) { const n = parseNumber(v); if (!isNaN(n)) setWidth(n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })); }
                                    }} placeholder="1,00" className={`input py-1.5 text-sm ${importedFields['width'] ? 'border-2 border-emerald-500 bg-emerald-50' : ''}`} />
                                </SortableFormItem>
                            );

                            if (col.id === 'height') return (
                                <SortableFormItem key="height" id={col.id}>
                                    <label className="label text-xs">Altura</label>
                                    <input required type="text" value={height} onChange={e => setHeight(e.target.value)} onBlur={e => {
                                        const v = e.target.value;
                                        if (v) { const n = parseNumber(v); if (!isNaN(n)) setHeight(n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })); }
                                    }} placeholder="1,00" className={`input py-1.5 text-sm ${importedFields['height'] ? 'border-2 border-emerald-500 bg-emerald-50' : ''}`} />
                                </SortableFormItem>
                            );

                            // Render Custom Unit Columns as generic quantity inputs
                            if (col.id.startsWith('unit_') && col.id !== 'unit_desc') {
                                return (
                                    <SortableFormItem key={col.id} id={col.id}>
                                        <label className="label text-xs">{col.label}</label>
                                        <input
                                            required
                                            type="text"
                                            value={genericLength}
                                            onChange={e => setGenericLength(e.target.value)}
                                            placeholder="0,000"
                                            className="input py-1.5 text-sm"
                                        />
                                    </SortableFormItem>
                                );
                            }

                            // Render Custom Fields (added by user) - map to width/height
                            if (col.id.startsWith('custom_')) {
                                return (
                                    <SortableFormItem key={col.id} id={col.id}>
                                        <label className="label text-xs">
                                            {col.label}{col.unitLabel ? ` (${col.unitLabel})` : ''}
                                        </label>
                                        {(() => {
                                            const useStations = isVisible('stations');
                                            const useKM = isVisible('km');
                                            const isLocked = useExtension && col.label.toLowerCase().includes('comprimento') && (useStations || useKM);

                                            return (
                                                <input
                                                    type="text"
                                                    value={formulaVars[col.id] || ''}
                                                    onChange={e => setFormulaVars(prev => ({ ...prev, [col.id]: e.target.value }))}
                                                    onBlur={e => {
                                                        if (isLocked) return;
                                                        const v = e.target.value;
                                                        if (v) {
                                                            const n = parseNumber(v);
                                                            if (!isNaN(n)) {
                                                                setFormulaVars(prev => ({ ...prev, [col.id]: n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 4 }) }));
                                                            }
                                                        }
                                                    }}
                                                    placeholder="0,000"
                                                    readOnly={isLocked}
                                                    disabled={isLocked}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px',
                                                        backgroundColor: isLocked ? '#f3f4f6' : (importedFields[col.id] ? '#f0fdf4' : 'white'),
                                                        cursor: isLocked ? 'not-allowed' : 'text',
                                                        border: importedFields[col.id] ? '2px solid #10b981' : '1px solid #ccc'
                                                    }}
                                                />
                                            );
                                        })()}
                                    </SortableFormItem>
                                );
                            }

                            // Render Linked Columns (Draggable)
                            if (col.id.startsWith('linked_')) {
                                // Find the linked variable by label (stored in column label) or ID
                                // The ID is `linked_${v.id}`
                                const linkedId = col.id.replace('linked_', '');
                                const linkedVar = linkedVariables.find(v => v.id === linkedId);

                                if (!linkedVar) return null; // Should not happen unless linked var removed

                                return (
                                    <SortableFormItem key={col.id} id={col.id}>
                                        <label style={{ display: 'block', fontSize: '0.8em', marginBottom: '4px', color: '#2563eb', fontWeight: 'bold' }}>
                                            {linkedVar.label} {linkedVar.unit ? `(${linkedVar.unit})` : ''} <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#64748b' }}>(Vinculado)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={Number(linkedVar.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                            readOnly
                                            disabled
                                            style={{ width: '100%', padding: '6px', background: '#e0f2fe', border: '1px solid #93c5fd', color: '#1e40af', cursor: 'default' }}
                                        />
                                    </SortableFormItem>
                                );
                            }

                            return null;
                        })}

                    </SortableContext>
                    {/* Render Linked Variables used in Formula */}


                    <button type="submit" className="btn btn-primary h-[35px] px-4">Adicionar</button>

                    {/* Preview Calc */}
                    <div style={{ fontSize: '0.9em', color: '#666', gridColumn: '1 / -1', marginTop: '5px' }}>
                        {(() => {
                            // Include linked columns in allFields for calculation lookup
                            const allFields = columnConfig.filter(c => c.visible && (c.id.startsWith('custom_') || c.id.startsWith('linked_')));
                            const productFields = allFields.filter(c => !c.isAuxiliary);
                            const hasAuxiliary = allFields.some(c => c.isAuxiliary);



                            // 1. Formula Preview
                            if (formula.length > 0) {
                                const previewParts = formula.map((item, i) => {
                                    if (item.type === 'operator') return <span key={i} style={{ margin: '0 2px' }}>{item.value}</span>;
                                    const field = allFields.find(c => c.label === item.value);
                                    // User requested to SUPPRESS typed values (e.g. "Largura(10)") and just show "Largura"
                                    return <span key={i} style={{ margin: '0 2px' }}>{item.value}</span>;
                                });

                                let expression = formula.map(item => {
                                    if (item.type === 'operator') {
                                        if (item.value === '×' || item.value === 'Ã—' || item.value === 'x') return '*';
                                        if (item.value === '÷' || item.value === 'Ã·') return '/';
                                        if (item.value === '−' || item.value === 'âˆ’') return '-';
                                        if (item.value === '^') return '**';
                                        return item.value;
                                    } else {
                                        const field = allFields.find(c => c.label === item.value);
                                        if (field?.id.startsWith('linked_')) {
                                            const linkedId = field.id.replace('linked_', '');
                                            const linkedVar = linkedVariables.find(v => v.id === linkedId);
                                            return linkedVar ? linkedVar.value : 0;
                                        }
                                        return field ? parseNumber(formulaVars[field.id] || '0') : 0;
                                    }
                                }).join(' ');
                                let result = 0;
                                try { result = evaluateExpression(expression); } catch { }

                                // Extension Logic for Formula Preview
                                const useStations = isVisible('stations');
                                const useKM = isVisible('km');
                                let len = 0;
                                let showExtension = false;

                                if ((useStations || useKM) && useExtension) {
                                    const start = useStations ? parseStation(startPoint) : parseKM(startPoint);
                                    const end = useStations ? parseStation(endPoint) : parseKM(endPoint);
                                    len = Math.abs(end - start);

                                    const hasComprimento = productFields.some(c => c.label.toLowerCase().includes('comprimento'));
                                    if (!hasComprimento && len > 0) {
                                        showExtension = true;
                                        result = result * len;
                                    }
                                }

                                // Handle NaN or invalid result
                                const validResult = (!isNaN(result) && isFinite(result)) ? result : 0;

                                return <>Cálculo = {previewParts} {showExtension && <>Ã— <span>Distância</span></>} = <strong>{validResult.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</strong> {contractItemUnit}</>;
                            }

                            // 2. Custom Product Preview (Default)
                            // User Request: DISABLE Default Product Calculation entirely. Wait for formula.
                            if (productFields.length > 0) {
                                const useStations = isVisible('stations');
                                const useKM = isVisible('km');
                                let len = 0;

                                if (useStations || useKM) {
                                    const start = useStations ? parseStation(startPoint) : parseKM(startPoint);
                                    const end = useStations ? parseStation(endPoint) : parseKM(endPoint);
                                    len = Math.abs(end - start);
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {/* Extension Info */}
                                        {(useStations || useKM) && (
                                            <div style={{ fontSize: '0.85em', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span>Extensão Calculada: <strong>{len.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong></span>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={useExtension}
                                                        onChange={e => setUseExtension(e.target.checked)}
                                                    />
                                                    <span style={{ fontSize: '0.9em' }}>Multiplicar pela Extensão</span>
                                                </label>
                                            </div>
                                        )}

                                        <div style={{ fontSize: '0.9em', color: '#9ca3af', fontStyle: 'italic', marginTop: '5px' }}>
                                            Monte a fórmula acima para ver o cálculo...
                                        </div>
                                    </div>
                                );
                            }

                            // 3. Legacy Preview (Stations/KM/Length only)
                            // User Request: If formula is empty, show nothing.
                            return null;
                        })()}
                    </div>
                </form>
            </DndContext>

            <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2 text-left">#</th>
                        {columnConfig.map(col => {
                            if (!col.visible) return null;
                            if (col.id === 'unit') return <th key="h_unit" style={{ padding: '8px', textAlign: 'center' }}>Und.</th>;
                            if (col.id === 'unit_desc') return <th key="h_unit_desc" style={{ padding: '8px', textAlign: 'left' }}>Desc. Unidade</th>;
                            if (col.id === 'unit_desc') return <th key="h_unit_desc" style={{ padding: '8px', textAlign: 'left' }}>Desc. Unidade</th>;
                            // Description removed from here (moved to end)
                            if (col.id === 'stations') return (
                                <React.Fragment key="h_st">
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Est. Inicial</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Est. Final</th>
                                </React.Fragment>
                            );
                            if (col.id === 'km') return (
                                <React.Fragment key="h_km">
                                    <th style={{ padding: '8px', textAlign: 'right' }}>KM Inicial</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>KM Final</th>
                                </React.Fragment>
                            );
                            if (col.id === 'quantity') return <th key="h_qty" style={{ padding: '8px', textAlign: 'right' }}>Quantidade</th>;
                            if (col.id === 'width') return <th key="h_w" style={{ padding: '8px', textAlign: 'right' }}>Largura</th>;
                            if (col.id === 'height') return <th key="h_h" style={{ padding: '8px', textAlign: 'right' }}>Altura</th>;

                            if (col.id.startsWith('unit_') && col.id !== 'unit_desc') {
                                return <th key={`h_${col.id}`} style={{ padding: '8px', textAlign: 'right' }}>{col.label}</th>;
                            }

                            if (col.id.startsWith('custom_')) {
                                return (
                                    <th key={`h_${col.id}`} style={{ padding: '8px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>{col.label}{col.unitLabel ? ` (${col.unitLabel})` : ''}</span>
                                                {col.isAuxiliary && (
                                                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditColumn(col)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '1em' }}
                                                            title="Editar"
                                                        >
                                                            âœï¸
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteColumn(col)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '1em' }}
                                                            title="Remover"
                                                        >
                                                            âŒ
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {col.isAuxiliary && col.formulaData && (() => {
                                                const formula = ENGINEERING_FORMULAS[col.formulaData.formulaId];
                                                if (formula) {
                                                    return (
                                                        <div style={{ fontSize: '0.75em', color: '#64748b', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                                                            {formula.name}: {formula.title}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </th>
                                );
                            }

                            return null;
                        })}
                        <th className="p-2 text-right bg-sky-100">Qtd. Parcial</th>
                        <th className="p-2 text-right bg-blue-100">Qtd. Acum.</th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-center bg-amber-100">Medição</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {(memories || []).map((mem, idx) => {
                        const isKM = mem.description && mem.description.includes('[KM]');
                        const isEst = mem.description && mem.description.includes('[Est]');
                        const displayDesc = mem.description ? mem.description.replace('[KM]', '').replace('[Est]', '').trim() : '';
                        const unitDesc = availableUnits.find(u => u.code === mem.unit)?.description || '-';

                        return (
                            <tr key={mem.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px' }}>{idx + 1}</td>

                                {columnConfig.map(col => {
                                    if (!col.visible) return null;
                                    if (col.id === 'unit') return <td key="c_unit" style={{ padding: '8px', textAlign: 'center' }}>{mem.unit || '-'}</td>;
                                    if (col.id === 'unit_desc') return <td key="c_unit_desc" style={{ padding: '8px' }}>{unitDesc}</td>;
                                    if (col.id === 'unit_desc') return <td key="c_unit_desc" style={{ padding: '8px' }}>{unitDesc}</td>;
                                    // Description removed from here
                                    if (col.id === 'location') return <td key="c_loc" style={{ padding: '8px' }}>{mem.location || '-'}</td>;

                                    if (col.id === 'stations') return (
                                        <React.Fragment key="c_st">
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{isEst ? formatStation(Number(mem.startPoint)) : '-'}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{isEst ? formatStation(Number(mem.endPoint)) : '-'}</td>
                                        </React.Fragment>
                                    );
                                    if (col.id === 'km') return (
                                        <React.Fragment key="c_km">
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{isKM ? formatKM(Number(mem.startPoint)) : '-'}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{isKM ? formatKM(Number(mem.endPoint)) : '-'}</td>
                                        </React.Fragment>
                                    );
                                    if (col.id === 'quantity') return <td key="c_qty" style={{ padding: '8px', textAlign: 'right' }}>{Number(mem.length).toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</td>;
                                    if (col.id === 'width') return <td key="c_w" style={{ padding: '8px', textAlign: 'right' }}>{Number(mem.width) !== 0 ? Number(mem.width).toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-'}</td>;
                                    if (col.id === 'height') return <td key="c_h" style={{ padding: '8px', textAlign: 'right' }}>{Number(mem.height) !== 0 ? Number(mem.height).toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-'}</td>;

                                    // Custom Unit Columns
                                    if (col.id.startsWith('unit_') && col.id !== 'unit_desc') {
                                        const matches = mem.unit === col.unitLabel;
                                        return <td key={`c_${col.id}`} style={{ padding: '8px', textAlign: 'right' }}>
                                            {matches ? Number(mem.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-'}
                                        </td>;
                                    }

                                    // Custom Fields (added by user) - map to width/height map or metadata
                                    if (col.id.startsWith('custom_')) {
                                        // 1. Try Metadata (robust ID-based lookup)
                                        if (mem.metadata?.customValues?.[col.id] !== undefined) {
                                            const val = Number(mem.metadata.customValues[col.id]);
                                            return <td key={`c_${col.id}`} style={{ padding: '8px', textAlign: 'right' }}>
                                                {val !== 0 ? val.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-'}
                                            </td>;
                                        }

                                        // 2. Fallback to width/height based on index
                                        const customFields = columnConfig.filter(c => c.visible && c.id.startsWith('custom_'));
                                        const fieldIndex = customFields.findIndex(c => c.id === col.id);
                                        const value = fieldIndex === 0 ? mem.width : mem.height;
                                        return <td key={`c_${col.id}`} style={{ padding: '8px', textAlign: 'right' }}>
                                            {Number(value) !== 0 ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-'}
                                        </td>;
                                    }

                                    return null;
                                })}

                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', background: '#f0f9ff' }}>{Number(mem.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} {contractItemUnit}</td>
                                <td style={{ padding: '8px', textAlign: 'right', background: '#eff6ff' }}>
                                    {(() => {
                                        // Calculate accumulated quantity up to this row
                                        let accum = previousAccumulated;
                                        for (let i = 0; i <= idx; i++) {
                                            accum += Number(memories[i].quantity) || 0;
                                        }
                                        return accum.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) + ' ' + contractItemUnit;
                                    })()}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', color: '#6b7280' }}>{displayDesc || '-'}</td>
                                <td style={{ padding: '8px', textAlign: 'center', background: '#fffbeb', fontWeight: 'bold', color: '#b45309' }}>
                                    {measurementNumber ? `BM nº ${String(measurementNumber).padStart(2, '0')}` : '-'}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <button onClick={() => handleDelete(mem.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Excluir</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                        <td colSpan={totalColSpan} className="p-3 text-right font-bold">TOTAIS:</td>
                        <td className="p-3 text-right font-bold text-blue-600 text-base">
                            <div className="text-[0.7em] text-slate-500 uppercase">Medição Atual</div>
                            {currentMeasurementTotal.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
                        </td>
                        <td className="p-3 text-right font-bold text-indigo-700 text-base">
                            <div className="text-[0.7em] text-slate-500 uppercase">Acumulado</div>
                            {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            <ManageUnitsModal
                open={showManageUnits}
                onClose={() => setShowManageUnits(false)}
                onUnitsChange={loadUnits}
                columnConfig={columnConfig}
                setColumnConfig={setColumnConfig}
            />

            {/* Link Item Modal */}
            <DraggableModal
                isOpen={showLinkModal}
                title="Vincular Item da Medição"
                onClose={() => setShowLinkModal(false)}
                width="95vw"
                maxWidth="1600px" // Expanded max width
            >
                <div className="p-5">
                    <div className="mb-4">
                        <label className="block mb-1 font-bold">Selecione o Item de Origem:</label>
                        <select
                            value={linkItemId}
                            onChange={e => { setLinkItemId(e.target.value); setLinkSelections([]); }}
                            className="input w-full"
                        >
                            <option value="">Selecione um item...</option>
                            {[...availableItems]
                                .filter((i: any) => i.id !== contractItemId)
                                // Sort removed to respect backend/list order
                                .map((i: any) => {
                                    // Robust Indentation Logic
                                    // Priority 1: Use explicit depth from backend if available
                                    // Priority 2: Infer from dots in code
                                    const dotCount = (i.code || '').split('.').length - 1;
                                    const indentLevel = i.depth !== undefined ? i.depth : Math.max(0, dotCount);

                                    const indent = '\u00A0'.repeat(indentLevel * 4);

                                    const label = i.code ? `${i.code} - ${i.description}` : i.description;
                                    const truncated = label.substring(0, 100) + (label.length > 100 ? '...' : '');

                                    // Styling based on hierarchy
                                    // Top levels (depth 0 or 1 with little dots) get bold/color
                                    const isHeader = indentLevel === 0;
                                    const style = isHeader
                                        ? { fontWeight: 'bold', color: '#1e3a8a' } // Dark Blue for headers
                                        : { color: '#374151' }; // Gray for children

                                    return (
                                        <option key={i.id} value={i.id} style={style}>
                                            {indent}{truncated}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>

                    {linkItemId && (
                        <div className="mb-4">
                            <label className="block mb-1 font-bold">Marque as propriedades que deseja importar:</label>

                            {/* Scrollable Container with reduced height to avoid page scroll logic */}
                            <div className="border border-gray-300 rounded max-h-[450px] overflow-y-auto overflow-x-auto">
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', minWidth: '900px' }}>
                                    <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd', width: '80px' }}>Medição</th>
                                            {/* Render Headers Based on Source Config */}
                                            {(() => {
                                                const config = getSourceConfig(linkItemId);
                                                // Filter out descriptions/stations/km handled separately or ignored?
                                                // Actually, "KM" is handled as a specific column if present.
                                                // "Medição" is hardcoded. "Description" forced to end.

                                                // We want to show: KM (if distinct), then Values, then Description.
                                                // Let's filter config:
                                                return config
                                                    .filter(c => c.visible && c.id !== 'description' && c.id !== 'stations')
                                                    .map(col => (
                                                        <th key={col.id} style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                                                            {col.label}
                                                            {col.unitLabel ? <small style={{ fontWeight: 'normal' }}> ({col.unitLabel})</small> : ''}
                                                        </th>
                                                    ));
                                            })()}
                                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd', minWidth: '80px', background: '#f8fafc' }}>Total</th>
                                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Memory Rows - Dynamic Rendering */}
                                        {measurementItems?.find((mi: any) => mi.contractItemId === linkItemId)?.memories?.map((m: any, idx: number) => {
                                            const config = getSourceConfig(linkItemId);

                                            return (
                                                <tr
                                                    key={m.id}
                                                    style={{
                                                        background: linkSelections.some(s => s.id === m.id) ? '#eff6ff' : 'white',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        fontSize: '0.9em'
                                                    }}
                                                >
                                                    {/* Medição (Reference only) */}
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <span style={{
                                                            background: '#e5e7eb',
                                                            color: '#374151',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8em',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            BM {String(idx + 1).padStart(2, '0')}
                                                        </span>
                                                    </td>

                                                    {/* Dynamic Value Columns */}
                                                    {config
                                                        .filter(c => c.visible && c.id !== 'description' && c.id !== 'stations')
                                                        .map(col => {
                                                            const value = getValueFromMemory(m, col, config);
                                                            const isKM = col.id === 'km';

                                                            // For KM, show formatted range. value returned by helper is just 0 for KM usually unless specifically handled?
                                                            // My getValueFromMemory returns 0 for KM unless I change it.
                                                            // BUT, for KM we want to show "Start a End".
                                                            // Only show text? And check box?

                                                            let displayValue: React.ReactNode = '';
                                                            if (isKM) {
                                                                const s = formatKM(Number(m.startPoint) || 0);
                                                                const e = formatKM(Number(m.endPoint) || 0);
                                                                displayValue = `${s} a ${e}`;
                                                            } else {
                                                                displayValue = value !== 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-';
                                                            }

                                                            return (
                                                                <td key={col.id} style={{ padding: '8px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                        {/* Value First */}
                                                                        <span style={{
                                                                            fontWeight: col.id === 'quantity' ? 'bold' : 'normal',
                                                                            color: col.id === 'quantity' ? '#059669' : 'inherit'
                                                                        }}>
                                                                            {displayValue}
                                                                        </span>
                                                                        {/* Checkbox Second */}
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isLinkPropSelected(m.id, col.id)}
                                                                            onChange={() => toggleLinkProp(m.id, col.id)}
                                                                            title={`Importar ${col.label}`}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            );
                                                        })
                                                    }

                                                    {/* Total Fixed Column */}
                                                    <td style={{ padding: '8px', textAlign: 'center', background: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                            <span style={{ fontWeight: 'bold', color: '#15803d' }}>
                                                                {m.quantity !== undefined ? Number(m.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '-'}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                checked={isLinkPropSelected(m.id, 'total_quantity')}
                                                                onChange={() => toggleLinkProp(m.id, 'total_quantity')}
                                                                title="Importar Total"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Descrição column (Always at end) */}
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                            <span style={{ color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.description || ''}>
                                                                {m.description || '-'}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                checked={isLinkPropSelected(m.id, 'description')}
                                                                onChange={() => toggleLinkProp(m.id, 'description')}
                                                                title="Importar Descrição"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!measurementItems?.find((mi: any) => mi.contractItemId === linkItemId)?.memories?.length) && (
                                            <tr>
                                                <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                    Nenhuma memória lançada para este item.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Selection summary */}
                            <div className="mt-3 p-2 bg-sky-50 rounded text-sm">
                                <strong>Selecionados:</strong> {linkSelections.reduce((acc, sel) => acc + sel.props.length, 0)} propriedade(s) de {linkSelections.length} linha(s)
                            </div>
                        </div>
                    )}



                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500">
                            Os valores selecionados serão preenchidos no formulário. Lembre-se de clicar em <strong>Adicionar</strong> para salvar.
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmLink}
                                disabled={!linkItemId}
                                className={`btn bg-green-600 text-gray-900 hover:bg-green-500 ${!linkItemId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Preencher Formulário
                            </button>
                        </div>
                    </div>
                </div>
            </DraggableModal>

            {/* Formula Calculator Modal */}
            <DraggableModal
                isOpen={showFormulaCalc && activeFormula !== null}
                onClose={() => setShowFormulaCalc(false)}
                title={activeFormula ? activeFormula.name : 'Fórmula'}
                width="fit-content"
            >
                {activeFormula && (
                    <div className="min-w-[400px]">
                        <div className="mb-4">
                            {activeFormula.variables.map(v => (
                                <div key={v.key} className="mb-3">
                                    <label className="block mb-1 text-sm text-gray-700">{v.label}</label>
                                    <input
                                        type="text"
                                        value={formulaVars[v.key] || ''}
                                        onChange={e => setFormulaVars({ ...formulaVars, [v.key]: e.target.value })}
                                        placeholder="0,000"
                                        className="input py-2.5 text-base"
                                    />
                                </div>
                            ))}

                            {/* Description Input for Auxiliary Column */}
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <label className="block mb-1 text-sm text-gray-700 font-bold">Nome da Variável Auxiliar</label>
                                <input
                                    type="text"
                                    value={auxDescription}
                                    onChange={e => setAuxDescription(e.target.value)}
                                    placeholder="Ex: Pilar P1"
                                    className="input py-2.5 text-base border-2 border-blue-600 bg-blue-50"
                                />
                                <span className="text-xs text-gray-500">Este resultado será salvo como uma nova coluna disponível para fórmulas.</span>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="bg-emerald-50 p-4 rounded-lg mb-4 border border-emerald-300">
                            <span className="text-sm text-emerald-600">Resultado:</span>
                            <div className="text-2xl font-bold text-emerald-700">
                                {(() => {
                                    const calculationVars: Record<string, number> = {};
                                    let allFilled = true;
                                    activeFormula.variables.forEach(v => {
                                        const val = formulaVars[v.key];
                                        if (!val) allFilled = false;
                                        calculationVars[v.key] = val ? Number(val.replace(/\./g, '').replace(',', '.')) : 0;
                                    });
                                    if (!allFilled) return 'â€”';
                                    const result = activeFormula.calculate(calculationVars);
                                    return isNaN(result) ? 'Erro' : result.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                                })()}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowFormulaCalc(false)}
                                className="btn btn-secondary"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => {
                                    if (!activeFormula) return;
                                    const inputVars: Record<string, string> = {};
                                    const calculationVars: Record<string, number> = {};
                                    let allFilled = true;

                                    activeFormula.variables.forEach(v => {
                                        const val = formulaVars[v.key];
                                        if (!val) allFilled = false;
                                        inputVars[v.key] = val || '';
                                        calculationVars[v.key] = val ? Number(val.replace(/\./g, '').replace(',', '.')) : 0;
                                    });

                                    const result = activeFormula.calculate(calculationVars);

                                    if (!isNaN(result)) {
                                        if (!auxDescription.trim()) {
                                            alert('Por favor, informe um Nome para a Variável Auxiliar (ex: Pilar P1).');
                                            return;
                                        }

                                        const valStr = result.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

                                        if (editingColumnId) {
                                            setColumnConfig(prev => prev.map(c => {
                                                if (c.id === editingColumnId) {
                                                    return {
                                                        ...c,
                                                        label: auxDescription,
                                                        formulaData: {
                                                            formulaId: activeFormula!.id,
                                                            inputVars
                                                        }
                                                    };
                                                }
                                                return c;
                                            }));
                                            setFormulaVars(prev => ({ ...prev, [editingColumnId]: valStr }));
                                        } else {
                                            const newId = `custom_aux_${Date.now()}`;
                                            const newCol: ColumnDef = {
                                                id: newId,
                                                label: auxDescription,
                                                visible: true,
                                                isAuxiliary: true,
                                                formulaData: {
                                                    formulaId: activeFormula!.id,
                                                    inputVars
                                                }
                                            };
                                            setColumnConfig(prev => [...prev, newCol]);
                                            setFormulaVars(prev => ({ ...prev, [newId]: valStr }));
                                        }

                                        setShowFormulaCalc(false);
                                        setEditingColumnId(null);
                                    }
                                }}
                                className="btn bg-emerald-600 text-gray-900 hover:bg-emerald-700 font-bold"
                            >
                                {editingColumnId ? 'Salvar Alteração' : 'Adicionar Auxiliar'}
                            </button>
                        </div>
                    </div>
                )}
            </DraggableModal>

            {/* Distance Calculator Modal */}
            {showDistanceCalculator && (
                <DistanceCalculatorModal
                    show={showDistanceCalculator}
                    onClose={() => setShowDistanceCalculator(false)}
                    onDistanceCalculated={(distanceKm, origin, destination) => {
                        // Add as linked variable with route info
                        const newVar = {
                            id: `route_${Date.now()}`,
                            label: 'Distância de Transporte',
                            value: distanceKm,
                            itemName: `${origin.split(',')[0]} â†’ ${destination.split(',')[0]}`,
                            sourceBM: 'Maps',
                            property: 'Distância',
                            unit: 'km',
                            line: undefined
                        };
                        setLinkedVariables(prev => [...prev, newVar]);

                        // Also set description with route info
                        setDescription(prev => {
                            const routeInfo = `Transporte: ${origin.split(',')[0]} â†’ ${destination.split(',')[0]} (${distanceKm.toFixed(2)} km)`;
                            return prev ? `${prev} | ${routeInfo}` : routeInfo;
                        });
                    }}
                />
            )}

        </DraggableModal >
    );
}



