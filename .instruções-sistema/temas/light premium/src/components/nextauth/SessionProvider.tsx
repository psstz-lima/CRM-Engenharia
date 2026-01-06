"use client";
import React from "react";
import { SessionProvider } from "@/lib/authMock";

export default function SessionProviderComp({
    children,
    session,
}: {
    children: React.ReactNode;
    session: any;
}) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
