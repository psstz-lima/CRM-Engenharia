import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    auth: { user: config.email.user, pass: config.email.pass },
});

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        await transporter.sendMail({ from: config.email.from, to, subject, html });
    } catch (e) {
        console.error('Email error:', e);
    }
}
