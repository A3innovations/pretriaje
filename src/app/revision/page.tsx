"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import questionsData from "@/lib/questions.json";
import { Send, FileText, ArrowRight } from "lucide-react";

export default function RevisionPage() {
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const sid = sessionStorage.getItem("session_id");
        if (!sid) {
            router.push("/start");
            return;
        }
        setSessionId(sid);

        fetch(`/api/session/${sid}`)
            .then(res => res.json())
            .then(data => {
                setAnswers(data.answers || {});
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    const [analyzing, setAnalyzing] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        setAnalyzing(true);

        // FAKE DELAY for "IA Analysis"
        await new Promise(r => setTimeout(r, 1500));

        try {
            const res = await fetch(`/api/session/${sessionId}/submit`, {
                method: "POST",
            });
            if (res.ok) {
                router.push("/confirmacion");
            } else {
                alert("Error al enviar. Inténtalo de nuevo.");
                setAnalyzing(false);
            }
        } catch (e) {
            alert("Error de conexión.");
            setAnalyzing(false);
        } finally {
            setSubmitting(false);
        }
    };

    // ...

    if (analyzing) return (
        <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white p-6 font-sans">
            <div className="w-24 h-24 relative mb-8">
                <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-white rounded-full flex items-center justify-center">
                    <span className="text-3xl">🤖</span>
                </div>
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Analizando respuestas...</h2>
            <p className="text-indigo-200 text-lg">Calculando nivel de prioridad con IA</p>
        </div>
    );

    if (loading) return <div className="page-container justify-center text-center">Cargando revisión...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-32">

            <div className="pt-8 px-6 pb-4 anim-enter max-w-md mx-auto w-full">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                    Revisión Final
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                    Confirma tus datos antes de enviarlos.
                </p>
            </div>

            <div className="flex-1 px-6 overflow-y-auto anim-enter max-w-md mx-auto w-full space-y-4" style={{ animationDelay: "100ms" }}>
                {Object.entries(answers).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        No hay respuestas registradas.
                    </div>
                ) : (
                    Object.entries(answers).map(([key, val], idx) => (
                        <div key={key} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                {getQuestionText(key)}
                            </div>
                            <div className="text-lg font-medium text-slate-900 break-words">
                                {formatValue(val)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-6 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-center transition-all transform active:scale-[0.98]"
                    >
                        {submitting ? "Enviando..." : "Enviar al médico"}
                        {!submitting && <Send size={24} className="ml-3" />}
                    </button>
                </div>
            </div>

        </div>
    );
}
