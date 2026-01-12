import { PrismaClient } from '@prisma/client';

// Mock do Prisma para testes
jest.mock('../src/config/database', () => ({
    __esModule: true,
    default: {
        contract: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        },
        measurement: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        },
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        company: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        },
        $transaction: jest.fn(),
        $disconnect: jest.fn()
    }
}));

// Configurações globais
beforeAll(() => {
    // Configurar variáveis de ambiente para testes
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
});

afterAll(async () => {
    // Limpar recursos
    jest.clearAllMocks();
});

// Helper para reset de mocks entre testes
beforeEach(() => {
    jest.clearAllMocks();
});

// Timeout global
jest.setTimeout(10000);
