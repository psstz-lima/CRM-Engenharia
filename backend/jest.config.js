/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts',
        '!src/**/__tests__/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    verbose: true,
    testTimeout: 10000,
    clearMocks: true,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
};
