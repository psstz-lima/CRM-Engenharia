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

    const displayItems = showOnlyModified
         items.filter((item: any) =>
            item.isSuppressed ||
            item.isAddedByAddendum ||
            item.variation.quantity !== 0 ||
            item.variation.value !== 0
        )
        : items;

    const quantityCols = 1 + addendums.length + 1;
    const valueCols = 1 + addendums.length + 1;

    return (
        <div className="bg-white/70 border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="m-0 text-base font-semibold text-gray-800">QQP - Quadro de Quantidades e Preços</h3>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={showOnlyModified}
                            onChange={e => setShowOnlyModified(e.target.checked)}
                        />
                        Apenas alterados
                    </label>
                    <button
                        onClick={loadVigentItems}
                        className="btn btn-xs btn-secondary"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            {addendums.length === 0 && (
                <div className="bg-[#f6efe4] border border-[#e5dccf] text-sm text-gray-700 rounded-lg px-3 py-2 mb-4">
                    Nenhum aditivo aprovado. Aprove aditivos para ver a comparação completa.
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[1000px]">
                    <thead>
                        <tr className="bg-[#f6efe4] text-gray-700">
                            <th className="p-2 text-left border border-gray-300">Ref.</th>
                            <th className="p-2 text-left border border-gray-300">Código</th>
                            <th className="p-2 text-left border border-gray-300 min-w-[180px]">Serviço</th>
                            <th className="p-2 text-center border border-gray-300">Un</th>
                            <th className="p-2 text-right border border-gray-300">Valor Unit.</th>
                            <th colSpan={quantityCols} className="p-2 text-center border border-gray-300">Quantidade</th>
                            <th colSpan={valueCols} className="p-2 text-center border border-gray-300">Valor</th>
                        </tr>
                        <tr className="bg-[#f6efe4] text-gray-600">
                            <th className="p-2 border border-gray-300"></th>
                            <th className="p-2 border border-gray-300"></th>
                            <th className="p-2 border border-gray-300"></th>
                            <th className="p-2 border border-gray-300"></th>
                            <th className="p-2 border border-gray-300"></th>
                            <th className="p-2 text-right border border-gray-300">Contrato</th>
                            {addendums.map((add: any) => (
                                <th key={`qty-${add.id}`} className="p-2 text-right border border-gray-300">
                                    {add.number}º Aditivo
                                </th>
                            ))}
                            <th className="p-2 text-right border border-gray-300 font-semibold">Total</th>
                            <th className="p-2 text-right border border-gray-300">Contrato</th>
                            {addendums.map((add: any) => (
                                <th key={`val-${add.id}`} className="p-2 text-right border border-gray-300">
                                    {add.number}º Aditivo
                                </th>
                            ))}
                            <th className="p-2 text-right border border-gray-300 font-semibold">Total</th>
                        </tr>
                        {addendums.length > 0 && (
                            <tr className="bg-[#f6efe4] text-gray-500">
                                <th colSpan={5} className="p-2 border border-gray-300"></th>
                                <th className="p-2 text-right border border-gray-300">-</th>
                                {addendums.map((add: any) => (
                                    <th key={`date-qty-${add.id}`} className="p-2 text-right border border-gray-300">
                                        {new Date(add.date).toLocaleDateString('pt-BR')}
                                    </th>
                                ))}
                                <th className="p-2 border border-gray-300"></th>
                                <th className="p-2 text-right border border-gray-300">-</th>
                                {addendums.map((add: any) => (
                                    <th key={`date-val-${add.id}`} className="p-2 text-right border border-gray-300">
                                        {new Date(add.date).toLocaleDateString('pt-BR')}
                                    </th>
                                ))}
                                <th className="p-2 border border-gray-300"></th>
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
                                 '#fbf7f0'
                                : item.isSuppressed
                                     '#fdf4f4'
                                    : item.isAddedByAddendum
                                         '#f3fbf5'
                                        : (idx % 2 === 0  '#ffffff' : '#fcfaf6');

                            const getAddendumQuantityDelta = (addendumId: string) => {
                                const historyEntry = item.history.find((h: any) => h.addendumId === addendumId);
                                if (!historyEntry) return null;
                                const historyIndex = item.history.findIndex((h: any) => h.addendumId === addendumId);
                                const prevEntry = historyIndex > 0  item.history[historyIndex - 1] : null;
                                const prevQty = prevEntry  prevEntry.quantity : baseQty;
                                return historyEntry.quantity - prevQty;
                            };

                            const getAddendumValueDelta = (addendumId: string) => {
                                const historyEntry = item.history.find((h: any) => h.addendumId === addendumId);
                                if (!historyEntry) return null;
                                const historyIndex = item.history.findIndex((h: any) => h.addendumId === addendumId);
                                const prevEntry = historyIndex > 0  item.history[historyIndex - 1] : null;
                                const prevValue = prevEntry  prevEntry.totalValue : baseValue;
                                return historyEntry.totalValue - prevValue;
                            };

                            return (
                                <tr key={item.id} style={{ background: rowBg }}>
                                    <td className="p-2 border border-gray-300 text-left font-medium text-gray-700">
                                        {item.code.split('.')[0] || '-'}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-left text-gray-700">
                                        {item.code || '-'}
                                        {item.isSuppressed && <span className="ml-1 text-red-600">x</span>}
                                        {item.isAddedByAddendum && <span className="ml-1 text-emerald-600">+</span>}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-left text-gray-700 max-w-[200px] truncate" title={item.description}>
                                        {item.description}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-center text-gray-600">
                                        {isContainer  '' : item.unit}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-right text-gray-700">
                                        {isContainer  '' : formatCurrency(basePrice)}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-right text-gray-700">
                                        {isContainer  '' : item.isAddedByAddendum  '-' : formatNumber(baseQty)}
                                    </td>
                                    {addendums.map((add: any) => {
                                        const delta = getAddendumQuantityDelta(add.id);
                                        return (
                                            <td key={`qty-${add.id}`} className="p-2 border border-gray-300 text-right">
                                                {isContainer  '' : delta !== null  (
                                                    <span className={delta > 0  'text-emerald-700' : delta < 0  'text-red-600' : 'text-gray-400'}>
                                                        {delta > 0  '+' : ''}{formatNumber(delta)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border border-gray-300 text-right font-semibold text-gray-700">
                                        {isContainer  '' : item.isSuppressed  <span className="text-red-600">0</span> : formatNumber(item.vigentQuantity)}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-right text-gray-700">
                                        {isContainer  formatCurrency(baseValue) : item.isAddedByAddendum  '-' : formatCurrency(baseValue)}
                                    </td>
                                    {addendums.map((add: any) => {
                                        const delta = getAddendumValueDelta(add.id);
                                        return (
                                            <td key={`val-${add.id}`} className="p-2 border border-gray-300 text-right">
                                                {delta !== null  (
                                                    <span className={delta > 0  'text-emerald-700' : delta < 0  'text-red-600' : 'text-gray-400'}>
                                                        {delta > 0  '+' : ''}{formatCurrency(delta)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border border-gray-300 text-right font-semibold text-gray-700">
                                        {item.isSuppressed  <span className="text-red-600">R$ 0,00</span> : formatCurrency(item.vigentTotalValue || 0)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-[#f6efe4] text-gray-700 font-semibold">
                            <td colSpan={5} className="p-2 border border-gray-300">Totais</td>
                            <td className="p-2 border border-gray-300 text-right">
                                {formatNumber(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0))}
                            </td>
                            {addendums.map((add: any) => (
                                <td key={`tot-qty-${add.id}`} className="p-2 border border-gray-300 text-right">-</td>
                            ))}
                            <td className="p-2 border border-gray-300 text-right">
                                {formatNumber(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((sum: number, i: any) => sum + (Number(i.vigentQuantity) || 0), 0))}
                            </td>
                            <td className="p-2 border border-gray-300 text-right">
                                {formatCurrency(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isAddedByAddendum).reduce((sum: number, i: any) => sum + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0))}
                            </td>
                            {addendums.map((add: any) => (
                                <td key={`tot-val-${add.id}`} className="p-2 border border-gray-300 text-right">
                                    <span className={Number(add.netValue) >= 0  'text-emerald-700' : 'text-red-600'}>
                                        {Number(add.netValue) > 0  '+' : ''}{formatCurrency(Number(add.netValue))}
                                    </span>
                                </td>
                            ))}
                            <td className="p-2 border border-gray-300 text-right">
                                {formatCurrency(displayItems.filter((i: any) => i.type === 'ITEM' && !i.isSuppressed).reduce((sum: number, i: any) => sum + (Number(i.vigentTotalValue) || 0), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-600">
                <span><span className="text-red-600">x</span> Item suprimido</span>
                <span><span className="text-emerald-600">+</span> Item adicionado por aditivo</span>
                <span className="text-emerald-700">+ Acréscimo</span>
                <span className="text-red-600">- Supressão</span>
            </div>
        </div>
    );
}
