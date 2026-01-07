import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, ArrowRight, X } from 'lucide-react';

interface PreviewData {
    filename: string;
    filePath: string;
    totalRows: number;
    headers: string[];
    suggestedMapping: Record<string, string>;
    preview: { row: number; data: Record<string, any> }[];
}

interface ImportResult {
    success: boolean;
    totalRows: number;
    imported: number;
    errors: { row: number; message: string }[];
    warnings: { row: number; message: string }[];
}

const FIELD_OPTIONS = [
    { value: '', label: '-- Ignorar --' },
    { value: 'code', label: 'Código' },
    { value: 'description', label: 'Descrição' },
    { value: 'type', label: 'Tipo (Etapa/Item)' },
    { value: 'unit', label: 'Unidade' },
    { value: 'quantity', label: 'Quantidade' },
    { value: 'unitPrice', label: 'Preço Unitário' }
];

export function Import() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'upload' | 'mapping' | 'result'>('upload');
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [contractId, setContractId] = useState('');
    const [contracts, setContracts] = useState<any[]>([]);
    const [result, setResult] = useState<ImportResult | null>(null);

    // Carregar contratos ao montar
    useState(() => {
        api.get('/contracts').then(res => setContracts(res.data)).catch(() => { });
    });

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
            handleFileUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/import/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPreview(data);
            setMapping(data.suggestedMapping || {});
            setStep('mapping');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao processar arquivo');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!contractId) {
            alert('Selecione um contrato');
            return;
        }
        if (!preview) return;

        setLoading(true);
        try {
            const { data } = await api.post('/import/contract-items', {
                contractId,
                filePath: preview.filePath,
                mapping
            });
            setResult(data);
            setStep('result');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro na importação');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        window.open('/api/import/template/contract-items', '_blank');
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <PageHeader
                title="Importar Dados"
                subtitle="Importe itens de contrato a partir de planilhas Excel"
                icon={<Upload size={24} />}
            />

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {['upload', 'mapping', 'result'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === s ? 'bg-blue-500 text-white' :
                                ['upload', 'mapping', 'result'].indexOf(step) > i ? 'bg-emerald-500 text-white' :
                                    'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}>
                            {['upload', 'mapping', 'result'].indexOf(step) > i ? <Check size={16} /> : i + 1}
                        </div>
                        <span className={`text-sm ${step === s ? 'font-bold' : 'text-gray-500'}`}>
                            {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Mapeamento' : 'Resultado'}
                        </span>
                        {i < 2 && <ArrowRight size={16} className="text-gray-400 mx-2" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Selecione o arquivo</h3>
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm"
                            >
                                <Download size={16} /> Baixar template
                            </button>
                        </div>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        >
                            <FileSpreadsheet size={48} className="mx-auto mb-4 text-emerald-500" />
                            <p className="text-lg mb-2">Arraste o arquivo Excel aqui</p>
                            <p className="text-sm text-gray-500 mb-4">ou</p>
                            <label className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                                Selecionar arquivo
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-4">Formatos aceitos: .xlsx, .xls (máx. 10MB)</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 2: Mapping */}
            {step === 'mapping' && preview && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-semibold">{preview.filename}</h3>
                                <p className="text-sm text-gray-500">{preview.totalRows} linhas encontradas</p>
                            </div>
                            <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contract Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Importar para o contrato:</label>
                            <select
                                value={contractId}
                                onChange={e => setContractId(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value="">Selecione um contrato...</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>{c.number} - {c.company?.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Column Mapping */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-3">Mapeamento de colunas:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {preview.headers.map(header => (
                                    <div key={header} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        <label className="text-xs text-gray-500 block mb-1">{header}</label>
                                        <select
                                            value={mapping[header] || ''}
                                            onChange={e => setMapping({ ...mapping, [header]: e.target.value })}
                                            className="w-full text-sm px-2 py-1 border rounded bg-white dark:bg-gray-700"
                                        >
                                            {FIELD_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-3">Preview (primeiras 10 linhas):</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2 text-left">#</th>
                                            {preview.headers.map(h => (
                                                <th key={h} className="p-2 text-left">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.preview.map(row => (
                                            <tr key={row.row} className="border-b">
                                                <td className="p-2 text-gray-500">{row.row}</td>
                                                {preview.headers.map(h => (
                                                    <td key={h} className="p-2">{String(row.data[h] || '')}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setStep('upload')} className="btn btn-secondary">
                                Voltar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!contractId || loading}
                                className="btn bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {loading ? 'Importando...' : 'Importar Dados'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 3: Result */}
            {step === 'result' && result && (
                <Card>
                    <div className="p-6 text-center">
                        {result.success ? (
                            <>
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Importação concluída!</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {result.imported} de {result.totalRows} itens importados com sucesso.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Importação com alertas</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {result.imported} itens importados. {result.errors.length} erros encontrados.
                                </p>
                            </>
                        )}

                        {result.warnings.length > 0 && (
                            <div className="text-left mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <h4 className="font-medium text-amber-600 mb-2">Avisos:</h4>
                                <ul className="text-sm text-amber-700 space-y-1">
                                    {result.warnings.slice(0, 5).map((w, i) => (
                                        <li key={i}>Linha {w.row}: {w.message}</li>
                                    ))}
                                    {result.warnings.length > 5 && <li>... e mais {result.warnings.length - 5} avisos</li>}
                                </ul>
                            </div>
                        )}

                        {result.errors.length > 0 && (
                            <div className="text-left mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <h4 className="font-medium text-red-600 mb-2">Erros:</h4>
                                <ul className="text-sm text-red-700 space-y-1">
                                    {result.errors.slice(0, 5).map((e, i) => (
                                        <li key={i}>Linha {e.row}: {e.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-center gap-3 mt-6">
                            <button onClick={() => { setStep('upload'); setPreview(null); setResult(null); }} className="btn btn-secondary">
                                Nova importação
                            </button>
                            <button onClick={() => navigate(`/contracts/${contractId}`)} className="btn bg-blue-500 text-white">
                                Ver contrato
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex items-center gap-4">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Processando...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
