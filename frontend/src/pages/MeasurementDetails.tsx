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

            <div className="flex flex-col items-center gap-2 text-">

                <div className="w-8 h-8 border-2 border- border-t-transparent rounded-full animate-spin"></div>

                <p>Carregando planilha...</p>

            </div>

        </div>

    );



    if (!measurement || !contract) return (

        <div className="flex flex-col items-center justify-center h-screen text- gap-4">

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

                icon={<Ruler className="text-" />}

                breadcrumb={[

                    { label: 'Contratos', href: '/contracts' },

                    { label: 'Medições', href: `/contracts/${contract.id}/measurements` },

                    { label: `Detalhes` }

                ]}

                actions={

                    <div className="flex items-center gap-3">

                        <FavoriteToggle targetType="MEASUREMENT" targetId={measurement.id} />

                        <ExportButton type="measurement" id={measurement.id} label="Exportar" />

                        <Link to={`/contracts/${contract.id}/measurements`} className="btn btn-secondary flex items-center gap-2">

                            <ArrowLeft size={16} />

                            Voltar

                        </Link>

                        {!isClosed ? (

                            <button onClick={handleClose} className="btn bg-emerald-600 hover:bg-emerald-500 text-gray-900 border-none shadow-lg shadow-emerald-900/20 flex items-center gap-2">

                                <Lock size={16} />

                                Encerrar Medição

                            </button>

                        ) : (

                            <>

                                <span className="flex items-center gap-2 px-4 py-2 bg- border border- rounded-lg text- text-sm font-medium">

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

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg- p-4 rounded-xl border border- shadow-sm">

                <div className="relative w-full max-w-md">

                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-" />

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

                            className="absolute right-3 top-1/2 -translate-y-1/2 text- hover:text-"

                        >

                            ✕

                        </button>

                    )}

                </div>



                <div className="flex items-center gap-2">

                    <span className="text-sm text- mr-2 font-medium">Visualização:</span>

                    <button onClick={expandAll} className="btn btn-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 flex items-center gap-1">

                        <Plus size={12} /> Expandir Tudo

                    </button>

                    <button onClick={() => collapseAll(contract.items || [])} className="btn btn-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 flex items-center gap-1">

                        <Minus size={12} /> Recolher

                    </button>

                </div>

            </div>



            <Card className="overflow-hidden border-none shadow-xl">

                <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb- scrollbar-track-transparent">

                    <table className="w-full text-left border-collapse text-sm">

                        <thead className="sticky top-0 z-10 bg- shadow-sm text- uppercase font-semibold text-xs border-b border-">

                            <tr>

                                <th className="p-3 w-20">Item</th>

                                <th className="p-3 min-w-[300px]">Descrição</th>

                                <th className="p-3 text-center w-16">Un</th>

                                <th className="p-3 text-right bg-blue-500/5 border-l border- text-blue-400">Qtd. Vigente</th>

                                <th className="p-3 text-right bg-amber-500/5 border-l border- text-amber-400">Acum. Anterior</th>

                                <th className="p-3 text-right bg-emerald-500/5 border-l border- text-emerald-400">Saldo Atual</th>

                                <th className="p-3 text-center bg- border-l border-r border- w-48 text- font-bold shadow-inner">A Medir (Atual)</th>

                                <th className="p-3 text-right w-20">%</th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-">

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

                                        <tr key={item.id} className="bg- text- font-semibold text-xs hover:bg- transition-colors">

                                            <td className="p-2 pl-4 whitespace-nowrap">

                                                {item.hasChildren && (

                                                    <button

                                                        onClick={() => toggleCollapse(item.id)}

                                                        className="mr-2 text- hover:text- focus:outline-none transition-colors"

                                                    >

                                                        {item.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}

                                                    </button>

                                                )}

                                                {item.code}

                                            </td>

                                            <td className="p-2" colSpan={7} style={{ paddingLeft: `${paddingLeft}px` }}>

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

                                    <tr key={item.id} className={`hover:bg- transition-colors ${isSuppressed ? 'opacity-50 line-through decoration-red-500/50' : ''}`}>

                                        <td className="p-3 text- font-mono text-center border-r border- text-xs">{item.code}</td>

                                        <td className="p-3 text- border-r border-">

                                            <div style={{ paddingLeft: `${item.depth * 20}px` }} className="flex items-center">

                                                <span className="truncate max-w-[400px]" title={item.description}>{item.description}</span>

                                                {isSuppressed && <span className="ml-2 text-red-500 text-xs px-1 rounded border border-red-500/30 font-bold">SUPRIMIDO</span>}

                                            </div>

                                        </td>

                                        <td className="p-3 text-center text- border-r border- text-xs">{item.unit}</td>



                                        <td className="p-3 text-right font-mono text-blue-400 bg-blue-500/5 border-r border-">

                                            {vigentQty.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}

                                        </td>

                                        <td className="p-3 text-right font-mono text-amber-400 bg-amber-500/5 border-r border-">

                                            {prevAccum.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}

                                        </td>

                                        <td className="p-3 text-right font-mono text-emerald-400 bg-emerald-500/5 border-r border- font-bold">

                                            {balance.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}

                                        </td>



                                        <td className="p-2 bg- border-r border- shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">

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

                                                            ? 'bg- border- text- cursor-not-allowed italic'

                                                            : 'bg- border- text- focus:border- focus:shadow-[0_0_0_2px_rgba(var(--accent-primary-rgb),0.2)]'

                                                        }`}

                                                    title={hasMemory ? "Calculado via Memória de Cálculo" : ""}

                                                />

                                                <button

                                                    onClick={() => setActiveCalcItem(item)}

                                                    title="Memória de Cálculo"

                                                    className={`p-1.5 rounded transition-all ${hasMemory ? 'bg- text-gray-900 shadow-lg shadow-/30' : 'bg- text- hover:bg- hover:text-gray-900 border border-'

                                                        }`}

                                                >

                                                    <Calculator size={16} />

                                                </button>

                                                <button

                                                    onClick={() => setActivePhotoItem(item)}

                                                    title="Fotos do Item"

                                                    className="p-1.5 rounded bg- text- hover:bg-purple-600 hover:text-gray-900 border border- transition-all"

                                                >

                                                    <Camera size={16} />

                                                </button>

                                            </div>

                                        </td>

                                        <td className="p-3 text-right text- font-mono text-xs">

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

                <div className="p-4 border-b border-">

                    <div className="flex gap-4">

                        <button

                            onClick={() => setActiveTab('approval')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'approval' ? 'bg-emerald-500/20 text-emerald-500' : 'text- hover:bg-'

                                }`}

                        >

                            <CheckCircle size={18} />

                            Aprovação

                        </button>

                        <button

                            onClick={() => setActiveTab('comments')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'comments' ? 'bg-blue-500/20 text-blue-500' : 'text- hover:bg-'

                                }`}

                        >

                            <MessageSquare size={18} />

                            Comentários

                        </button>

                        <button

                            onClick={() => setActiveTab('attachments')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'attachments' ? 'bg-purple-500/20 text-purple-500' : 'text- hover:bg-'

                                }`}

                        >

                            <Paperclip size={18} />

                            Anexos

                        </button>

                        <button

                            onClick={() => setActiveTab('revisions')}

                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'revisions' ? 'bg-amber-500/20 text-amber-500' : 'text- hover:bg-'

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

                        <div className="p-6 border-b border- flex justify-between items-center bg-">

                            <h3 className="text-xl font-bold text- flex items-center gap-2">

                                <RotateCcw size={20} className="text-amber-500" />

                                Reabrir Medição para Revisão

                            </h3>

                            <button onClick={() => setShowReopenModal(false)} className="text- hover:text-">✕</button>

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



    if (loading) return <div className="text-center py-8 text-">Carregando revisões...</div>;



    if (revisions.length === 0) {

        return (

            <div className="text-center py-8 text-">

                <History size={32} className="mx-auto mb-2 opacity-50" />

                <p>Nenhuma revisão registrada</p>

                <p className="text-sm mt-1">Revisões são criadas quando uma medição fechada é reaberta</p>

            </div>

        );

    }



    return (

        <div className="space-y-4">

            {revisions.map((rev) => (

                <div key={rev.id} className="p-4 border border- rounded-lg bg-">

                    <div className="flex items-center justify-between mb-2">

                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded">

                            Revisão #{rev.revisionNumber}

                        </span>

                        <span className="text-xs text-">

                            {new Date(rev.createdAt).toLocaleString()}

                        </span>

                    </div>

                    <p className="text- mb-2">{rev.reason}</p>

                    <p className="text-xs text-">Por: {rev.createdByName}</p>

                </div>

            ))}

        </div>

    );

}

