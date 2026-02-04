"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Session } from "@/lib/types";
import {
    Printer, ArrowLeft, AlertTriangle, FileText, CheckCircle,
    Clock, Activity, Check, User, Brain
} from "lucide-react";
import questionsData from "@/lib/questions.json";

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReviewed, setIsReviewed] = useState(false);

    useEffect(() => {
        fetch(`/api/report/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then((data) => {
                setSession(data);
                setIsReviewed(!!data.reviewed); // Ensure boolean
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const markReviewed = async () => {
        if (!session) return;
        setIsReviewed(true); // Optimistic UI update
        try {
            const res = await fetch(`/api/report/${params.id}/reviews`, { method: "POST" });
            if (!res.ok) throw new Error("Failed");
            // Don't parse JSON if not needed, or handle empty response
            // const data = await res.json(); 
        } catch (e) {
            setIsReviewed(false); // Revert on error
            alert("Error al marcar como revisado: " + e);
        }
    };

    const getPriorityBadge = (score: number) => {
        if (score >= 5) return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">ALTA PRIORIDAD</span>;
        if (score >= 3) return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">MEDIA PRIORIDAD</span>;
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">NORMAL</span>;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando informe...</div>;
    if (!session) return <div className="min-h-screen flex items-center justify-center text-slate-400">Informe no disponible</div>;

    const priorityBadge = getPriorityBadge((session as any).red_flag_score || 0);

    return (
        <div className="min-h-screen bg-[#F7F8FA] font-sans pb-12 print:bg-white print:pb-0">
            {/* Topbar (Hidden on Print) */}
            <nav className="bg-white border-b border-slate-200 h-16 shadow-sm print:hidden sticky top-0 z-30">
                <div className="max-w-[1120px] mx-auto px-6 h-full flex items-center justify-between">
                    <button onClick={() => router.push('/panel')} className="flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                        <ArrowLeft className="mr-2" size={18} /> Volver a la cola
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm uppercase tracking-wide">Informe Médico</span>
                    </div>
                </div>
            </nav>

            <div className="max-w-[1120px] mx-auto px-6 py-8 print:max-w-none print:px-8 print:py-0">

                {/* Header Card */}
                <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 print:shadow-none print:border-0 print:p-0 print:mb-8 print:border-b-2 print:border-slate-800 print:rounded-none">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none print:text-4xl">
                                {session.worker_firstname ? `${session.worker_firstname} ${session.worker_lastname || ''}` : (session.answers?.['firstname'] || session.answers?.['name'] || "Paciente Sin Nombre")}
                            </h1>
                            <div className="print:hidden">{priorityBadge}</div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-mono text-sm print:text-slate-900">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200 print:border-0 print:bg-transparent print:p-0">
                                <span className="font-bold text-slate-700">ID:</span> {session.worker_id}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} className="print:hidden" />
                                {new Date(session.submitted_at!).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="btn h-12 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-xl font-semibold flex items-center"
                        >
                            <Printer className="mr-2" size={18} /> Imprimir
                        </button>
                        <button
                            onClick={markReviewed}
                            disabled={isReviewed || session.reviewed}
                            className={`btn h-12 px-6 rounded-xl font-semibold shadow-md transition-all flex items-center transform active:scale-95 ${isReviewed || session.reviewed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                                }`}
                        >
                            {isReviewed || session.reviewed ? (
                                <><Check size={18} className="mr-2" /> Revisado</>
                            ) : (
                                "Marcar como Revisado"
                            )}
                        </button>
                    </div>
                </header>

                {/* REVIEWED Banner */}
                {(isReviewed || session.reviewed) && (
                    <div className="mb-8 bg-emerald-600 rounded-xl p-6 shadow-lg flex items-center justify-between text-white animate-in zoom-in-95 duration-300 print:bg-white print:text-black print:border-2 print:border-emerald-600">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Check size={28} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Informe Revisado</h3>
                                <p className="text-emerald-100 font-medium print:text-slate-500">
                                    {(session.reviewed_at || isReviewed)
                                        ? `Validado por equipo médico el ${new Date(session.reviewed_at || new Date().toISOString()).toLocaleString()}`
                                        : 'Validado por equipo médico'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI INTERVIEW SECTION - ADDED */}
                {(session.ai_interactions && session.ai_interactions.length > 0) && (
                    <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6 break-inside-avoid print:shadow-none print:border print:border-slate-300">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 print:border-slate-300">
                            <Brain className="text-indigo-600 print:text-black" size={20} />
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest print:text-black">Entrevista Clínica Asistida por IA</h2>
                        </div>

                        <div className="space-y-4">
                            {session.ai_interactions.map((inter: any, i: number) => (
                                <div key={i} className="bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-xl p-4 print:bg-white print:border-slate-300">
                                    <p className="text-sm text-slate-500 font-bold mb-2 print:text-black">
                                        <span className="text-indigo-400 mr-2 print:text-black">P:</span>
                                        {inter.question}
                                    </p>
                                    <div className="pl-6 border-l-2 border-indigo-100 print:border-slate-400">
                                        <p className="text-base text-slate-800 font-medium print:text-black">
                                            {inter.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Section (Alerts) */}
                {(session as any).red_flag_score > 0 ? (
                    <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm print:border-2 print:border-red-500 print:bg-white">
                        <h3 className="text-sm font-bold text-red-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} /> Alertas Clínicas Detectadas
                        </h3>
                        {/* Iterate over actual red flags if available, otherwise generic message */}
                        {(session as any).red_flags && (session as any).red_flags.length > 0 ? (
                            <ul className="space-y-2 mb-2">
                                {(session as any).red_flags.map((flag: any, i: number) => (
                                    <li key={i} className="flex gap-2 text-red-700 text-sm font-medium">
                                        <span className="mt-1">•</span>
                                        <span>{flag.title || "Indicador de riesgo detectado"}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-red-700 text-sm">
                                Se han detectado respuestas que indican riesgo. Revise el detalle a continuación.
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="mb-8 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-slate-600 shadow-sm print:hidden">
                        <CheckCircle size={20} />
                        <span className="font-medium">Sin alertas clínicas detectadas. Valores dentro de la normalidad.</span>
                    </div>
                )}

                {/* Modules Grid */}
                <div className="grid grid-cols-1 gap-6 print:block print:space-y-8">

                    {/* Core Data */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid print:shadow-none print:border print:border-slate-300">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-700 uppercase text-sm tracking-wider flex items-center gap-2 print:bg-slate-100 print:text-black">
                            <Activity size={16} className="text-indigo-500 print:text-black" /> Datos Generales
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {questionsData.core.filter((q: any) => session.answers?.[q.id]).map((q: any) => {
                                const answer = session.answers[q.id];
                                const otherText = session.answers[q.id + '_other'];

                                // Format value
                                let displayValue = Array.isArray(answer) ? answer.join(", ") : String(answer);

                                // Append "Other" text if present
                                if (otherText) {
                                    displayValue += ` (Otro: ${otherText})`;
                                }

                                return (
                                    <div key={q.id} className="border-b border-slate-100 pb-2 last:border-0 print:border-slate-300">
                                        <dt className="text-xs font-bold text-slate-500 uppercase mb-1 print:text-black">{q.text}</dt>
                                        <dd className="text-slate-900 font-medium text-lg print:text-black">
                                            {displayValue}
                                        </dd>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Dynamic Modules */}
                    {questionsData.modules.map((mod: any) => {
                        const hasAnswers = mod.questions.some((q: any) => session.answers?.[q.id]);
                        if (!hasAnswers) return null;

                        return (
                            <section key={mod.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid print:shadow-none print:border print:border-slate-300 print:mt-6">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-700 uppercase text-sm tracking-wider flex items-center gap-2 print:bg-slate-100 print:text-black">
                                    <FileText size={16} className="text-slate-400 print:hidden" />
                                    Módulo: {mod.id === 'screens' ? 'Pantallas / Visión' :
                                        mod.id === 'loads' ? 'Cargas y Posturas' :
                                            mod.id === 'noise' ? 'Ruido y Audición' :
                                                mod.id === 'chemicals_dust' ? 'Químicos y Respiratorio' :
                                                    mod.id === 'driving_machinery' ? 'Conducción y Maquinaria' :
                                                        mod.id === 'heights' ? 'Trabajo en Altura' :
                                                            mod.id === 'bio_risk' ? 'Riesgo Biológico' : mod.id}
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    {mod.questions.filter((q: any) => session.answers?.[q.id]).map((q: any) => (
                                        <div key={q.id} className="border-b border-slate-100 pb-2 last:border-0 print:border-slate-300">
                                            <dt className="text-xs font-bold text-slate-500 uppercase mb-1 print:text-black">{q.text}</dt>
                                            <dd className="text-slate-900 font-medium text-lg print:text-black">
                                                {Array.isArray(session.answers[q.id]) ? session.answers[q.id].join(", ") : String(session.answers[q.id])}
                                            </dd>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}
