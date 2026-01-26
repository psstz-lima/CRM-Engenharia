import prisma from '../config/database';
import { ContractEventType } from '@prisma/client';

export class ContractEventService {
    static async log(
        contractId: string,
        type: ContractEventType,
        message: string,
        metadata?: any,
        createdById?: string
    ) {
        try {
            return await prisma.contractEvent.create({
                data: {
                    contractId,
                    type,
                    message,
                    metadata,
                    createdById
                }
            });
        } catch (error) {
            console.error('Erro ao registrar evento do contrato:', error);
        }
    }
}
