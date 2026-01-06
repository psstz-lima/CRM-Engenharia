"use client";
import React from "react";

type SignInResult = { status?: number; error?: string; url?: string };

export const signIn = async (
    providerOrType: string,
    options?: Record<string, any>
): Promise<SignInResult> => {
    // credentials flow used in this project for demo/admin
    if (providerOrType === "credentials") {
        const { username, password } = options || {};
        if (username === "admin" && password === "admin123") {
            return { status: 200 };
        }
        return { error: "Invalid credentials" };
    }

    // For social providers just simulate success (static sites can't perform OAuth)
    return { status: 200, url: "/" };
};

export const useSession = () => {
    return { data: null };
};

export const SessionProvider = ({ children, session }: any) => {
    return <>{children}</>;
};

export default {};
