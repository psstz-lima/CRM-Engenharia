import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Category {
    id: string;
    code: string;
    name: string;
    color: string;
    icon: string;
}

interface DocumentUploadProps {
    contractId?: string;
    categories: Category[];
    onSuccess: () => void;
    onClose: () => void;
}

export default function DocumentUpload({ contractId, categories, onSuccess, onClose }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        code: '',
        title: '',
        revision: '0',
        categoryId: '',
        selectedContractId: '',
    });
    const [contracts, setContracts] = useState<any[]>([]);

    useEffect(() => {
        if (!contractId) {
            api.get('/contracts').then(res => setContracts(res.data)).catch(console.error);
        }
    }, [contractId]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            console.log('File dropped:', e.dataTransfer.files[0].name);
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File input change:', e.target.files);
        if (e.target.files && e.target.files[0]) {
            console.log('Setting file from input:', e.target.files[0].name);
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Selecione um arquivo para upload');
            return;
        }

        if (!formData.code || !formData.title) {
            setError('Preencha o código e título do documento');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const uploadData = new FormData();
            uploadData.append('code', formData.code);
            uploadData.append('title', formData.title);
            uploadData.append('revision', formData.revision);
            if (contractId || formData.selectedContractId) {
                uploadData.append('contractId', contractId || formData.selectedContractId);
            }
            if (formData.categoryId) {
                uploadData.append('categoryId', formData.categoryId);
            }
            uploadData.append('file', file);

            await api.post('/documents', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('Upload error:', err);
            const serverError = err.response?.data?.error || err.response?.data?.message;
            setError(serverError || 'Erro ao fazer upload do documento');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Upload className="text-blue-500" />
                        Upload de Documento
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={(e) => {
                            // Prevent triggering if clicking something interactive inside (unlikely but safe)
                            if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                console.log('Dropzone clicked, triggering input');
                                fileInputRef.current?.click();
                            }
                        }}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : file
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText size={40} className="text-green-500" />
                                <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload size={40} className="text-gray-400" />
                                <p className="font-medium text-gray-600 dark:text-gray-300">
                                    Arraste o arquivo aqui ou clique para selecionar
                                </p>
                                <p className="text-sm text-gray-400">
                                    PDF, DWG, DXF, DOC, XLS, imagens (máx. 50MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Contract Selection (Optional) */}
                    {!contractId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contrato (Opcional)
                            </label>
                            <select
                                name="selectedContractId"
                                value={formData.selectedContractId}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Sem contrato (Projeto Avulso)</option>
                                {Array.isArray(contracts) && contracts.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.number} {c.company?.name ? `- ${c.company.name}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Código do Documento *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            placeholder="Ex: DOC-001"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Descrição do documento"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Revision */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Revisão
                        </label>
                        <input
                            type="text"
                            name="revision"
                            value={formData.revision}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Categoria
                        </label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Selecione uma categoria</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                            <CheckCircle size={18} />
                            <span className="text-sm">Documento enviado com sucesso!</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || success}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
