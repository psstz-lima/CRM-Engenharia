import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '../../services/api';

interface FavoriteButtonProps {
    targetType: 'CONTRACT' | 'MEASUREMENT';
    targetId: string;
    size?: number;
}

export function FavoriteButton({ targetType, targetId, size = 20 }: FavoriteButtonProps) {
    const [favorited, setFavorited] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkFavorite();
    }, [targetType, targetId]);

    const checkFavorite = async () => {
        try {
            const { data } = await api.get(`/favorites/check/${targetType}/${targetId}`);
            setFavorited(data.favorited);
        } catch { }
        finally { setLoading(false); }
    };

    const toggle = async () => {
        try {
            const { data } = await api.post('/favorites/toggle', { targetType, targetId });
            setFavorited(data.favorited);
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    if (loading) {
        return (
            <button disabled className="p-2 opacity-50">
                <Star size={size} />
            </button>
        );
    }

    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
            title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`p-2 rounded-lg transition-all hover:scale-110 ${favorited
                    ? 'text-amber-400 hover:text-amber-500'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
        >
            <Star size={size} fill={favorited ? 'currentColor' : 'none'} />
        </button>
    );
}
