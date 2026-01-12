import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Utils', () => {
    describe('Password Hashing', () => {
        it('deve gerar hash de senha corretamente', async () => {
            const password = 'MinhaSenh@123';
            const hash = await bcrypt.hash(password, 10);

            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('deve validar senha correta', async () => {
            const password = 'MinhaSenh@123';
            const hash = await bcrypt.hash(password, 10);

            const isValid = await bcrypt.compare(password, hash);
            expect(isValid).toBe(true);
        });

        it('deve rejeitar senha incorreta', async () => {
            const password = 'MinhaSenh@123';
            const hash = await bcrypt.hash(password, 10);

            const isValid = await bcrypt.compare('SenhaErrada', hash);
            expect(isValid).toBe(false);
        });
    });

    describe('JWT', () => {
        const secret = 'test-secret';

        it('deve gerar token JWT válido', () => {
            const payload = { userId: '123', email: 'test@test.com' };
            const token = jwt.sign(payload, secret, { expiresIn: '1h' });

            expect(token).toBeDefined();
            expect(token.split('.').length).toBe(3);
        });

        it('deve decodificar token corretamente', () => {
            const payload = { userId: '123', email: 'test@test.com' };
            const token = jwt.sign(payload, secret, { expiresIn: '1h' });

            const decoded = jwt.verify(token, secret) as any;
            expect(decoded.userId).toBe('123');
            expect(decoded.email).toBe('test@test.com');
        });

        it('deve rejeitar token inválido', () => {
            expect(() => {
                jwt.verify('token-invalido', secret);
            }).toThrow();
        });

        it('deve rejeitar token expirado', () => {
            const token = jwt.sign({ userId: '123' }, secret, { expiresIn: '-1s' });

            expect(() => {
                jwt.verify(token, secret);
            }).toThrow();
        });
    });
});
