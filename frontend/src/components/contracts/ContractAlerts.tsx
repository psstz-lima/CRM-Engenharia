import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, ShieldAlert } from 'lucide-react';

interface AlertRule {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    thresholdDays: number;
}

const alertTypes = [
    { value: 'CONTRACT_EXPIRING', label: 'Contrato vencendo' },
    { value: 'MEASUREMENT_PENDING', label: 'Medição pendente' },
    { value: 'DOCUMENT_OVERDUE', label: 'Documento atrasado' },
    { value: 'SLA_BREACH', label: 'SLA estourado' }
];

interface ContractAlertsProps {
    contractId: string;
}

export function ContractAlerts({ contractId }: ContractAlertsProps) {
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [type, setType] = useState('CONTRACT_EXPIRING');
    const [thresholdDays, setThresholdDays] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/alert-rules', { params: { contractId } });
            setRules(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [contractId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await api.post('/alert-rules', {
            name: name.trim(),
            type,
            thresholdDays: thresholdDays  Number(thresholdDays) : null,
            contractId
        });
        setName('');
        setThresholdDays('');
        load();
    };

    const toggleActive = async (rule: AlertRule) => {
        await api.patch(`/alert-rules/${rule.id}`, { isActive: !rule.isActive });
        load();
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-center">
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome da regra"
                    className="input min-w-[220px]"
                />
                <select value={type} onChange={e => setType(e.target.value)} className="input min-w-[200px]">
                    {alertTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <input
                    value={thresholdDays}
                    onChange={e => setThresholdDays(e.target.value)}
                    placeholder="Dias limite (opcional)"
                    type="number"
                    className="input w-[180px]"
                />
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                    <Plus size={16} />
                    Adicionar
                </button>
            </form>

            {loading  (
                <div className="text-sm text-gray-500">Carregando alertas...</div>
            ) : rules.length === 0  (
                <div className="text-sm text-gray-500">Nenhuma regra cadastrada.</div>
            ) : (
                <div className="space-y-2">
                    {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-white/80 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <ShieldAlert size={18} className={rule.isActive  'text-amber-600' : 'text-gray-400'} />
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">{rule.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {alertTypes.find(t => t.value === rule.type).label || rule.type}
                                        {rule.thresholdDays  ` · ${rule.thresholdDays} dias` : ''}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleActive(rule)}
                                className={`btn btn-xs ${rule.isActive  'btn-secondary' : 'btn-primary'}`}
                            >
                                {rule.isActive  'Desativar' : 'Ativar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
