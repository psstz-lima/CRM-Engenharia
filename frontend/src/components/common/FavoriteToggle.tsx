import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '../../services/api';

interface FavoriteToggleProps {
    targetType: 'CONTRACT' | 'MEASUREMENT';
    targetId: string;
    showLabel?: boolean;
    className?: string;
    onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteToggle({ targetType, targetId, showLabel = false, className = '', onToggle }: FavoriteToggleProps) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!targetId) return;
        checkStatus();
    }, [targetId, targetType]);

    const checkStatus = async () => {
        try {
            const { data } = await api.get(`/favorites/check/${targetType}/${targetId}`);
            setIsFavorited(data.isFavorited);
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;

        setLoading(true);
        try {
            const { data } = await api.post('/favorites/toggle', { targetType, targetId });
            setIsFavorited(data.isFavorited);
            if (onToggle) onToggle(data.isFavorited);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-2 transition-colors ${
                isFavorited 
                    ? 'text-yellow-400 hover:text-yellow-500' 
                    : 'text-gray-400 hover:text-yellow-400'
            } ${className}`}
            title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
            <Star 
                size={20} 
                fill={isFavorited ? 'currentColor' : 'none'} 
                className={loading ? 'animate-pulse' : ''}
            />
            {showLabel && (
                <span className="text-sm font-medium">
                    {isFavorited ? 'Favoritado' : 'Favoritar'}
                </span>
            )}
        </button>
    );
}
