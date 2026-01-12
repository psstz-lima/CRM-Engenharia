import { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

interface GRDPrintProps {
    grd: {
        id: string;
        number: string;
        recipient: string;
        recipientCompany?: string;
        recipientEmail?: string;
        sendMethod: string;
        reason: string;
        status: string;
        notes?: string;
        sentAt?: string;
        confirmedAt?: string;
        createdAt: string;
        contract?: { number: string; company: { name: string } };
        items: Array<{
            id: string;
            document: {
                code: string;
                title: string;
                revision: string;
                category?: { code: string; name: string };
            };
            copies: number;
        }>;
        createdBy?: { fullName: string };
    };
    onClose: () => void;
}

const methodLabels: Record<string, string> = {
    EMAIL: 'E-mail',
    PHYSICAL: 'Física (Correios)',
    CLOUD: 'Nuvem (Link)',
    CD_DVD: 'CD/DVD',
    PENDRIVE: 'Pendrive'
};

const reasonLabels: Record<string, string> = {
    INITIAL: 'Envio Inicial',
    REVISION: 'Revisão',
    REPLACEMENT: 'Substituição',
    INFORMATION: 'Para Informação',
    APPROVAL: 'Para Aprovação'
};

export default function GRDPrint({ grd, onClose }: GRDPrintProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GRD ${grd.number}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        font-size: 12px; 
                        padding: 20px;
                        color: #333;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 15px; 
                        margin-bottom: 20px;
                    }
                    .header h1 { font-size: 18px; margin-bottom: 5px; }
                    .header h2 { font-size: 14px; font-weight: normal; color: #666; }
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 15px; 
                        margin-bottom: 20px;
                    }
                    .info-box { 
                        border: 1px solid #ddd; 
                        padding: 10px; 
                        border-radius: 4px;
                    }
                    .info-box label { 
                        font-size: 10px; 
                        color: #666; 
                        display: block; 
                        margin-bottom: 3px;
                        text-transform: uppercase;
                    }
                    .info-box p { font-weight: bold; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left;
                    }
                    th { 
                        background: #f5f5f5; 
                        font-size: 10px;
                        text-transform: uppercase;
                    }
                    .signature-area {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                        margin-top: 60px;
                    }
                    .signature-box {
                        text-align: center;
                        padding-top: 40px;
                        border-top: 1px solid #333;
                    }
                    .signature-box p { font-size: 10px; color: #666; }
                    .footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd;
                        font-size: 10px;
                        color: #666;
                        text-align: center;
                    }
                    .notes {
                        background: #f9f9f9;
                        padding: 10px;
                        border-radius: 4px;
                        margin-bottom: 20px;
                    }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 1cm; }
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Printer className="text-blue-500" />
                        Protocolo GRD
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Print Content */}
                <div ref={printRef} className="p-8">
                    {/* Header */}
                    <div className="header">
                        <h1>GUIA DE REMESSA DE DOCUMENTOS</h1>
                        <h2>{grd.number}</h2>
                    </div>

                    {/* Info Grid */}
                    <div className="info-grid">
                        <div className="info-box">
                            <label>Contrato</label>
                            <p>{grd.contract?.number}</p>
                            <p style={{ fontWeight: 'normal', fontSize: '11px' }}>{grd.contract?.company.name}</p>
                        </div>
                        <div className="info-box">
                            <label>Destinatário</label>
                            <p>{grd.recipient}</p>
                            {grd.recipientCompany && <p style={{ fontWeight: 'normal', fontSize: '11px' }}>{grd.recipientCompany}</p>}
                        </div>
                        <div className="info-box">
                            <label>Método de Envio</label>
                            <p>{methodLabels[grd.sendMethod] || grd.sendMethod}</p>
                        </div>
                        <div className="info-box">
                            <label>Motivo</label>
                            <p>{reasonLabels[grd.reason] || grd.reason}</p>
                        </div>
                        <div className="info-box">
                            <label>Data de Emissão</label>
                            <p>{formatDate(grd.createdAt)}</p>
                        </div>
                        <div className="info-box">
                            <label>Emitido Por</label>
                            <p>{grd.createdBy?.fullName || '-'}</p>
                        </div>
                    </div>

                    {/* Documentos */}
                    <h3 style={{ marginBottom: '10px', fontSize: '14px' }}>Documentos ({grd.items.length})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>Código</th>
                                <th>Título</th>
                                <th>Disciplina</th>
                                <th>Revisão</th>
                                <th style={{ width: '60px' }}>Cópias</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grd.items.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{item.document.code}</td>
                                    <td>{item.document.title}</td>
                                    <td>{item.document.category?.code || '-'}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{item.document.revision}</td>
                                    <td style={{ textAlign: 'center' }}>{item.copies}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Notas */}
                    {grd.notes && (
                        <div className="notes">
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px' }}>OBSERVAÇÕES</label>
                            <p>{grd.notes}</p>
                        </div>
                    )}

                    {/* Assinaturas */}
                    <div className="signature-area">
                        <div className="signature-box">
                            <p><strong>Remetente</strong></p>
                            <p>Data: ____/____/________</p>
                        </div>
                        <div className="signature-box">
                            <p><strong>Destinatário</strong></p>
                            <p>Data: ____/____/________</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="footer">
                        <p>Este documento comprova o envio/recebimento dos documentos listados acima.</p>
                        <p>Gerado em {new Date().toLocaleString('pt-BR')} | ConstruSys</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
