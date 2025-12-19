import { config } from '../../config';

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const policy = config.passwordPolicy;

    if (password.length < policy.minLength) {
        errors.push(`A senha deve ter no mínimo ${policy.minLength} caracteres`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('A senha deve conter pelo menos uma letra minúscula');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
        errors.push('A senha deve conter pelo menos um número');
    }

    if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('A senha deve conter pelo menos um caractere especial');
    }

    // Bloquear senhas fracas comuns
    const weakPasswords = ['password', 'senha', '12345678', 'qwerty', 'abc123'];
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        errors.push('A senha é muito fraca. Evite sequências previsíveis');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};
