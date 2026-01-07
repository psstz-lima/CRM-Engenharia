import React from 'react';
import { Check, Clock, FileText, Lock } from 'lucide-react';

interface WorkflowStepsProps {
    currentStatus: string;
}

const steps = [
    { id: 'DRAFT', label: 'Em Elaboração', icon: FileText, description: 'Preenchimento da medição' },
    { id: 'PENDING', label: 'Em Aprovação', icon: Clock, description: 'Aguardando aprovações' }, // Using PENDING related to approvals
    { id: 'APPROVED', label: 'Aprovado', icon: Check, description: 'Pronto para faturamento' },
    { id: 'CLOSED', label: 'Concluído', icon: Lock, description: 'Processo finalizado' }
];

export function WorkflowSteps({ currentStatus }: WorkflowStepsProps) {
    // Map status to index
    const getStatusIndex = (status: string) => {
        switch (status) {
            case 'DRAFT': return 0;
            case 'REVIEW': return 1; // Backend might use REVIEW or PENDING
            case 'PENDING': return 1;
            case 'APPROVED': return 2;
            case 'CLOSED': return 3;
            default: return 0;
        }
    };

    const currentIndex = getStatusIndex(currentStatus);

    return (
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }`}
                            >
                                <Icon size={20} />
                            </div>
                            <div className={`mt-2 text-center transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                                <p className={`text-sm font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {step.label}
                                </p>
                                <p className="text-xs text-gray-500 hidden md:block">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
