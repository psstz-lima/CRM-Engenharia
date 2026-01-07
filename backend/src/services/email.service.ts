import nodemailer from 'nodemailer';
import { config } from '../config';

// Interface para opções de email
interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

// Configuração do transporter
const createTransporter = () => {
    // Em desenvolvimento sem SMTP configurado, usar modo simulação
    if (!config.email?.host) {
        console.log('📧 [DEV] Email service em modo simulação - configure SMTP no .env');
        return null;
    }

    return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }
    });
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

// Templates de email em HTML
const templates = {
    measurementPending: (data: { contractNumber: string; measurementNumber: number; userName: string }) => ({
        subject: `🔔 Medição #${data.measurementNumber} aguardando aprovação`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">CRM Engenharia</h1>
                </div>
                <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1e293b;">Nova Medição Pendente</h2>
                    <p style="color: #64748b;">Olá ${data.userName},</p>
                    <p style="color: #64748b;">A medição <strong>#${data.measurementNumber}</strong> do contrato <strong>${data.contractNumber}</strong> foi fechada e está aguardando sua aprovação.</p>
                    <div style="margin: 20px 0;">
                        <a href="${config.frontendUrl}/measurements" 
                           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                           Ver Medições Pendentes
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #94a3b8; font-size: 12px;">Este é um email automático do sistema CRM Engenharia.</p>
                </div>
            </div>
        `
    }),

    contractExpiring: (data: { contractNumber: string; company: string; daysRemaining: number; endDate: string }) => ({
        subject: `⚠️ Contrato ${data.contractNumber} vence em ${data.daysRemaining} dias`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">⚠️ Alerta de Vencimento</h1>
                </div>
                <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1e293b;">Contrato Próximo do Vencimento</h2>
                    <table style="width: 100%; margin: 20px 0;">
                        <tr><td style="color: #64748b; padding: 8px 0;">Contrato:</td><td style="color: #1e293b; font-weight: bold;">${data.contractNumber}</td></tr>
                        <tr><td style="color: #64748b; padding: 8px 0;">Empresa:</td><td style="color: #1e293b;">${data.company}</td></tr>
                        <tr><td style="color: #64748b; padding: 8px 0;">Vencimento:</td><td style="color: #ef4444; font-weight: bold;">${data.endDate}</td></tr>
                        <tr><td style="color: #64748b; padding: 8px 0;">Dias restantes:</td><td style="color: #f59e0b; font-weight: bold;">${data.daysRemaining} dias</td></tr>
                    </table>
                    <a href="${config.frontendUrl}/contracts" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Contratos</a>
                </div>
            </div>
        `
    }),

    passwordReset: (data: { userName: string; resetLink: string }) => ({
        subject: '🔐 Redefinição de Senha - CRM Engenharia',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">CRM Engenharia</h1>
                </div>
                <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1e293b;">Redefinição de Senha</h2>
                    <p style="color: #64748b;">Olá ${data.userName},</p>
                    <p style="color: #64748b;">Clique no botão abaixo para criar uma nova senha:</p>
                    <div style="margin: 20px 0;">
                        <a href="${data.resetLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Redefinir Senha</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">Se você não solicitou esta redefinição, ignore este email. Este link expira em 1 hora.</p>
                </div>
            </div>
        `
    }),

    welcomeUser: (data: { userName: string; email: string; tempPassword?: string }) => ({
        subject: '🎉 Bem-vindo ao CRM Engenharia',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">Bem-vindo! 🎉</h1>
                </div>
                <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1e293b;">Sua conta foi criada</h2>
                    <p style="color: #64748b;">Olá ${data.userName}, sua conta foi criada com sucesso.</p>
                    <div style="background: #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; color: #64748b;"><strong>Email:</strong> ${data.email}</p>
                        ${data.tempPassword ? `<p style="margin: 5px 0 0; color: #64748b;"><strong>Senha temporária:</strong> ${data.tempPassword}</p>` : ''}
                    </div>
                    <a href="${config.frontendUrl}/login" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Acessar Sistema</a>
                </div>
            </div>
        `
    })
};

// Serviço de email
export const EmailService = {
    // Enviar email genérico
    async send(options: EmailOptions): Promise<boolean> {
        const transport = getTransporter();

        if (!transport) {
            console.log('📧 [DEV] Email simulado:', options.subject, '→', options.to);
            return true;
        }

        try {
            await transport.sendMail({
                from: config.email?.from || '"CRM Engenharia" <noreply@crm-eng.com>',
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, '')
            });
            console.log('📧 Email enviado:', options.subject);
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            return false;
        }
    },

    // Notificar medição pendente
    async notifyMeasurementPending(to: string | string[], data: { contractNumber: string; measurementNumber: number; userName: string }) {
        const template = templates.measurementPending(data);
        return this.send({ to, ...template });
    },

    // Notificar contrato vencendo
    async notifyContractExpiring(to: string | string[], data: { contractNumber: string; company: string; daysRemaining: number; endDate: string }) {
        const template = templates.contractExpiring(data);
        return this.send({ to, ...template });
    },

    // Email de reset de senha
    async sendPasswordReset(to: string, data: { userName: string; resetLink: string }) {
        const template = templates.passwordReset(data);
        return this.send({ to, ...template });
    },

    // Email de boas-vindas
    async sendWelcome(to: string, data: { userName: string; email: string; tempPassword?: string }) {
        const template = templates.welcomeUser(data);
        return this.send({ to, ...template });
    }
};

// Mantém compatibilidade com função antiga
export async function sendEmail(to: string, subject: string, html: string) {
    return EmailService.send({ to, subject, html });
}

export default EmailService;
