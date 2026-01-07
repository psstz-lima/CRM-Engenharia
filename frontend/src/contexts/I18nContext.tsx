import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface Translations {
    [key: string]: string | Translations;
}

// Traduções
const translations: Record<Language, Translations> = {
    'pt-BR': {
        common: {
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            create: 'Criar',
            search: 'Buscar',
            filter: 'Filtrar',
            export: 'Exportar',
            import: 'Importar',
            loading: 'Carregando...',
            success: 'Sucesso!',
            error: 'Erro',
            confirm: 'Confirmar',
            back: 'Voltar',
            next: 'Próximo',
            yes: 'Sim',
            no: 'Não',
            all: 'Todos',
            none: 'Nenhum',
            actions: 'Ações'
        },
        auth: {
            login: 'Entrar',
            logout: 'Sair',
            email: 'E-mail',
            password: 'Senha',
            forgotPassword: 'Esqueci minha senha',
            welcomeBack: 'Bem-vindo de volta'
        },
        contracts: {
            title: 'Contratos',
            contract: 'Contrato',
            number: 'Número',
            company: 'Empresa',
            object: 'Objeto',
            value: 'Valor',
            startDate: 'Data Início',
            endDate: 'Data Fim',
            status: 'Status',
            active: 'Ativo',
            inactive: 'Inativo'
        },
        measurements: {
            title: 'Medições',
            measurement: 'Medição',
            period: 'Período',
            status: 'Status',
            draft: 'Rascunho',
            closed: 'Fechada',
            approved: 'Aprovada',
            quantity: 'Quantidade',
            unit: 'Unidade'
        },
        dashboard: {
            title: 'Dashboard',
            overview: 'Visão Geral',
            totalContracts: 'Total de Contratos',
            activeMeasurements: 'Medições Ativas',
            pendingApprovals: 'Aprovações Pendentes',
            expiringContracts: 'Contratos Vencendo'
        }
    },
    'en-US': {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            create: 'Create',
            search: 'Search',
            filter: 'Filter',
            export: 'Export',
            import: 'Import',
            loading: 'Loading...',
            success: 'Success!',
            error: 'Error',
            confirm: 'Confirm',
            back: 'Back',
            next: 'Next',
            yes: 'Yes',
            no: 'No',
            all: 'All',
            none: 'None',
            actions: 'Actions'
        },
        auth: {
            login: 'Login',
            logout: 'Logout',
            email: 'Email',
            password: 'Password',
            forgotPassword: 'Forgot password',
            welcomeBack: 'Welcome back'
        },
        contracts: {
            title: 'Contracts',
            contract: 'Contract',
            number: 'Number',
            company: 'Company',
            object: 'Object',
            value: 'Value',
            startDate: 'Start Date',
            endDate: 'End Date',
            status: 'Status',
            active: 'Active',
            inactive: 'Inactive'
        },
        measurements: {
            title: 'Measurements',
            measurement: 'Measurement',
            period: 'Period',
            status: 'Status',
            draft: 'Draft',
            closed: 'Closed',
            approved: 'Approved',
            quantity: 'Quantity',
            unit: 'Unit'
        },
        dashboard: {
            title: 'Dashboard',
            overview: 'Overview',
            totalContracts: 'Total Contracts',
            activeMeasurements: 'Active Measurements',
            pendingApprovals: 'Pending Approvals',
            expiringContracts: 'Expiring Contracts'
        }
    },
    'es-ES': {
        common: {
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            create: 'Crear',
            search: 'Buscar',
            filter: 'Filtrar',
            export: 'Exportar',
            import: 'Importar',
            loading: 'Cargando...',
            success: '¡Éxito!',
            error: 'Error',
            confirm: 'Confirmar',
            back: 'Volver',
            next: 'Siguiente',
            yes: 'Sí',
            no: 'No',
            all: 'Todos',
            none: 'Ninguno',
            actions: 'Acciones'
        },
        auth: {
            login: 'Iniciar sesión',
            logout: 'Cerrar sesión',
            email: 'Correo',
            password: 'Contraseña',
            forgotPassword: 'Olvidé mi contraseña',
            welcomeBack: 'Bienvenido de nuevo'
        },
        contracts: {
            title: 'Contratos',
            contract: 'Contrato',
            number: 'Número',
            company: 'Empresa',
            object: 'Objeto',
            value: 'Valor',
            startDate: 'Fecha Inicio',
            endDate: 'Fecha Fin',
            status: 'Estado',
            active: 'Activo',
            inactive: 'Inactivo'
        },
        measurements: {
            title: 'Mediciones',
            measurement: 'Medición',
            period: 'Período',
            status: 'Estado',
            draft: 'Borrador',
            closed: 'Cerrada',
            approved: 'Aprobada',
            quantity: 'Cantidad',
            unit: 'Unidad'
        },
        dashboard: {
            title: 'Panel',
            overview: 'Vista General',
            totalContracts: 'Total de Contratos',
            activeMeasurements: 'Mediciones Activas',
            pendingApprovals: 'Aprobaciones Pendientes',
            expiringContracts: 'Contratos por Vencer'
        }
    }
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    availableLanguages: { code: Language; name: string; flag: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved as Language) || 'pt-BR';
    });

    const availableLanguages = [
        { code: 'pt-BR' as Language, name: 'Português', flag: '🇧🇷' },
        { code: 'en-US' as Language, name: 'English', flag: '🇺🇸' },
        { code: 'es-ES' as Language, name: 'Español', flag: '🇪🇸' }
    ];

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation missing: ${key} for ${language}`);
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

// Language Selector component
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
    const { language, setLanguage, availableLanguages } = useI18n();
    const current = availableLanguages.find(l => l.code === language);

    if (compact) {
        return (
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
                {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.code.split('-')[0].toUpperCase()}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <div className="flex gap-2">
            {availableLanguages.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${language === lang.code
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                </button>
            ))}
        </div>
    );
}
