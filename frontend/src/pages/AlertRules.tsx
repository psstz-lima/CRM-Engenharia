import { useEffect, useState } from 'react';

import api from '../services/api';

import { PageHeader } from '../components/ui/PageHeader';

import { Card } from '../components/ui/Card';

import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

import { DraggableModal } from '../components/common/DraggableModal';



export function AlertRules() {

    const [rules, setRules] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);



    const [name, setName] = useState('');

    const [type, setType] = useState('CONTRACT_EXPIRING');

    const [thresholdDays, setThresholdDays] = useState('30');

    const [isActive, setIsActive] = useState(true);



    useEffect(() => {

        loadRules();

    }, []);



    const loadRules = async () => {

        try {

            const { data } = await api.get('/alert-rules');

            setRules(data);

        } catch {

            // noop

        } finally {

            setLoading(false);

        }

    };



    const createRule = async (e: React.FormEvent) => {

        e.preventDefault();

        try {

            await api.post('/alert-rules', {

                name,

                type,

                isActive,

                thresholdDays: thresholdDays ? Number(thresholdDays) : null

            });

            setShowModal(false);

            setName('');

            setType('CONTRACT_EXPIRING');

            setThresholdDays('30');

            setIsActive(true);

            loadRules();

        } catch (err: any) {

            alert(err.response?.data?.error || 'Erro ao criar regra');

        }

    };



    const deleteRule = async (id: string) => {

        if (!confirm('Excluir regra?')) return;

        await api.delete(`/alert-rules/${id}`);

        loadRules();

    };



    if (loading) return <div className="p-6">Carregando...</div>;



    return (

        <div className="p-6 max-w-6xl mx-auto space-y-6">

            <PageHeader

                title="Regras de Alerta"

                subtitle="Configure alertas automáticos do sistema"

                icon={<AlertTriangle className="text-" />}

                actions={

                    <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">

                        <Plus size={16} />

                        Nova regra

                    </button>

                }

            />



            <Card>

                <table className="w-full">

                    <thead className="bg- text- text-xs uppercase font-semibold border-b border-">

                        <tr>

                            <th className="p-4 text-left">Nome</th>

                            <th className="p-4 text-left">Tipo</th>

                            <th className="p-4 text-left">Dias</th>

                            <th className="p-4 text-left">Ativa</th>

                            <th className="p-4 text-right">Ações</th>

                        </tr>

                    </thead>

                    <tbody className="divide-y divide-">

                        {rules.map(rule => (

                            <tr key={rule.id}>

                                <td className="p-4">{rule.name}</td>

                                <td className="p-4">{rule.type}</td>

                                <td className="p-4">{rule.thresholdDays ? rule.thresholdDays : '-'}</td>

                                <td className="p-4">{rule.isActive ? 'Sim' : 'Não'}</td>

                                <td className="p-4 text-right">

                                    <button onClick={() => deleteRule(rule.id)} className="text-red-500">

                                        <Trash2 size={16} />

                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </Card>



            {showModal && (

                <DraggableModal

                    isOpen={showModal}

                    onClose={() => setShowModal(false)}

                    title="Nova regra"

                    width="620px"

                    className="max-w-[96vw]"

                >

                    <form onSubmit={createRule} className="grid gap-4">

                        <div>

                            <label className="label">Nome *</label>

                            <input className="input" value={name} onChange={e => setName(e.target.value)} required />

                        </div>

                        <div>

                            <label className="label">Tipo</label>

                            <select className="input" value={type} onChange={e => setType(e.target.value)}>

                                <option value="CONTRACT_EXPIRING">Contrato vencendo</option>

                                <option value="MEASUREMENT_PENDING">Medição pendente</option>

                                <option value="DOCUMENT_OVERDUE">Documento atrasado</option>

                                <option value="SLA_BREACH">SLA estourado</option>

                            </select>

                        </div>

                        <div>

                            <label className="label">Dias (threshold)</label>

                            <input className="input" type="number" value={thresholdDays} onChange={e => setThresholdDays(e.target.value)} />

                        </div>

                        <div>

                            <label className="label">Ativa</label>

                            <select className="input" value={String(isActive)} onChange={e => setIsActive(e.target.value === 'true')}>

                                <option value="true">Sim</option>

                                <option value="false">Não</option>

                            </select>

                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-">

                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>

                            <button type="submit" className="btn btn-primary">Salvar</button>

                        </div>

                    </form>

                </DraggableModal>

            )}

        </div>

    );

}

