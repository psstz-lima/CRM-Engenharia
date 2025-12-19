import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface AddendumComparisonProps {
    contractId: string;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value: number, decimals = 3) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

export function AddendumComparison({ contractId }: AddendumComparisonProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showOnlyModified, setShowOnlyModified] = useState(false);

    useEffect(() => {
        loadVigentItems();
    }, [contractId]);

    async function loadVigentItems() {
        setLoading(true);
        try {
            const { data } = await api.get(`/contracts/${contractId}/vigent-items`);
            setData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p>Carregando QQP...</p>;
    if (!data || !data.items) return <p>Sem dados para exibir</p>;

    const { items, addendums } = data;

    // Filter items if needed
    const displayItems = showOnlyModified
        ? items.filter((item: any) =>
            item.isSuppressed ||
            item.isAddedByAddendum ||
            item.variation?.quantity !== 0 ||
            item.variation?.value !== 0
        )
        : items;

    // Calculate how many quantity and value columns we need
    // Base + each addendum + Total
    const quantityCols = 1 + addendums.length + 1; // Base + Aditivos + Total
    const valueCols = 1 + addendums.length + 1;

    return (
        <div style={{ marginTop: '20px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>📊 QQP - Quadro de Quantidades e Preços</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9em' }}>
                        <input
                            type="checkbox"
                            checked={showOnlyModified}
                            onChange={e => setShowOnlyModified(e.target.checked)}
                        />
                        Apenas alterados
                    </label>
                    <button
                        onClick={loadVigentItems}
                        style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em' }}
                    >
                        🔄 Atualizar
                    </button>
                </div>
            </div>

            {addendums.length === 0 && (
                <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9em' }}>
                    ℹ️ Nenhum aditivo aprovado. Aprove aditivos para ver a comparação completa.
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em', minWidth: '1000px' }}>
                    {/* Header Row 1: Main groups */}
                    <thead>
                        <tr style={{ background: '#1f2937', color: 'white' }}>
                            <th style={{ padding: '8px 6px', textAlign: 'left', borderRight: '1px solid #374151' }}>Ref.</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', borderRight: '1px solid #374151' }}>Código</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', borderRight: '1px solid #374151', minWidth: '180px' }}>Serviço</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #374151' }}>Un</th>
                            <th style={{ padding: '8px 6px', textAlign: 'right', borderRight: '2px solid #0ea5e9' }}>Valor Unit.</th>

                            {/* Quantidade Group */}
                            <th colSpan={quantityCols} style={{ padding: '8px 6px', textAlign: 'center', background: '#0ea5e9', borderRight: '2px solid #22c55e' }}>
                                📊 QUANTIDADE
                            </th>

                            {/* Valor Group */}
                            <th colSpan={valueCols} style={{ padding: '8px 6px', textAlign: 'center', background: '#22c55e' }}>
                                💰 VALOR
                            </th>
                        </tr>

                        {/* Header Row 2: Sub-columns */}
                        <tr style={{ background: '#374151', color: 'white', fontSize: '0.9em' }}>
                            <th style={{ padding: '6px', borderRight: '1px solid #4b5563' }}></th>
                            <th style={{ padding: '6px', borderRight: '1px solid #4b5563' }}></th>
                            <th style={{ padding: '6px', borderRight: '1px solid #4b5563' }}></th>
                            <th style={{ padding: '6px', borderRight: '1px solid #4b5563' }}></th>
                            <th style={{ padding: '6px', borderRight: '2px solid #0ea5e9' }}></th>

                            {/* Quantidade sub-headers */}
                            <th style={{ padding: '6px', textAlign: 'right', background: '#0284c7', borderRight: '1px solid #0369a1' }}>Contrato</th>
                            {addendums.map((add: any) => (
                                <th key={`qty-${add.id}`} style={{ padding: '6px', textAlign: 'right', background: '#0284c7', borderRight: '1px solid #0369a1' }}>
                                    {add.number}º Aditivo
                                </th>
                            ))}
                            <th style={{ padding: '6px', textAlign: 'right', background: '#075985', fontWeight: 'bold', borderRight: '2px solid #22c55e' }}>Total</th>

                            {/* Valor sub-headers */}
                            <th style={{ padding: '6px', textAlign: 'right', background: '#16a34a', borderRight: '1px solid #15803d' }}>Contrato</th>
                            {addendums.map((add: any) => (
                                <th key={`val-${add.id}`} style={{ padding: '6px', textAlign: 'right', background: '#16a34a', borderRight: '1px solid #15803d' }}>
                                    {add.number}º Aditivo
                                </th>
                            ))}
                            <th style={{ padding: '6px', textAlign: 'right', background: '#166534', fontWeight: 'bold' }}>Total</th>
                        </tr>

                        {/* Header Row 3: Dates */}
                        {addendums.length > 0 && (
                            <tr style={{ background: '#e5e7eb', fontSize: '0.75em', color: '#6b7280' }}>
                                <th colSpan={5} style={{ borderRight: '2px solid #0ea5e9' }}></th>

                                {/* Quantity dates */}
                                <th style={{ padding: '4px', textAlign: 'right', borderRight: '1px solid #d1d5db' }}>-</th>
                                {addendums.map((add: any) => (
                                    <th key={`date-qty-${add.id}`} style={{ padding: '4px', textAlign: 'right', borderRight: '1px solid #d1d5db' }}>
                                        {new Date(add.date).toLocaleDateString('pt-BR')}
                                    </th>
                                ))}
                                <th style={{ padding: '4px', borderRight: '2px solid #22c55e' }}></th>

                                {/* Value dates */}
                                <th style={{ padding: '4px', textAlign: 'right', borderRight: '1px solid #d1d5db' }}>-</th>
                                {addendums.map((add: any) => (
                                    <th key={`date-val-${add.id}`} style={{ padding: '4px', textAlign: 'right', borderRight: '1px solid #d1d5db' }}>
                                        {new Date(add.date).toLocaleDateString('pt-BR')}
                                    </th>
                                ))}
                                <th></th>
                            </tr>
                        )}
                    </thead>

                    <tbody>
                        {displayItems.map((item: any, idx: number) => {
                            const baseQty = Number(item.quantity) || 0;
                            const basePrice = Number(item.unitPrice) || 0;
                            const baseValue = baseQty * basePrice;

                            const isContainer = item.type !== 'ITEM';
                            const rowBg = isContainer
                                ? '#f0f9ff'
                                : item.isSuppressed
                                    ? '#fef2f2'
                                    : item.isAddedByAddendum
                                        ? '#f0fdf4'
                                        : (idx % 2 === 0 ? '#fff' : '#f9fafb');

                            // Calculate quantity delta per addendum
                            const getAddendumQuantityDelta = (addendumId: string) => {
                                const historyEntry = item.history?.find((h: any) => h.addendumId === addendumId);
                                if (!historyEntry) return null;

                                // Find previous quantity (from previous history entry or base)
                                const historyIndex = item.history?.findIndex((h: any) => h.addendumId === addendumId);
                                const prevEntry = historyIndex > 0 ? item.history[historyIndex - 1] : null;
                                const prevQty = prevEntry ? prevEntry.quantity : baseQty;

                                return historyEntry.quantity - prevQty;
                            };

                            // Calculate value delta per addendum
                            const getAddendumValueDelta = (addendumId: string) => {
                                const historyEntry = item.history?.find((h: any) => h.addendumId === addendumId);
                                if (!historyEntry) return null;

                                const historyIndex = item.history?.findIndex((h: any) => h.addendumId === addendumId);
                                const prevEntry = historyIndex > 0 ? item.history[historyIndex - 1] : null;
                                const prevValue = prevEntry ? prevEntry.totalValue : baseValue;

                                return historyEntry.totalValue - prevValue;
                            };

                            return (
                                <tr key={item.id} style={{ background: rowBg }}>
                                    {/* Reference */}
                                    <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: isContainer ? 'bold' : 'normal', color: isContainer ? '#1e40af' : 'inherit' }}>
                                        {item.code?.split('.')[0] || '-'}
                                    </td>

                                    {/* Code */}
                                    <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                                        {item.code || '-'}
                                        {item.isSuppressed && <span style={{ color: '#dc2626', marginLeft: '3px' }}>🚫</span>}
                                        {item.isAddedByAddendum && <span style={{ color: '#16a34a', marginLeft: '3px' }}>➕</span>}
                                    </td>

                                    {/* Service Description */}
                                    <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: isContainer ? 'bold' : 'normal', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                                        {item.description}
                                    </td>

                                    {/* Unit */}
                                    <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                                        {isContainer ? '' : item.unit}
                                    </td>

                                    {/* Unit Price */}
                                    <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', borderRight: '2px solid #0ea5e9' }}>
                                        {isContainer ? '' : formatCurrency(basePrice)}
                                    </td>

                                    {/* QUANTITY SECTION */}
                                    {/* Base Quantity */}
                                    <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #bfdbfe', background: '#eff6ff' }}>
                                        {isContainer ? '' : item.isAddedByAddendum ? '-' : formatNumber(baseQty)}
                                    </td>

                                    {/* Addendum Quantities (deltas) */}
                                    {addendums.map((add: any) => {
                                        const delta = getAddendumQuantityDelta(add.id);
                                        return (
                                            <td key={`qty-${add.id}`} style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #bfdbfe', background: '#f0f9ff' }}>
                                                {isContainer ? '' : delta !== null ? (
                                                    <span style={{ color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#9ca3af' }}>
                                                        {delta > 0 ? '+' : ''}{formatNumber(delta)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        );
                                    })}

                                    {/* Total Quantity */}
                                    <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', borderRight: '2px solid #22c55e', background: '#dbeafe', fontWeight: 'bold' }}>
                                        {isContainer ? '' : item.isSuppressed ? <span style={{ color: '#dc2626' }}>0</span> : formatNumber(item.vigentQuantity)}
                                    </td>

                                    {/* VALUE SECTION */}
                                    {/* Base Value */}
                                    <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                                        {isContainer ? formatCurrency(baseValue) : item.isAddedByAddendum ? '-' : formatCurrency(baseValue)}
                                    </td>

                                    {/* Addendum Values (deltas) */}
                                    {addendums.map((add: any) => {
                                        const delta = getAddendumValueDelta(add.id);
                                        return (
                                            <td key={`val-${add.id}`} style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                                                {delta !== null ? (
                                                    <span style={{ color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#9ca3af' }}>
                                                        {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        );
                                    })}

                                    {/* Total Value */}
                                    <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', background: '#dcfce7', fontWeight: 'bold' }}>
                                        {item.isSuppressed ? <span style={{ color: '#dc2626' }}>R$ 0,00</span> : formatCurrency(item.vigentTotalValue || 0)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                    {/* Footer Totals */}
                    <tfoot>
                        <tr style={{ background: '#1f2937', color: 'white', fontWeight: 'bold' }}>
                            <td colSpan={5} style={{ padding: '10px 6px', borderRight: '2px solid #0ea5e9' }}>TOTAIS</td>

                            {/* Quantity totals */}
                            <td style={{ padding: '10px 6px', textAlign: 'right', borderRight: '1px solid #374151' }}>
                                {formatNumber(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0))}
                            </td>
                            {addendums.map((add: any) => (
                                <td key={`tot-qty-${add.id}`} style={{ padding: '10px 6px', textAlign: 'right', borderRight: '1px solid #374151' }}>
                                    -
                                </td>
                            ))}
                            <td style={{ padding: '10px 6px', textAlign: 'right', borderRight: '2px solid #22c55e' }}>
                                {formatNumber(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((sum: number, i: any) => sum + (Number(i.vigentQuantity) || 0), 0))}
                            </td>

                            {/* Value totals */}
                            <td style={{ padding: '10px 6px', textAlign: 'right', borderRight: '1px solid #374151' }}>
                                {formatCurrency(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((sum: number, i: any) => sum + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0))}
                            </td>
                            {addendums.map((add: any) => (
                                <td key={`tot-val-${add.id}`} style={{ padding: '10px 6px', textAlign: 'right', borderRight: '1px solid #374151' }}>
                                    <span style={{ color: Number(add.netValue) >= 0 ? '#86efac' : '#fca5a5' }}>
                                        {Number(add.netValue) > 0 ? '+' : ''}{formatCurrency(Number(add.netValue))}
                                    </span>
                                </td>
                            ))}
                            <td style={{ padding: '10px 6px', textAlign: 'right', fontSize: '1.1em' }}>
                                {formatCurrency(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((sum: number, i: any) => sum + (Number(i.vigentTotalValue) || 0), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Legend */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '15px', fontSize: '0.75em', color: '#6b7280' }}>
                <span>🚫 Item suprimido</span>
                <span>➕ Item adicionado por aditivo</span>
                <span style={{ color: '#16a34a' }}>+ Acréscimo</span>
                <span style={{ color: '#dc2626' }}>- Supressão</span>
            </div>
        </div>
    );
}
