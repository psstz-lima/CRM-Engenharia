import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Ruler, Search, Building2, ArrowRight, AlertCircle, Briefcase } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function MeasurementContracts() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        try {
            const { data } = await api.get('/contracts');
            setContracts(data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = contracts.filter(c =>
        c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.object?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2 text-">
                <div className="w-6 h-6 border-2 border- border-t-transparent rounded-full animate-spin"></div>
                <p>Carregando contratos...</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Módulo de Medições"
                subtitle="Selecione um contrato para gerenciar e lançar medições físicas e financeiras."
                icon={<Ruler className="text-" />}
            />

            <div className="relative max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-" />
                <input
                    type="text"
                    placeholder="Buscar contrato, obra ou empresa..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input w-full pl-10"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(contract => (
                    <Card key={contract.id} variant="default" hover className="flex flex-col h-full bg- border- hover:border- hover:shadow-lg transition-all">
                        <div className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg- text-">
                                        <Briefcase size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-">{contract.number}</h3>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${contract.isActive
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                    {contract.isActive ? 'ATIVO' : 'INATIVO'}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1">
                                <p className="text- text-sm flex items-center gap-2">
                                    <Building2 size={14} className="opacity-70" />
                                    <span className="font-semibold text-">{contract.company?.name}</span>
                                </p>
                                <p className="text- text-sm line-clamp-2 h-10 leading-relaxed">
                                    {contract.object}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-">
                                <Link
                                    to={`/contracts/${contract.id}/measurements`}
                                    className="btn btn-primary w-full flex items-center justify-center gap-2 group"
                                >
                                    Acessar Medições
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text- gap-4">
                    <div className="w-16 h-16 rounded-full bg- flex items-center justify-center opacity-50">
                        <AlertCircle size={32} />
                    </div>
                    <p className="text-lg">Nenhum contrato encontrado para a busca.</p>
                </div>
            )}
        </div>
    );
}
