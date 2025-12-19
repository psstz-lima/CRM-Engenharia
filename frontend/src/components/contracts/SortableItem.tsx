import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface SortableItemProps {
    item: any;
    level: number;
    typeLabels: Record<string, string>;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onCreateChild: (item: any) => void;
    renderChildren?: (children: any[], level: number) => React.ReactNode;
}

export function SortableItem({ item, level, typeLabels, onEdit, onDelete, onCreateChild, renderChildren }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const paddingLeft = level * 20 + 'px';
    const isLeaf = item.type === 'ITEM';

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                }}
                style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '10px', background: isLeaf ? '#fff' : '#f8f9fa', alignItems: 'center', cursor: 'pointer' }}
            >

                {/* Drag Handle */}
                <div
                    {...listeners}
                    style={{ cursor: 'grab', marginRight: '8px', color: '#ccc', userSelect: 'none' }}
                    title="Arraste para mover"
                >
                    ⋮⋮
                </div>

                <div style={{ flex: 0.8, fontWeight: 'bold' }}>
                    {item.code}
                </div>
                <div style={{ flex: 0.8, color: '#666', fontSize: '0.9em' }}>
                    {typeLabels[item.type] || item.type}
                </div>
                <div style={{ flex: 3, paddingLeft }}>
                    {item.description}
                </div>
                {isLeaf && (
                    <>
                        <div style={{ flex: 1 }}>{item.unit}</div>
                        <div style={{ flex: 1 }}>{Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                        <div style={{ flex: 1 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}</div>
                        <div style={{ flex: 1 }}><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValue)}</strong></div>
                    </>
                )}
                {!isLeaf && <div style={{ flex: 4 }}></div>}

                <div style={{ flex: 1, display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                    {!isLeaf && (
                        <button onClick={() => onCreateChild(item)} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '4px' }}>+ Filho</button>
                    )}
                    <button onClick={() => onEdit(item)} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px' }}>Editar</button>
                    <button onClick={() => onDelete(item.id)} style={{ fontSize: '10px', padding: '2px 5px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                </div>
            </div>

            {/* Render Children in a nested SortableContext */}
            {item.children && item.children.length > 0 && (
                <div style={{ marginLeft: '0' }}>
                    <SortableContext
                        items={item.children.map((c: any) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {renderChildren && renderChildren(item.children, level + 1)}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}
