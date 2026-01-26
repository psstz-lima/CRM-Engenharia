import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export function ContractTimeline() {
    const { id } = useParams();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [id]);

    const loadEvents = async () => {
        try {
            const { data } = await api.get(`/contracts/${id}/events`);
            setEvents(data);
        } catch { }
        finally { setLoading(false); }
    };

    if (loading) return <div className="p-6">Carregando...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <PageHeader
                title="Timeline do Contrato"
                subtitle="Histórico de eventos relevantes"
                icon="🧭"
                actions={
                    <Link to={`/contracts/${id}`} className="btn btn-secondary flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Voltar
                    </Link>
                }
            />

            <Card>
                {events.length === 0 ? (
                    <div className="text-center text- p-6">Nenhum evento registrado</div>
                ) : (
                    <div className="space-y-4">
                        {events.map(ev => (
                            <div key={ev.id} className="border-b border- pb-3 last:border-0">
                                <div className="text-sm opacity-70">
                                    {new Date(ev.createdAt).toLocaleString('pt-BR')}
                                    {ev.createdBy?.fullName ? ` • ${ev.createdBy.fullName}` : ''}
                                </div>
                                <div className="font-medium">{ev.message}</div>
                                <div className="text-xs opacity-60">{ev.type}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
