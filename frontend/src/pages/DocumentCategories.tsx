import { useEffect, useState, FormEvent } from 'react';
import { Tag, Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

interface DocumentCategory {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    orderIndex: number;
    isActive: boolean;
}

export default function DocumentCategories() {
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6b7280');
    const [icon, setIcon] = useState('📋');
    const [orderIndex, setOrderIndex] = useState(0);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/documents/categories', { params: { all: true } });
            setCategories(data);
        } catch (err) {
            console.error('Erro ao carregar categorias', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (category?: DocumentCategory) => {
        if (category) {
            setEditingCategory(category);
            setCode(category.code);
            setName(category.name);
            setDescription(category.description || '');
            setColor(category.color || '#6b7280');
            setIcon(category.icon || '📋');
            setOrderIndex(category.orderIndex || 0);
            setIsActive(category.isActive);
        } else {
            setEditingCategory(null);
            setCode('');
            setName('');
            setDescription('');
            setColor('#6b7280');
            setIcon('📋');
            setOrderIndex(0);
            setIsActive(true);
        }
        setShowModal(true);
    };

    const handleSave = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const payload = {
                code,
                name,
                description: description || null,
                color,
                icon,
                orderIndex,
                isActive,
            };

            if (editingCategory) {
                await api.put(`/documents/categories/${editingCategory.id}`, payload);
            } else {
                await api.post('/documents/categories', payload);
            }
            setShowModal(false);
            loadCategories();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar categoria');
        }
    };

    const handleDeactivate = async (category: DocumentCategory) => {
        if (!confirm(`Deseja ${category.isActive ? 'inativar' : 'ativar'} esta categoria?`)) return;
        try {
            await api.put(`/documents/categories/${category.id}`, { isActive: !category.isActive });
            loadCategories();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao atualizar categoria');
        }
    };

    const handleDelete = async (category: DocumentCategory) => {
        if (!confirm('Tem certeza que deseja remover esta categoria?')) return;
        try {
            await api.delete(`/documents/categories/${category.id}`);
            loadCategories();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao remover categoria');
        }
    };

    const filtered = categories.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
            c.code.toLowerCase().includes(term) ||
            c.name.toLowerCase().includes(term) ||
            (c.description || '').toLowerCase().includes(term)
        );
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Categorias de Documentos"
                subtitle="Gerencie as categorias utilizadas na biblioteca de projetos."
                icon={<Tag className="text-primary-500" />}
                actions={(
                    <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
                        <Plus size={16} />
                        Nova Categoria
                    </button>
                )}
            />

            <Card className="mb-4">
                <div className="p-4">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por código, nome ou descrição..."
                            className="input pl-10"
                        />
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f6efe4] text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-24">Código</th>
                                <th className="p-4 w-28 text-center">Ícone</th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 w-28 text-center">Ordem</th>
                                <th className="p-4 w-28 text-center">Status</th>
                                <th className="p-4 w-36 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Nenhuma categoria encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4 font-bold text-gray-900">{category.code}</td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                                                style={{ backgroundColor: `${category.color || '#6b7280'}22`, color: category.color || '#6b7280' }}>
                                                {category.icon || '📋'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700">{category.name}</td>
                                        <td className="p-4 text-gray-600">{category.description || '-'}</td>
                                        <td className="p-4 text-center text-gray-700">{category.orderIndex}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {category.isActive ? 'Ativa' : 'Inativa'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(category)}
                                                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(category)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title={category.isActive ? 'Inativar' : 'Ativar'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f6efe4]">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Código *</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={e => setCode(e.target.value.toUpperCase())}
                                        required
                                        className="input font-mono uppercase"
                                        placeholder="ARQ"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="label">Nome *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        className="input"
                                        placeholder="Arquitetura"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Descrição</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="input"
                                    placeholder="Descrição da categoria"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="label">Cor</label>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        className="input h-10 p-1"
                                    />
                                </div>
                                <div>
                                    <label className="label">Ícone</label>
                                    <input
                                        type="text"
                                        value={icon}
                                        onChange={e => setIcon(e.target.value)}
                                        className="input"
                                        placeholder="📋"
                                    />
                                </div>
                                <div>
                                    <label className="label">Ordem</label>
                                    <input
                                        type="number"
                                        value={orderIndex}
                                        onChange={e => setOrderIndex(Number(e.target.value))}
                                        className="input"
                                        min={0}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="category-active"
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="category-active" className="text-sm text-gray-600">Categoria ativa</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
