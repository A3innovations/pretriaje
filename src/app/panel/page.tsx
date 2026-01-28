"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    LayoutGrid, Users, Settings, FileText, Bell, Search,
    Filter, ChevronDown, CheckCircle, Clock, AlertTriangle, Activity, Brain, X, RefreshCw
} from "lucide-react";
import { Session } from "@/lib/types";

function PanelContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const campaignId = searchParams.get("campaign_id") || "demo-campaign";

    const [sessions, setSessions] = useState<Session[]>([]);
    const [filtered, setFiltered] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");

    // Insights Modal State
    const [insightsSession, setInsightsSession] = useState<Session | null>(null);
    const [regenerating, setRegenerating] = useState(false);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/campaign/${campaignId}/sessions?status=SUBMITTED`);
            const data = await res.json();
            // Sort: High Priority (red) first, then Media, then Normal. Then by Date.
            // Priority: Score >= 5 (High), 3-4 (Med), <3 (Low)
            const sorted = data.sort((a: Session, b: Session) => {
                const getPrio = (s: number) => s >= 5 ? 3 : (s >= 3 ? 2 : 1);
                const pA = getPrio(a.red_flag_score);
                const pB = getPrio(b.red_flag_score);
                if (pA !== pB) return pB - pA; // Higher prio first
                return new Date(b.submitted_at || "").getTime() - new Date(a.submitted_at || "").getTime();
            });
            setSessions(sorted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadDemoData = async () => {
        if (!confirm("¿Cargar 10 pacientes de prueba?")) return;
        setLoading(true);
        await fetch("/api/demo/seed", { method: "POST" });
        fetchSessions();
    };

    const handleRegenerateIA = async () => {
        setRegenerating(true);
        await new Promise(r => setTimeout(r, 800)); // Fake visual delay
        setRegenerating(false);
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, [campaignId]);

    useEffect(() => {
        let res = sessions;

        // Filter Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter(s =>
                s.worker_id?.toLowerCase().includes(term) ||
                (s.answers?.['name'] && String(s.answers['name']).toLowerCase().includes(term))
            );
        }

        // Filter Priority
        if (filterPriority !== "all") {
            if (filterPriority === "high") res = res.filter(s => s.red_flag_score >= 5);
            else if (filterPriority === "medium") res = res.filter(s => s.red_flag_score >= 3 && s.red_flag_score < 5);
            else if (filterPriority === "normal") res = res.filter(s => s.red_flag_score < 3);
        }

        setFiltered(res);
    }, [sessions, searchTerm, filterPriority]);

    const getPriorityBadge = (score: number) => {
        if (score >= 5) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100/80 text-red-700 border border-red-200">ALTA</span>;
        if (score >= 3) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/80 text-amber-700 border border-amber-200">MEDIA</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100/80 text-green-700 border border-green-200">NORMAL</span>;
    };

    return (
        <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900 relative">
            {/* Topbar sticky */}
            <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 shadow-sm">
                <div className="max-w-[1120px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">PT</div>
                        <h1 className="font-bold text-lg tracking-tight">Pre-Triaje</h1>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs font-semibold text-slate-600 uppercase">Campaña Activa &bull; Unidad 01</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => fetchSessions()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
                            <Activity size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">DR</div>
                    </div>
                </div>
            </nav>

            {/* Main Content Centered 1120px */}
            <main className="max-w-[1120px] mx-auto px-6 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pacientes en espera</h2>
                        <p className="text-slate-500 mt-1">Gestión de cola en tiempo real</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-2 flex items-center gap-2">
                            <span className="text-2xl font-bold text-indigo-600">{filtered.length}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm"
                            placeholder="Buscar por DNI o nombre..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-3 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                        >
                            <option value="all">Prioridad: Todas</option>
                            <option value="high">Alta</option>
                            <option value="medium">Media</option>
                            <option value="normal">Normal</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        {/* Placeholder for "Hide Reviewed" toggle if implemented later */}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">DNI</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente / Motivos</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">IA Score</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-slate-400 mb-4">No hay pacientes en cola de hoy.</p>
                                        <button
                                            onClick={loadDemoData}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            ⚡ Cargar Demo Data (10)
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(s => (
                                    <tr key={s.id} className={`transition-colors group ${!(s as any).reviewed ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700 align-top">{s.worker_id}</td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-slate-900">{s.answers?.['firstname'] || s.answers?.['name'] || "Sin nombre"}</div>
                                            {/* AI Reason Chips */}
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {s.triage?.reasons?.slice(0, 2).map((r, i) => (
                                                    <span key={i} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        {r}
                                                    </span>
                                                ))}
                                                {(!s.triage?.reasons || s.triage.reasons.length === 0) && (
                                                    <span className="text-xs text-slate-400 italic">Sin hallazgos relevantes</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm align-top">
                                            {new Date(s.submitted_at || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center gap-2">
                                                {getPriorityBadge(s.red_flag_score)}
                                                <span className="text-xs font-mono text-slate-400 font-medium">
                                                    {s.triage?.score ?? s.red_flag_score}/100
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {(s as any).reviewed ?
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    ✔ REVISADO
                                                </span> :
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                                    ⚠️ PENDIENTE
                                                </span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <div className="flex flex-col gap-2 items-end">
                                                <button
                                                    onClick={() => setInsightsSession(s)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors border border-indigo-100"
                                                >
                                                    <Brain size={14} />
                                                    Ver IA
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/panel/report/${s.id}`)}
                                                    className="text-slate-400 hover:text-indigo-600 text-xs font-medium hover:underline"
                                                >
                                                    Ver informe completo
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* IA INSIGHTS MODAL (Simple implementation) */}
            {insightsSession && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setInsightsSession(null)} />
                    <div className="relative w-full max-w-md bg-white shadow-2xl h-full p-6 overflow-y-auto border-l border-slate-200 anim-enter-slide-left">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-indigo-700">
                                <Brain size={24} />
                                <h2 className="text-xl font-bold">IA Insights</h2>
                            </div>
                            <button onClick={() => setInsightsSession(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Valid Triage Data check */}
                        {insightsSession.triage ? (
                            <div className="space-y-6">
                                {/* Score Block */}
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-5xl font-extrabold text-slate-800 mb-2">
                                        {insightsSession.triage.score}
                                        <span className="text-xl text-slate-400 font-normal">/100</span>
                                    </div>
                                    <div className="mb-4">
                                        {getPriorityBadge(insightsSession.triage.score)}
                                    </div>
                                    <p className="text-sm text-slate-500 leading-snug">
                                        Calculado basado en {Object.keys(insightsSession.answers).length} respuestas y patrones de riesgo.
                                    </p>
                                </div>

                                {/* Summary */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Resumen Clínico Generativo</h3>
                                    <div className="p-4 bg-indigo-50 rounded-xl text-indigo-900 text-sm leading-relaxed border border-indigo-100">
                                        {insightsSession.triage.aiSummary}
                                    </div>
                                </div>

                                {/* Reasons */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Factores Clave</h3>
                                    <ul className="space-y-2">
                                        {insightsSession.triage.reasons.length > 0 ? (
                                            insightsSession.triage.reasons.map((r, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                                    <span>{r}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-slate-400 italic text-sm">No se detectaron factores de riesgo específicos.</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Suggested Questions */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Preguntas Sugeridas</h3>
                                    <div className="space-y-2">
                                        {insightsSession.triage.aiQuestions.map((q, i) => (
                                            <label key={i} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                                                <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                                <span className="text-sm text-slate-700">{q}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-6 border-t border-slate-100 flex gap-3">
                                    <button
                                        onClick={handleRegenerateIA}
                                        className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} className={regenerating ? "animate-spin" : ""} />
                                        {regenerating ? "Regenerando..." : "Regenerar"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            // TODO: Mark reviewed
                                            // For demo visual, just close
                                            setInsightsSession(null);
                                        }}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200"
                                    >
                                        Marcar Revisado
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Brain size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Datos de IA no disponibles para esta sesión antigua.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PanelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando panel...</div>}>
            <PanelContent />
        </Suspense>
    );
}
