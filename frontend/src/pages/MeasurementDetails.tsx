import { useState, useEffect } from 'react';

import { useParams, Link, useNavigate } from 'react-router-dom';

import api from '../services/api';

import { CalculationMemoryModal } from '../components/modals/CalculationMemoryModal';

import { PhotoGalleryModal } from '../components/modals/PhotoGalleryModal';

import { CommentSection } from '../components/common/CommentSection';

import { ApprovalPanel } from '../components/common/ApprovalPanel';

import { WorkflowSteps } from '../components/measurements/WorkflowSteps';

import { PageHeader } from '../components/ui/PageHeader';

import { Card } from '../components/ui/Card';

import { useAuth } from '../contexts/AuthContext';

import { FavoriteToggle } from '../components/common/FavoriteToggle';

import { AttachmentList } from '../components/common/AttachmentList';

import { Ruler, Calculator, Camera, Search, ChevronDown, ChevronRight, Plus, Minus, ArrowLeft, Lock, Unlock, AlertCircle, MessageSquare, CheckCircle, RotateCcw, History, Download, Paperclip } from 'lucide-react';

import { ExportButton } from '../components/ui/ExportButton';



export function MeasurementDetails() {

    const { id } = useParams(); // Measurement ID

    const navigate = useNavigate();

    const { user } = useAuth();



    // Tabs for comments/approval section

    const [activeTab, setActiveTab] = useState<'comments' | 'approval' | 'revisions' | 'attachments'>('approval');



    // Reopen modal state

    const [showReopenModal, setShowReopenModal] = useState(false);

    const [reopenReason, setReopenReason] = useState('');



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

            // 1. Get Measurement details

            const measRes = await api.get(`/contracts/measurements/${id}`);

            const measData = measRes.data;

            setMeasurement(measData);



            // 2. Get Contract Details

            const contractRes = await api.get(`/contracts/${measData.contractId}`);

            setContract(contractRes.data);



            // 3. Get Previous Balances

            const balancesRes = await api.get(`/contracts/measurements/${id}/balances`);

            setBalances(balancesRes.data);



            // Init input values

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

            console.error('Erro ao carregar dados'); // Switched alert to console error for less intrusion

        } finally {

            setLoading(false);

        }

    }



    async function handleSaveItem(itemId: string, value: string) {

        if (!value) return;

        try {

            const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));

            await api.post(`/contracts/measurements/${id}/items`, {

                contractItemId: itemId,

                quantity: numericValue

            });



            setInputValues(prev => ({

                ...prev,

                [itemId]: numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

            }));

        } catch (err: any) {

            alert(err.response?.data?.error || 'Erro ao salvar medição do item');

        }

    }



    async function handleClose() {

        if (!confirm('Confirma o fechamento da medição? Não será possível alterar depois.')) return;

        try {

            await api.post(`/contracts/measurements/${id}/close`);

            loadData();

        } catch (err: any) {

            alert('Erro ao fechar medição');

        }

    }



    async function handleReopen() {

        if (!reopenReason.trim()) {

            alert('Informe o motivo da revisão');

            return;

        }

        try {

            await api.post(`/contracts/measurements/${id}/reopen`, { reason: reopenReason });

            setShowReopenModal(false);

            setReopenReason('');

            loadData();

            alert('Medição reaberta para revisão!');

        } catch (err: any) {

            alert(err.response?.data?.error || 'Erro ao reabrir medição');

        }

    }



    // Flatten Items into a list with depth for rendering hierarchy

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



    if (loading) return (

        <div className="flex items-center justify-center h-screen">

            <div className="flex flex-col items-center gap-2 text-gray-600">

                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>

                <p>Carregando planilha...</p>

            </div>

        </div>

    );



    if (!measurement || !contract) return (

        <div className="flex flex-col items-center justify-center h-screen text-gray-600 gap-4">

            <AlertCircle size={48} className="opacity-50" />

            <p>Dados não encontrados</p>

        </div>

    );



    const flatItems = flattenTree(contract.items || []);

    const isClosed = measurement.status === 'CLOSED';



    return (

        <div className="p-6 max-w-[1920px] mx-auto space-y-6">

            <PageHeader

                title={`Medição Nº ${measurement.number}`}

                subtitle={`Período: ${new Date(measurement.periodStart).toLocaleDateString()} a ${new Date(measurement.periodEnd).toLocaleDateString()}`}

                icon={<Ruler className="text-slate-700" />}

                breadcrumb={[

                    { label: 'Contratos', href: '/contracts' },

                    { label: 'Medições', href: `/contracts/${contract.id}/measurements` },

                    { label: `Detalhes` }

                ]}

                actions={

                    <div className="flex items-center gap-3">

                        <FavoriteToggle targetType="MEASUREMENT" targetId={measurement.id} />

                        <ExportButton type="measurement" id={measurement.id} label="Exportar" />

                        <Link to={`/contracts/${contract.id}/measurements`} className="btn bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 flex items-center gap-2">

                            <ArrowLeft size={16} />

                            Voltar

                        </Link>

                        {!isClosed ? (

                            <button onClick={handleClose} className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm flex items-center gap-2">

                                <Lock size={16} />

                                Encerrar Medição

                            </button>

                        ) : (

                            <>

                                <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">

                                    <Lock size={14} /> Medição Fechada

                                </span>

                                <button

                                    onClick={() => setShowReopenModal(true)}

                                    className="btn bg-amber-500 hover:bg-amber-400 text-gray-900 border-none shadow-lg shadow-amber-900/20 flex items-center gap-2"

                                >

                                    <RotateCcw size={16} />

                                    Reabrir para Revisão

                                </button>

                            </>

                        )}

                    </div>

                }

            />



            {/* Workflow Visual */}

            <Card className="p-4">

                <WorkflowSteps currentStatus={measurement.status} />

            </Card>



            {/* Toolbar */}

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">

                <div className="relative w-full max-w-md">

                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />

                    <input

                        type="text"

                        value={searchFilter}

                        onChange={(e) => setSearchFilter(e.target.value)}

                        placeholder="Filtrar por código ou descrição..."

                        className="input pl-10 w-full"

                    />

                    {searchFilter && (

                        <button

                            onClick={() => setSearchFilter('')}

                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"

                        >

                            ✕

                        </button>

                    )}

                </div>



                <div className="flex items-center gap-2">

                    <span className="text-sm text-gray-600 mr-2 font-medium">Visualização:</span>

                    <button onClick={expandAll} className="btn btn-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 flex items-center gap-1">

                        <Plus size={12} /> Expandir Tudo

                    </button>

                    <button onClick={() => collapseAll(contract.items || [])} className="btn btn-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 flex items-center gap-1">

                        <Minus size={12} /> Recolher

                    </button>

                </div>

            </div>



            <Card className="overflow-hidden border border-gray-200 shadow-md">

                <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

                    <table className="w-full text-left border-collapse text-sm">

                        <thead className="sticky top-0 z-10 text-gray-600 uppercase font-semibold text-xs border-b border-gray-300" style={{ backgroundColor: '#f6efe4' }}>

                            <tr>

                                <th className="p-3 w-20 border-r border-gray-300 text-center">Item</th>

                                <th className="p-3 min-w-[300px] border-r border-gray-300 text-center">Descrição</th>

                                <th className="p-3 text-center w-16 border-r border-gray-300">Un</th>

                                <th className="p-3 text-center border-l border-gray-300 border-r border-gray-300 text-blue-700">Qtd. Vigente</th>

                                <th className="p-3 text-center border-l border-gray-300 border-r border-gray-300 text-amber-700">Acum. Anterior</th>

                                <th className="p-3 text-center border-l border-gray-300 border-r border-gray-300 text-emerald-700">Saldo Atual</th>

                                <th className="p-3 text-center border-l border-r border-gray-300 w-48 text-amber-800 font-bold shadow-inner">A Medir (Atual)</th>

                                <th className="p-3 w-20 text-center">%</th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-200">

                            {flatItems.filter(item => {

                                if (!searchFilter.trim()) return true;

                                const search = searchFilter.toLowerCase();

                                const matchesCode = item.code?.toLowerCase().includes(search);

                                const matchesDescription = item.description?.toLowerCase().includes(search);

                                return matchesCode || matchesDescription;

                            }).map(item => {

                                const isGroup = item.type !== 'ITEM';

                                const paddingLeft = 12 + (item.depth * 24);



                                if (isGroup) {

                                    return (

                                        <tr key={item.id} className="bg-white text-gray-700 font-semibold text-xs hover:bg-amber-50/40 transition-colors">

                                        <td className="p-2 pl-4 whitespace-nowrap text-center border-r border-gray-200">

                                                {item.hasChildren && (

                                                    <button

                                                        onClick={() => toggleCollapse(item.id)}

                                                        className="mr-2 text-gray-500 hover:text-gray-800 focus:outline-none transition-colors"

                                                    >

                                                        {item.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}

                                                    </button>

                                                )}

                                                {item.code}

                                            </td>

                                        <td className="p-2 text-left" colSpan={7} style={{ paddingLeft: `${paddingLeft}px` }}>

                                                {item.description}

                                            </td>

                                        </tr>

                                    );

                                }



                                const itemBalance = balances[item.id];

                                const vigentQty = itemBalance?.vigent ? Number(item.quantity) : 0;

                                const prevAccum = itemBalance?.measured ? Number(itemBalance.measured) : 0;

                                const balance = itemBalance?.balance ? Number(itemBalance.balance) : (vigentQty - prevAccum);

                                const isSuppressed = itemBalance?.isSuppressed ? true : false;



                                const val = inputValues[item.id] ?? '';

                                const numericVal = val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;

                                const currentVal = !isNaN(numericVal) ? numericVal : 0;

                                const percentage = (vigentQty > 0 && balance > 0) ? (currentVal / vigentQty) * 100 : 0;

                                const isOver = currentVal > balance + 0.001; // tolerance

                                const hasMemory = measurement.items.find((mi: any) => mi.contractItemId === item.id)?.memories?.length > 0;



                                return (

                                    <tr key={item.id} className={`hover:bg-amber-50/40 transition-colors ${isSuppressed ? 'opacity-50 line-through decoration-red-500/50' : ''}`}>

                                        <td className="p-3 text-gray-600 font-mono text-center border-r border-gray-200 text-xs">{item.code}</td>

                                        <td className="p-3 text-gray-700 border-r border-gray-200 text-left">

                                            <div style={{ paddingLeft: `${item.depth * 20}px` }} className="flex items-center">

                                                <span className="truncate max-w-[400px]" title={item.description}>{item.description}</span>

                                                {isSuppressed && <span className="ml-2 text-red-500 text-xs px-1 rounded border border-red-500/30 font-bold">SUPRIMIDO</span>}

                                            </div>

                                        </td>

                                        <td className="p-3 text-center text-gray-700 border-r border-gray-200 text-xs">{item.unit}</td>



                                        <td className="p-3 text-center font-mono text-blue-700 border-r border-gray-200">

                                            {vigentQty.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}

                                        </td>

                                        <td className="p-3 text-center font-mono text-amber-700 border-r border-gray-200">

                                            {prevAccum.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}

                                        </td>

                                        <td className="p-3 text-center font-mono text-emerald-700 border-r border-gray-200 font-bold">

                                            {balance.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}

                                        </td>



                                        <td className="p-2 border-r border-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">

                                            <div className="flex items-center gap-2 justify-center">

                                                <input

                                                    type="text"

                                                    disabled={isClosed || hasMemory || isSuppressed}

                                                    value={val}

                                                    onChange={e => {

                                                        const v = e.target.value;

                                                        if (/^[\d.,]*$/.test(v)) setInputValues(prev => ({ ...prev, [item.id]: v }));

                                                    }}

                                                    onBlur={e => handleSaveItem(item.id, e.target.value)}

                                                    placeholder="0,000"

                                                    className={`w-28 text-right font-mono text-sm px-2 py-1.5 rounded outline-none border transition-all ${isOver

                                                        ? 'bg-red-500/10 border-red-500 text-red-400 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]'

                                                        : hasMemory

                                                            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed italic'

                                                            : 'bg-white border-gray-300 text-gray-800 focus:border-amber-400 focus:shadow-[0_0_0_2px_rgba(217,119,6,0.2)]'

                                                        }`}

                                                    title={hasMemory ? "Calculado via Memória de Cálculo" : ""}

                                                />

                                                <button

                                                    onClick={() => setActiveCalcItem(item)}

                                                    title="Memória de Cálculo"

                                                    className={`p-1.5 rounded transition-all ${hasMemory ? 'bg-amber-100 text-gray-900 shadow-lg shadow-amber-900/20' : 'bg-white text-gray-600 hover:bg-amber-50 hover:text-gray-900 border border-gray-200'

                                                        }`}

                                                >

                                                    <Calculator size={16} />

                                                </button>

                                                <button

                                                    onClick={() => setActivePhotoItem(item)}

                                                    title="Fotos do Item"

                                                    className="p-1.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-gray-900 border border-purple-200 transition-all"

                                                >

                                                    <Camera size={16} />

                                                </button>

                                            </div>

                                        </td>

                                        <td className="p-3 text-center text-gray-600 font-mono text-xs">

                                            {percentage > 0 ? `${percentage.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '-'}

                                        </td>

                                    </tr>

                                );

                            })}

                        </tbody>

                    </table>

                </div>

            </Card>



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

                    balances={Object.fromEntries(Object.entries(balances).map(([k, v]) => [k, v?.balance || 0]))}

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



            {/* Seção de Comentários e Aprovação */}

            <Card className="mt-6">

                <div className="p-4 border-b border-gray-200">

                    <div className="flex gap-4">

                        <button

                            onClick={() => setActiveTab('approval')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'approval' ? 'bg-emerald-500/20 text-emerald-500' : 'text-gray-600 hover:bg-amber-50/60'

                                }`}

                        >

                            <CheckCircle size={18} />

                            Aprovação

                        </button>

                        <button

                            onClick={() => setActiveTab('comments')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'comments' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-600 hover:bg-amber-50/60'

                                }`}

                        >

                            <MessageSquare size={18} />

                            Comentários

                        </button>

                        <button

                            onClick={() => setActiveTab('attachments')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'attachments' ? 'bg-purple-500/20 text-purple-500' : 'text-gray-600 hover:bg-amber-50/60'

                                }`}

                        >

                            <Paperclip size={18} />

                            Anexos

                        </button>

                        <button

                            onClick={() => setActiveTab('revisions')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'revisions' ? 'bg-amber-500/20 text-amber-500' : 'text-gray-600 hover:bg-amber-50/60'

                                }`}

                        >

                            <History size={18} />

                            Revisões

                        </button>

                    </div>

                </div>

                <div className="p-4">

                    {activeTab === 'approval' && (

                        <ApprovalPanel

                            measurementId={measurement.id}

                            measurementStatus={measurement.status}

                            canApprove={true}

                            onApprovalChange={loadData}

                        />

                    )}

                    {activeTab === 'comments' && (

                        <CommentSection

                            targetType="MEASUREMENT"

                            targetId={measurement.id}

                            currentUserId={user?.id}

                            canComment={true}

                        />

                    )}

                    {activeTab === 'attachments' && (

                        <AttachmentList

                            targetType="MEASUREMENT"

                            targetId={measurement.id}

                            readOnly={isClosed}

                        />

                    )}

                    {activeTab === 'revisions' && (

                        <RevisionHistory measurementId={measurement.id} />

                    )}

                </div>

            </Card>



            {/* Modal de Reabrir Medição */}

            {showReopenModal && (

                <div className="modal-overlay" onClick={() => setShowReopenModal(false)}>

                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>

                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-amber-50/60">

                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">

                                <RotateCcw size={20} className="text-amber-500" />

                                Reabrir Medição para Revisão

                            </h3>

                            <button onClick={() => setShowReopenModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>

                        </div>

                        <div className="p-6 space-y-4">

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-sm">

                                <strong>Atenção:</strong> Ao reabrir esta medição, todas as aprovações anteriores serão removidas e será necessário aprovar novamente.

                            </div>

                            <div>

                                <label className="label">Motivo da Revisão *</label>

                                <textarea

                                    value={reopenReason}

                                    onChange={e => setReopenReason(e.target.value)}

                                    className="input resize-none"

                                    rows={3}

                                    placeholder="Descreva o motivo da reabertura..."

                                    required

                                />

                            </div>

                            <div className="flex justify-end gap-3 pt-2">

                                <button onClick={() => setShowReopenModal(false)} className="btn btn-secondary">Cancelar</button>

                                <button onClick={handleReopen} className="btn bg-amber-500 hover:bg-amber-400 text-gray-900">

                                    Confirmar Reabertura

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}



// Componente de Histórico de Revisões

function RevisionHistory({ measurementId }: { measurementId: string }) {

    const [revisions, setRevisions] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);



    useEffect(() => {

        loadRevisions();

    }, [measurementId]);



    const loadRevisions = async () => {

        try {

            const { data } = await api.get(`/contracts/measurements/${measurementId}/revisions`);

            setRevisions(data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };



    if (loading) return <div className="text-center py-8 text-gray-600">Carregando revisões...</div>;



    if (revisions.length === 0) {

        return (

            <div className="text-center py-8 text-gray-600">

                <History size={32} className="mx-auto mb-2 opacity-50" />

                <p>Nenhuma revisão registrada</p>

                <p className="text-sm mt-1">Revisões são criadas quando uma medição fechada é reaberta</p>

            </div>

        );

    }



    return (

        <div className="space-y-4">

            {revisions.map((rev) => (

                <div key={rev.id} className="p-4 border border-gray-200 rounded-lg bg-white">

                    <div className="flex items-center justify-between mb-2">

                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded">

                            Revisão #{rev.revisionNumber}

                        </span>

                        <span className="text-xs text-gray-600">

                            {new Date(rev.createdAt).toLocaleString()}

                        </span>

                    </div>

                    <p className="text-gray-700 mb-2">{rev.reason}</p>

                    <p className="text-xs text-gray-600">Por: {rev.createdByName}</p>

                </div>

            ))}

        </div>

    );

}






