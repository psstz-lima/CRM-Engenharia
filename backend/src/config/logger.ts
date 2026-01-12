import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Diretório de logs
const LOG_DIR = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Formato personalizado para console
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${message}${metaStr}`;
    })
);

// Formato JSON para arquivos
const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'crm-engenharia' },
    transports: [
        // Console
        new winston.transports.Console({
            format: consoleFormat
        }),

        // Arquivo de erros
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            format: jsonFormat,
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5
        }),

        // Arquivo geral
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            format: jsonFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10
        })
    ]
});

// Middleware para log de requisições HTTP
export const httpLogger = (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?.id
        };

        if (res.statusCode >= 500) {
            logger.error('HTTP', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP', logData);
        } else {
            logger.info('HTTP', logData);
        }
    });

    next();
};

// Loggers contextuais
export const loggers = {
    auth: logger.child({ module: 'auth' }),
    contracts: logger.child({ module: 'contracts' }),
    measurements: logger.child({ module: 'measurements' }),
    email: logger.child({ module: 'email' }),
    cron: logger.child({ module: 'cron' })
};

// Funções utilitárias
export function logError(error: Error, context?: object) {
    logger.error(error.message, { stack: error.stack, ...context });
}

export function logAudit(action: string, userId: string, details: object) {
    logger.info('AUDIT', { action, userId, ...details });
}

export default logger;
