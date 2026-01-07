import cron from 'node-cron';
import prisma from '../config/database';
import { EmailService } from '../services/email.service';

// Job para verificar contratos vencendo e enviar notificações
async function checkExpiringContracts() {
    console.log('🔔 [CRON] Verificando contratos vencendo...');

    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // Buscar contratos vencendo nos próximos 30 dias
        const expiringContracts = await prisma.contract.findMany({
            where: {
                isActive: true,
                endDate: { gte: today, lte: thirtyDaysFromNow }
            },
            include: { company: { select: { name: true } } }
        });

        if (expiringContracts.length === 0) {
            console.log('✅ [CRON] Nenhum contrato vencendo em 30 dias');
            return;
        }

        // Buscar usuários Master para notificar
        const admins = await prisma.user.findMany({
            where: { isMaster: true, isActive: true },
            select: { email: true, fullName: true }
        });

        if (admins.length === 0) {
            console.log('⚠️ [CRON] Nenhum admin encontrado para notificar');
            return;
        }

        const adminEmails = admins.map(a => a.email);

        // Enviar notificação para cada contrato vencendo
        for (const contract of expiringContracts) {
            const daysRemaining = Math.ceil((contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Notificar apenas em marcos específicos: 30, 15, 7, 3, 1 dias
            if ([30, 15, 7, 3, 1].includes(daysRemaining)) {
                await EmailService.notifyContractExpiring(adminEmails, {
                    contractNumber: contract.number,
                    company: contract.company.name,
                    daysRemaining,
                    endDate: contract.endDate.toLocaleDateString('pt-BR')
                });

                // Criar notificação no sistema
                for (const admin of admins) {
                    await prisma.notification.create({
                        data: {
                            userId: (await prisma.user.findFirst({ where: { email: admin.email } }))!.id,
                            type: 'CONTRACT_EXPIRING',
                            title: `Contrato ${contract.number} vence em ${daysRemaining} dias`,
                            message: `O contrato com ${contract.company.name} vence em ${contract.endDate.toLocaleDateString('pt-BR')}.`,
                            metadata: { contractId: contract.id, daysRemaining }
                        }
                    });
                }

                console.log(`📧 [CRON] Notificação enviada: Contrato ${contract.number} - ${daysRemaining} dias`);
            }
        }

        console.log(`✅ [CRON] ${expiringContracts.length} contratos verificados`);
    } catch (error) {
        console.error('❌ [CRON] Erro ao verificar contratos:', error);
    }
}

// Job para verificar medições pendentes de aprovação
async function checkPendingMeasurements() {
    console.log('🔔 [CRON] Verificando medições pendentes...');

    try {
        // Medições fechadas há mais de 2 dias sem aprovação
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const pendingMeasurements = await prisma.measurement.findMany({
            where: {
                status: 'CLOSED',
                updatedAt: { lte: twoDaysAgo }
            },
            include: {
                contract: { include: { company: true } }
            }
        });

        if (pendingMeasurements.length === 0) {
            console.log('✅ [CRON] Nenhuma medição pendente há muito tempo');
            return;
        }

        // Buscar aprovadores
        const approvers = await prisma.user.findMany({
            where: {
                isActive: true,
                role: { permissions: { path: ['measurements_approve'], equals: true } }
            },
            select: { email: true, fullName: true }
        });

        // Se não encontrar por permissão, pegar masters
        const recipients = approvers.length > 0
            ? approvers
            : await prisma.user.findMany({
                where: { isMaster: true, isActive: true },
                select: { email: true, fullName: true }
            });

        if (recipients.length === 0) return;

        // Enviar lembrete consolidado
        for (const user of recipients) {
            const measurementsList = pendingMeasurements.map(m =>
                `• Medição #${m.number} - ${m.contract.number} (${m.contract.company.name})`
            ).join('\n');

            await EmailService.send({
                to: user.email,
                subject: `⏰ ${pendingMeasurements.length} medições aguardando aprovação`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 8px 8px 0 0;">
                            <h1 style="color: white; margin: 0;">⏰ Lembrete</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                            <h2 style="color: #1e293b;">Medições Pendentes de Aprovação</h2>
                            <p style="color: #64748b;">Olá ${user.fullName},</p>
                            <p style="color: #64748b;">Existem <strong>${pendingMeasurements.length}</strong> medições aguardando aprovação há mais de 2 dias:</p>
                            <pre style="background: #e2e8f0; padding: 15px; border-radius: 6px; font-size: 14px;">${measurementsList}</pre>
                        </div>
                    </div>
                `
            });
        }

        console.log(`📧 [CRON] Lembrete enviado: ${pendingMeasurements.length} medições pendentes`);
    } catch (error) {
        console.error('❌ [CRON] Erro ao verificar medições:', error);
    }
}

// Inicializar jobs agendados
export function initScheduledJobs() {
    console.log('⏰ Iniciando jobs agendados...');

    // Verificar contratos vencendo - todo dia às 8h
    cron.schedule('0 8 * * *', checkExpiringContracts, {
        timezone: 'America/Sao_Paulo'
    });

    // Verificar medições pendentes - toda segunda e quinta às 9h
    cron.schedule('0 9 * * 1,4', checkPendingMeasurements, {
        timezone: 'America/Sao_Paulo'
    });

    console.log('✅ Jobs agendados:');
    console.log('   - Contratos vencendo: diário às 8h');
    console.log('   - Medições pendentes: seg/qui às 9h');
}

// Exportar funções para execução manual
export { checkExpiringContracts, checkPendingMeasurements };
