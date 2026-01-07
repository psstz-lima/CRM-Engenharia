import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CRM Engenharia API',
            version: '1.0.0',
            description: `
# API do Sistema CRM Engenharia

Sistema de gerenciamento de contratos e medições de obras.

## Autenticação

A API utiliza JWT (JSON Web Token) para autenticação. 
Faça login em \`/api/auth/login\` para obter o token.

Inclua o token no header: \`Authorization: Bearer <token>\`

## Rate Limiting

- 1000 requisições por minuto por IP
- Respostas incluem headers \`X-RateLimit-*\`

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 429 | Muitas requisições |
| 500 | Erro interno |
            `,
            contact: {
                name: 'Suporte CRM Engenharia'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'API Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', description: 'Mensagem de erro' }
                    }
                },
                Contract: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        number: { type: 'string', description: 'Número do contrato' },
                        companyId: { type: 'string', format: 'uuid' },
                        object: { type: 'string', description: 'Objeto do contrato' },
                        totalValue: { type: 'number', description: 'Valor total' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        isActive: { type: 'boolean' }
                    }
                },
                Measurement: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        contractId: { type: 'string', format: 'uuid' },
                        number: { type: 'integer', description: 'Número sequencial da medição' },
                        periodStart: { type: 'string', format: 'date' },
                        periodEnd: { type: 'string', format: 'date' },
                        status: {
                            type: 'string',
                            enum: ['DRAFT', 'CLOSED', 'APPROVED'],
                            description: 'Status da medição'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        fullName: { type: 'string' },
                        isActive: { type: 'boolean' },
                        isMaster: { type: 'boolean' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'JWT Token' },
                        user: { $ref: '#/components/schemas/User' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Autenticação e sessão' },
            { name: 'Contracts', description: 'Gerenciamento de contratos' },
            { name: 'Measurements', description: 'Medições de contratos' },
            { name: 'Companies', description: 'Empresas cadastradas' },
            { name: 'Users', description: 'Usuários do sistema' },
            { name: 'Dashboard', description: 'Estatísticas e KPIs' },
            { name: 'Reports', description: 'Exportação de relatórios' }
        ]
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
    // Swagger UI
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
        customCss: `
            .swagger-ui .topbar { display: none }
            .swagger-ui .info { margin-bottom: 20px }
            .swagger-ui .info .title { color: #3b82f6 }
        `,
        customSiteTitle: 'CRM Engenharia - API Docs'
    }));

    // JSON spec endpoint
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });

    console.log('📚 Swagger docs available at /api/docs');
}

export default specs;
