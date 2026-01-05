import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'dark' | 'light' | 'ocean';

interface ThemeContextType {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    themes: { id: ThemeName; name: string; icon: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'crm-theme';

const themes = [
    { id: 'dark' as ThemeName, name: 'Dark Premium', icon: '🌙', description: 'Tema escuro elegante com tons de índigo' },
    { id: 'light' as ThemeName, name: 'Light Premium', icon: '☀️', description: 'Tema claro com contraste suave' },
    { id: 'ocean' as ThemeName, name: 'Ocean', icon: '🌊', description: 'Tons de azul marinho profundo' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return (saved as ThemeName) || 'dark';
    });

    const setTheme = (newTheme: ThemeName) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    useEffect(() => {
        // Remove all theme classes
        document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-ocean');
        // Add current theme class
        document.documentElement.classList.add(`theme-${theme}`);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
