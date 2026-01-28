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

    const fixMojibake = (value: string) => {
        if (!value) return value;
        const applyMap = (input: string) => input
            .replace(/ÃƒÂ§/g, 'ç')
            .replace(/ÃƒÂ£/g, 'ã')
            .replace(/ÃƒÂ¡/g, 'á')
            .replace(/ÃƒÂ¢/g, 'â')
            .replace(/ÃƒÂª/g, 'ê')
            .replace(/ÃƒÂ©/g, 'é')
            .replace(/ÃƒÂ­/g, 'í')
            .replace(/ÃƒÂ³/g, 'ó')
            .replace(/ÃƒÂ´/g, 'ô')
            .replace(/ÃƒÂµ/g, 'õ')
            .replace(/ÃƒÂº/g, 'ú')
            .replace(/ÃƒÂ¼/g, 'ü')
            .replace(/ÃƒÂ‡/g, 'Ç')
            .replace(/ÃƒÂ‰/g, 'É')
            .replace(/ÃƒÂ“/g, 'Ó')
            .replace(/ÃƒÂš/g, 'Ú')
            .replace(/ÃƒÂ°/g, '°')
            .replace(/Ã§/g, 'ç')
            .replace(/Ã£/g, 'ã')
            .replace(/Ã¡/g, 'á')
            .replace(/Ã¢/g, 'â')
            .replace(/Ãª/g, 'ê')
            .replace(/Ã©/g, 'é')
            .replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó')
            .replace(/Ã´/g, 'ô')
            .replace(/Ãµ/g, 'õ')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã¼/g, 'ü')
            .replace(/Ã‡/g, 'Ç')
            .replace(/Ã‰/g, 'É')
            .replace(/Ã“/g, 'Ó')
            .replace(/Ãš/g, 'Ú')
            .replace(/Âº/g, 'º')
            .replace(/Âª/g, 'ª')
            .replace(/Â°/g, '°')
            .replace(/Â·/g, '·')
            .replace(/â€“/g, '–')
            .replace(/â€”/g, '—')
            .replace(/â€œ/g, '“')
            .replace(/â€\u009d/g, '”')
            .replace(/â€˜/g, '‘')
            .replace(/â€™/g, '’')
            .replace(/â€¦/g, '…');
        return applyMap(applyMap(value));
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

            <Card className="border border-gray-200 shadow-md">
                {events.length === 0 ? (
                    <div className="text-center text-gray-500 p-6">Nenhum evento registrado</div>
                ) : (
                    <div className="space-y-4">
                        {events.map(ev => (
                            <div key={ev.id} className="border-b border-gray-200 pb-3 last:border-0">
                                <div className="text-sm text-gray-500">
                                    {new Date(ev.createdAt).toLocaleString('pt-BR')}
                                    {ev.createdBy?.fullName ? ` · ${ev.createdBy.fullName}` : ''}
                                </div>
                                <div className="font-medium text-gray-800">{fixMojibake(String(ev.message ?? ''))}</div>
                                <div className="text-xs text-gray-400">{ev.type}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

