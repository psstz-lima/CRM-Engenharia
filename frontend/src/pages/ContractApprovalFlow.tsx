import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react';

export function ContractApprovalFlow() {
    const { id } = useParams();
    const [levels, setLevels] = useState<any[]>([]);
    const [flowName, setFlowName] = useState('Fluxo do Contrato');
    const [steps, setSteps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [levelsRes, flowRes] = await Promise.all([
                api.get('/approvals/levels'),
                api.get(`/contracts/${id}/approval-flow`)
            ]);
            setLevels(levelsRes.data);
            if (flowRes.data) {
                setFlowName(flowRes.data.name || 'Fluxo do Contrato');
                setSteps(flowRes.data.steps || []);
            }
        } catch {
            // noop
        } finally {
            setLoading(false);
        }
    };

    const addStep = () => {
        setSteps(prev => [...prev, { approvalLevelId: '', orderIndex: prev.length + 1, required: true }]);
    };

    const removeStep = (index: number) => {
        setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i + 1 })));
    };

    const saveFlow = async () => {
        try {
            await api.put(`/contracts/${id}/approval-flow`, {
                name: flowName,
                isActive: true,
                steps
            });
            alert('Fluxo salvo com sucesso');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar fluxo');
        }
    };

    if (loading) return <div className="p-6">Carregando...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <PageHeader
                title="Fluxo de Aprovaçõo do Contrato"
                subtitle="Configure as etapas e ordem de aprovaçõo"
                icon={<CheckCircle2 className="text-" />}
                actions={
                    <Link to={`/contracts/${id}`} className="btn btn-secondary flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Voltar
                    </Link>
                }
            />

            <Card className="space-y-4">
                <div>
                    <label className="label">Nome do fluxo</label>
                    <input className="input" value={flowName} onChange={e => setFlowName(e.target.value)} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="font-semibold">Etapas</div>
                    <button onClick={addStep} className="btn btn-secondary flex items-center gap-2">
                        <Plus size={16} />
                        Adicionar etapa
                    </button>
                </div>

                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-6">
                                <select
                                    className="input"
                                    value={step.approvalLevelId}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setSteps(prev => prev.map((s, i) => i === index ? { ...s, approvalLevelId: value } : s));
                                    }}
                                >
                                    <option value="">Selecione um nível</option>
                                    {levels.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-3">
                                <select
                                    className="input"
                                    value={String(step.required)}
                                    onChange={e => {
                                        const value = e.target.value === 'true';
                                        setSteps(prev => prev.map((s, i) => i === index ? { ...s, required: value } : s));
                                    }}
                                >
                                    <option value="true">Obrigatório</option>
                                    <option value="false">Opcional</option>
                                </select>
                            </div>
                            <div className="col-span-2 text-sm">Ordem {index + 1}</div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => removeStep(index)} className="text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-">
                    <button onClick={saveFlow} className="btn btn-primary">Salvar fluxo</button>
                </div>
            </Card>
        </div>
    );
}
