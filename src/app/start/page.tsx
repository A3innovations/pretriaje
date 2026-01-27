"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { ShieldCheck, Lock } from "lucide-react";

function StartContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const campaignId = searchParams.get("campaign_id") || "demo-campaign";
    const token = searchParams.get("token") || "token123";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStart = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/session/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId, token }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al iniciar sesión");
            }

            sessionStorage.setItem("session_id", data.sessionId);
            router.push("/identificacion");
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="page-container justify-center">
            <div className="anim-enter flex flex-col items-center text-center">

                {/* Hero Icon */}
                <div className="w-24 h-24 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-8 shadow-sm text-[var(--primary)]">
                    <ShieldCheck size={48} strokeWidth={1.5} />
                </div>

                <h1 className="display-title mb-4">
                    Pre-triaje médico
                </h1>

                <p className="body-lead max-w-[280px] mx-auto mb-10">
                    Responde unas preguntas breves para agilizar tu revisión de hoy.
                </p>

                {error && (
                    <div className="p-4 mb-6 text-sm text-[var(--error)] bg-[var(--error-bg)] rounded-xl w-full border border-red-100">
                        {error}
                    </div>
                )}

                <div className="w-full space-y-6">
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? "Iniciando..." : "Empezar ahora"}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[var(--text-scnd)] text-xs">
                        <Lock size={12} />
                        <span>Datos protegidos y confidenciales</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function StartPage() {
    return (
        <Suspense fallback={<div className="page-container justify-center items-center">Cargando...</div>}>
            <StartContent />
        </Suspense>
    );
}
