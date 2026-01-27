import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { DraggableModal } from '../common/DraggableModal';

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
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
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
        <DraggableModal
            isOpen={true}
            onClose={onClose}
            title="Upload de Documento"
            width="720px"
            className="max-w-[95vw]"
        >
            <form onSubmit={handleSubmit} className="grid gap-4">
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            fileInputRef.current?.click();
                        }
                    }}
                    className={`upload-dropzone ${dragActive ? 'border-emerald-500/50 bg-emerald-50/60' : file ? 'border-emerald-500/40 bg-emerald-50/40' : ''}`}
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
                            <FileText size={36} className="text-emerald-600" />
                            <p className="font-medium text-">{file.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload size={36} className="text-gray-400" />
                            <p className="font-medium text-">Arraste o arquivo aqui ou clique para selecionar</p>
                            <p className="text-sm text-gray-500">PDF, DWG, DXF, DOC, XLS, imagens (máx. 50MB)</p>
                        </div>
                    )}
                </div>

                {!contractId && (
                    <div>
                        <label className="label">Contrato (opcional)</label>
                        <select
                            name="selectedContractId"
                            value={formData.selectedContractId}
                            onChange={handleInputChange}
                            className="input"
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

                <div>
                    <label className="label">Código do documento *</label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="Ex: DOC-001"
                        className="input"
                    />
                </div>

                <div>
                    <label className="label">Título *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Descrição do documento"
                        className="input"
                    />
                </div>

                <div>
                    <label className="label">Revisão</label>
                    <input
                        type="text"
                        name="revision"
                        value={formData.revision}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="input"
                    />
                </div>

                <div>
                    <label className="label">Categoria</label>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="input"
                    >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-600 rounded-lg border border-red-500/20">
                        <AlertCircle size={18} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
                        <CheckCircle size={18} />
                        <span className="text-sm">Documento enviado com sucesso!</span>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary flex-1"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={uploading || success}
                        className="btn btn-primary flex-1"
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
        </DraggableModal>
    );
}


