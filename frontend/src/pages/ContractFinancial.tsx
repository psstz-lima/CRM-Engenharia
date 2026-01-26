import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export function ContractFinancial() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const { data } = await api.get(`/reports/contract/${id}/financial`);
            setData(data);
        } catch { }
        finally { setLoading(false); }
    };

    if (loading) return <div className="p-6">Carregando...</div>;
    if (!data) return <div className="p-6">Dados não encontrados</div>;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <PageHeader
                title={`Financeiro do Contrato ${data.contract.number}`}
                subtitle={data.contract.company}
                icon="💰"
                actions={
                    <Link to={`/contracts/${id}`} className="btn btn-secondary flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Voltar
                    </Link>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="text-sm opacity-70">Valor Total</div>
                    <div className="text-2xl font-bold">{formatCurrency(data.totalValue)}</div>
                </Card>
                <Card>
                    <div className="text-sm opacity-70">Medido</div>
                    <div className="text-2xl font-bold text-emerald-500">{formatCurrency(data.measuredValue)}</div>
                </Card>
                <Card>
                    <div className="text-sm opacity-70">Saldo</div>
                    <div className="text-2xl font-bold text-amber-500">{formatCurrency(data.remainingValue)}</div>
                </Card>
            </div>

            <Card>
                <div className="text-sm opacity-70">Percentual Executado</div>
                <div className="text-xl font-bold">{data.percentExecuted}%</div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-2 bg-emerald-500"
                        style={{ width: `${Math.min(data.percentExecuted, 100)}%` }}
                    />
                </div>
            </Card>
        </div>
    );
}
