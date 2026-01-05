import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ContractSpreadsheet } from '../components/contracts/ContractSpreadsheet';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import {
    Download,
    Upload,
    FileSpreadsheet,
    Building2,
    Calendar,
    DollarSign,
    FileText,
    AlertCircle
} from 'lucide-react';

export function ContractDetails() {
    const { id } = useParams();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContract();
    }, [id]);

    const loadContract = async () => {
        if (!id) return;
        try {
            const { data } = await api.get(`/contracts/${id}`);
            setContract(data);
        } catch (error) {
            console.error('Error loading contract:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/contracts/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `contract-${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Erro ao exportar');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/contracts/template/download', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'modelo_importacao_contrato.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Erro ao baixar modelo');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        if (!confirm('ATENÇÃO: A importação irá APAGAR todos os itens atuais e substituir pelos do Excel. Deseja continuar?')) {
            e.target.value = ''; // Reset
            return;
        }

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            setLoading(true);
            await api.post(`/contracts/${id}/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Importação realizada com sucesso!');
            loadContract();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao importar');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--text-muted)] gap-4">
                <AlertCircle size={48} className="opacity-50" />
                <h2 className="text-xl font-semibold">Contrato não encontrado</h2>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1920px] mx-auto space-y-6 animate-fadeIn">
            <PageHeader
                title={`Contrato: ${contract.number}`}
                subtitle="Gestão detalhada do contrato e planilha orçamentária."
                icon={<FileText className="text-[var(--accent-primary)]" />}
                breadcrumb={[
                    { label: 'Contratos', href: '/contracts' },
                    { label: contract.number || 'Detalhes' }
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                            <Download size={16} />
                            Exportar Excel
                        </button>

                        <button onClick={handleDownloadTemplate} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                            <FileSpreadsheet size={16} />
                            Modelo
                        </button>

                        <label className="btn bg-amber-600 hover:bg-amber-700 text-white cursor-pointer flex items-center gap-2">
                            <Upload size={16} />
                            Importar Excel
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </label>
                    </div>
                }
            />

            <Card className="p-6 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)] border-[var(--border-subtle)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                            <Building2 size={14} />
                            Empresa
                        </p>
                        <p className="font-semibold text-[var(--text-primary)] truncate" title={contract.company?.name}>
                            {contract.company?.name || '-'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                            <FileText size={14} />
                            Objeto
                        </p>
                        <p className="font-semibold text-[var(--text-primary)] truncate" title={contract.object}>
                            {contract.object || '-'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                            <Calendar size={14} />
                            Vigência
                        </p>
                        <p className="font-semibold text-[var(--text-primary)]">
                            {new Date(contract.startDate).toLocaleDateString()} a {new Date(contract.endDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                            <DollarSign size={14} />
                            Valor Total
                        </p>
                        <p className="text-xl font-bold text-emerald-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.totalValue || 0)}
                        </p>
                    </div>
                </div>
            </Card>

            {id && (
                <ContractSpreadsheet
                    contractId={id}
                    onContractUpdate={loadContract}
                />
            )}
        </div>
    );
}
