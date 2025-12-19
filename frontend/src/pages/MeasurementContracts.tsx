import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
            alert('Erro ao carregar contratos');
        } finally {
            setLoading(false);
        }
    };

    const filtered = contracts.filter(c =>
        c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.object?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Carregando...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Módulo de Medições</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>Selecione um contrato para gerenciar as medições.</p>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Buscar contrato, obra ou empresa..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filtered.map(contract => (
                    <div key={contract.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#1f2937' }}>{contract.number}</h3>
                            <span style={{ fontSize: '0.8em', padding: '2px 6px', background: contract.isActive ? '#dcfce7' : '#fee2e2', color: contract.isActive ? '#166534' : '#991b1b', borderRadius: '4px' }}>
                                {contract.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '0.9em' }}><strong>Empresa:</strong> {contract.company?.name}</p>
                        <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '0.9em', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {contract.object}
                        </p>

                        <Link to={`/contracts/${contract.id}/measurements`} style={{ display: 'block', textAlign: 'center', padding: '10px', background: '#7c3aed', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                            Acessar Medições &rarr;
                        </Link>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Nenhum contrato encontrado.</div>}
        </div>
    );
}
