import { useState } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';

export interface FilterConfig {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'dateRange' | 'number';
    options?: { value: string; label: string }[];
    placeholder?: string;
}

interface FilterPanelProps {
    filters: FilterConfig[];
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    onClear?: () => void;
}

export function FilterPanel({ filters, values, onChange, onClear }: FilterPanelProps) {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (key: string, value: any) => {
        onChange({ ...values, [key]: value });
    };

    const hasActiveFilters = Object.values(values).some(v => v !== '' && v !== null && v !== undefined);
    const activeCount = Object.values(values).filter(v => v !== '' && v !== null && v !== undefined).length;

    const handleClear = () => {
        const cleared: Record<string, any> = {};
        filters.forEach(f => { cleared[f.key] = ''; });
        onChange(cleared);
        onClear?.();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Compact header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Filter size={18} className="text-gray-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
                    {activeCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-bold">
                            {activeCount}
                        </span>
                    )}
                </div>
                <ChevronDown size={18} className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded filters */}
            {expanded && (
                <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        {filters.map(filter => (
                            <div key={filter.key}>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                                    {filter.label}
                                </label>

                                {filter.type === 'text' && (
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={values[filter.key] || ''}
                                            onChange={e => handleChange(filter.key, e.target.value)}
                                            placeholder={filter.placeholder || 'Buscar...'}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {filter.type === 'select' && (
                                    <select
                                        value={values[filter.key] || ''}
                                        onChange={e => handleChange(filter.key, e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Todos</option>
                                        {filter.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                )}

                                {filter.type === 'date' && (
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={values[filter.key] || ''}
                                            onChange={e => handleChange(filter.key, e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                {filter.type === 'dateRange' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={values[`${filter.key}Start`] || ''}
                                            onChange={e => handleChange(`${filter.key}Start`, e.target.value)}
                                            className="flex-1 px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            placeholder="De"
                                        />
                                        <input
                                            type="date"
                                            value={values[`${filter.key}End`] || ''}
                                            onChange={e => handleChange(`${filter.key}End`, e.target.value)}
                                            className="flex-1 px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            placeholder="Até"
                                        />
                                    </div>
                                )}

                                {filter.type === 'number' && (
                                    <input
                                        type="number"
                                        value={values[filter.key] || ''}
                                        onChange={e => handleChange(filter.key, e.target.value)}
                                        placeholder={filter.placeholder || '0'}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {hasActiveFilters && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
