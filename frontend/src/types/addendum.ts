export interface Addendum {
    id: string;
    contractId: string;
    number: number;
    description: string;
    date: string;
    status: 'DRAFT' | 'APPROVED' | 'CANCELLED';
    totalAddition: number;
    totalSuppression: number;
    netValue: number;
    createdAt: string;
    operations?: AddendumOperation[];
}

export interface AddendumOperation {
    id: string;
    addendumId: string;
    operationType: 'SUPPRESS' | 'ADD' | 'MODIFY_QTY' | 'MODIFY_PRICE' | 'MODIFY_BOTH';
    contractItemId?: string;
    newItemType?: string;
    newItemCode?: string;
    newItemDescription?: string;
    newItemParentId?: string;
    newItemUnit?: string;
    originalQuantity?: number;
    originalPrice?: number;
    newQuantity?: number;
    newPrice?: number;
    operationValue: number;
}
