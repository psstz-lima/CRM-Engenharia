import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CalculationMemoryModal } from '../components/modals/CalculationMemoryModal';
import { PhotoGalleryModal } from '../components/modals/PhotoGalleryModal';

export function MeasurementDetails() {
    const { id } = useParams(); // Measurement ID
    const navigate = useNavigate();

    const [measurement, setMeasurement] = useState<any>(null);
    const [contract, setContract] = useState<any>(null);
    const [balances, setBalances] = useState<Record<string, { measured: number; vigent: number; vigentPrice: number; balance: number; isSuppressed: boolean }>>({});
    const [loading, setLoading] = useState(true);

    // Local state for inputs to avoid lag, but saved on blur
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [activeCalcItem, setActiveCalcItem] = useState<any>(null);
    const [activePhotoItem, setActivePhotoItem] = useState<any>(null);

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
    const collapseAll = (items: any[]) => {
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

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            // 1. Get Measurement details (includes currently measured items)
            const measRes = await api.get(`/contracts/measurements/${id}`);
            const measData = measRes.data;
            setMeasurement(measData);

            // 2. Get Contract Details (for full item tree)
            const contractRes = await api.get(`/contracts/${measData.contractId}`);
            setContract(contractRes.data);

            // 3. Get Previous Balances
            const balancesRes = await api.get(`/contracts/measurements/${id}/balances`);
            setBalances(balancesRes.data);

            // Init input values from existing measurement items
            const inputs: Record<string, string> = {};
            measData.items.forEach((item: any) => {
                const val = item.measuredQuantity;
                inputs[item.contractItemId] = (val !== null && val !== undefined)
                    ? Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                    : '';
            });
            setInputValues(inputs);

        } catch (err) {
            console.error(err);
            alert('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveItem(itemId: string, value: string) {
        if (!value) return;
        try {
            // Parse pt-BR format (1.000,00 -> 1000.00)
            const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));

            await api.post(`/contracts/measurements/${id}/items`, {
                contractItemId: itemId,
                quantity: numericValue
            });

            // Format back to ensure consistency on UI
            setInputValues(prev => ({
                ...prev,
                [itemId]: numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
            }));

            // Reload balances/data to ensure consistency? 
            // Or just update local state implied 'saved' status.
            // For now, let's just keep going.
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar medição do item');
            // Revert value?
        }
    }

    async function handleClose() {
        if (!confirm('Confirma o fechamento da medição? Não será possível alterar depois.')) return;
        try {
            await api.post(`/contracts/measurements/${id}/close`);
            alert('Medição Fechada!');
            loadData();
        } catch (err: any) {
            alert('Erro ao fechar medição');
        }
    }

    // Flatten Items into a list with depth for rendering hierarchy (respects collapsed groups)
    function flattenTree(items: any[], depth = 0, result: any[] = []): any[] {
        items.forEach(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isCollapsed = collapsedGroups.has(item.id);
            result.push({ ...item, depth, hasChildren, isCollapsed });
            if (hasChildren && !isCollapsed) {
                flattenTree(item.children, depth + 1, result);
            }
        });
        return result;
    }

    if (loading) return <div>Carregando...</div>;
    if (!measurement || !contract) return <div>Dados não encontrados</div>;

    const flatItems = flattenTree(contract.items || []);
    const isClosed = measurement.status === 'CLOSED';

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                        <Link to="/measurements" style={{ textDecoration: 'none', color: '#666' }}>Módulo Medições</Link>
                        {' > '}
                        <Link to={`/contracts/${contract.id}/measurements`} style={{ textDecoration: 'none', color: '#666' }}>Contrato {contract?.number}</Link>
                        {' > '}
                        <span>Medição {measurement.number}</span>
                    </div>
                    <Link to={`/contracts/${contract.id}/measurements`} style={{ textDecoration: 'none', color: '#2563eb', display: 'block', marginBottom: '10px' }}>&larr; Voltar para Lista</Link>
                    <h2>Medição Nº {measurement.number}</h2>
                    <p>Status: <strong>{measurement.status}</strong></p>
                    <p>Período: {new Date(measurement.periodStart).toLocaleDateString()} a {new Date(measurement.periodEnd).toLocaleDateString()}</p>
                </div>
                {!isClosed && (
                    <div>
                        <button onClick={handleClose} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Encerrar Medição</button>
                    </div>
                )}
            </div>

            {/* Search Filter Box */}
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="🔍 Filtrar por código ou descrição..."
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '10px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95em',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                {searchFilter && (
                    <button
                        onClick={() => setSearchFilter('')}
                        style={{
                            marginLeft: '10px',
                            padding: '8px 15px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9em'
                        }}
                    >
                        ✕ Limpar
                    </button>
                )}

                {/* Expand/Collapse All Buttons */}
                <div style={{ marginLeft: '20px', display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: '#666', marginRight: '5px' }}>Agrupamento:</span>
                    <button
                        onClick={expandAll}
                        title="Expandir Todos"
                        style={{
                            padding: '6px 12px',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            border: '1px solid #7dd3fc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            fontWeight: '500'
                        }}
                    >
                        ➕ Expandir
                    </button>
                    <button
                        onClick={() => collapseAll(contract.items || [])}
                        title="Recolher Todos"
                        style={{
                            padding: '6px 12px',
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fcd34d',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            fontWeight: '500'
                        }}
                    >
                        ➖ Recolher
                    </button>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '10px' }}>Estrutura</th>
                            <th style={{ padding: '10px' }}>Descrição</th>
                            <th style={{ padding: '10px' }}>Unid.</th>
                            <th style={{ padding: '10px', background: '#e0f2fe' }}>Qtd. Vigente</th>
                            <th style={{ padding: '10px', background: '#fef3c7' }}>Acum. Anterior</th>
                            <th style={{ padding: '10px', background: '#dcfce7' }}>Saldo Atual</th>
                            <th style={{ padding: '10px', borderLeft: '2px solid #ddd' }}>A Medir (Atual)</th>
                            <th style={{ padding: '10px' }}>% Atual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flatItems.filter(item => {
                            if (!searchFilter.trim()) return true;
                            const search = searchFilter.toLowerCase();
                            const matchesCode = item.code?.toLowerCase().includes(search);
                            const matchesDescription = item.description?.toLowerCase().includes(search);
                            return matchesCode || matchesDescription;
                        }).map(item => {
                            const isGroup = item.type !== 'ITEM';
                            const paddingLeft = 10 + (item.depth * 20); // Indentation

                            if (isGroup) {
                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: '#f9fafb' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                            {item.hasChildren && (
                                                <button
                                                    onClick={() => toggleCollapse(item.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        marginRight: '5px',
                                                        fontSize: '0.9em',
                                                        color: '#6b7280',
                                                        padding: '2px 5px'
                                                    }}
                                                    title={item.isCollapsed ? 'Expandir' : 'Recolher'}
                                                >
                                                    {item.isCollapsed ? '▶' : '▼'}
                                                </button>
                                            )}
                                            {item.code || ''}
                                        </td>
                                        <td style={{ padding: '10px', paddingLeft: `${paddingLeft}px`, fontWeight: 'bold' }}>{item.description}</td>
                                        <td colSpan={6}></td>
                                    </tr>
                                );
                            }

                            const itemBalance = balances[item.id];
                            const vigentQty = itemBalance?.vigent ?? Number(item.quantity);
                            const prevAccum = itemBalance?.measured ?? 0;
                            const balance = itemBalance?.balance ?? (vigentQty - prevAccum);
                            const isSuppressed = itemBalance?.isSuppressed ?? false;

                            const val = inputValues[item.id] ?? '';
                            // Parse for calculation/comparison
                            const numericVal = val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;
                            const currentVal = !isNaN(numericVal) ? numericVal : 0;

                            const percentage = (vigentQty > 0 && balance > 0) ? (currentVal / vigentQty) * 100 : 0;

                            // Highlight logic
                            const isOver = currentVal > balance;

                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee', opacity: isSuppressed ? 0.5 : 1, textDecoration: isSuppressed ? 'line-through' : 'none' }}>
                                    <td style={{ padding: '10px' }}>{item.code}</td>
                                    <td style={{ padding: '10px', paddingLeft: `${paddingLeft}px`, maxWidth: '300px' }}>{item.description} {isSuppressed && <span title="Item suprimido por aditivo">🚫</span>}</td>
                                    <td style={{ padding: '10px' }}>{item.unit}</td>
                                    <td style={{ padding: '10px', background: '#f0f9ff' }}>{vigentQty.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                                    <td style={{ padding: '10px', background: '#fffbeb' }}>{prevAccum.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                                    <td style={{ padding: '10px', background: '#f0fdf4', fontWeight: 'bold' }}>{balance.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>

                                    <td style={{ padding: '10px', borderLeft: '2px solid #ddd' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input
                                                type="text"
                                                disabled={isClosed || (measurement.items.find((mi: any) => mi.contractItemId === item.id)?.memories?.length > 0)}
                                                value={val}
                                                onChange={e => {
                                                    // Allow only numbers, comma, dot
                                                    const v = e.target.value;
                                                    if (/^[\d.,]*$/.test(v)) {
                                                        setInputValues(prev => ({ ...prev, [item.id]: v }));
                                                    }
                                                }}
                                                onBlur={e => handleSaveItem(item.id, e.target.value)}
                                                placeholder="0,000"
                                                title={(measurement.items.find((mi: any) => mi.contractItemId === item.id)?.memories?.length > 0) ? "Calculado via Memória" : ""}
                                                style={{
                                                    width: '100px',
                                                    padding: '5px',
                                                    border: isOver ? '2px solid red' : '1px solid #ccc',
                                                    background: isOver ? '#fee2e2' : ((measurement.items.find((mi: any) => mi.contractItemId === item.id)?.memories?.length > 0) ? '#f3f4f6' : 'white'),
                                                    cursor: (measurement.items.find((mi: any) => mi.contractItemId === item.id)?.memories?.length > 0) ? 'not-allowed' : 'text',
                                                    textAlign: 'right'
                                                }}
                                            />
                                            <button
                                                onClick={() => setActiveCalcItem(item)}
                                                title="Memória de Cálculo"
                                                style={{
                                                    background: '#2563eb',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    width: '28px',
                                                    height: '28px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                CALC
                                            </button>
                                            <button
                                                onClick={() => setActivePhotoItem(item)}
                                                title="Fotos do Item"
                                                style={{
                                                    background: '#7c3aed',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    width: '28px',
                                                    height: '28px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1em'
                                                }}
                                            >
                                                📷
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>{percentage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {activeCalcItem && (
                <CalculationMemoryModal
                    show={true}
                    onClose={() => setActiveCalcItem(null)}
                    measurementId={measurement.id}
                    measurementNumber={measurement.number}
                    contractItemId={activeCalcItem.id}
                    itemName={activeCalcItem.description}
                    onUpdate={() => {
                        loadData();
                    }}
                    availableItems={flatItems}
                    balances={Object.fromEntries(Object.entries(balances).map(([k, v]) => [k, v?.balance ?? 0]))}
                    currentValues={inputValues}
                    measurementItems={measurement?.items}
                />
            )}

            {activePhotoItem && (
                <PhotoGalleryModal
                    show={true}
                    onClose={() => setActivePhotoItem(null)}
                    measurementId={measurement.id}
                    contractItemId={activePhotoItem.id}
                    itemName={activePhotoItem.description}
                    isClosed={isClosed}
                />
            )}
        </div>
    );
}
