"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    LayoutGrid, Users, Settings, FileText, Bell, Search,
    Filter, ChevronDown, CheckCircle, Clock, AlertTriangle, Activity, Brain, X, RefreshCw,
    ArrowRight, Save, MessageSquare, Edit2
} from "lucide-react";
import { Session, AIInteraction } from "@/lib/types";
import { EXTRA_QUESTIONS_POOL } from "@/lib/triage";

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
    const [displayedSummary, setDisplayedSummary] = useState("");

    // Interactive Questions State
    const [activeQuestions, setActiveQuestions] = useState<Record<string, boolean>>({});
    const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
    const [savedInteractions, setSavedInteractions] = useState<AIInteraction[]>([]);

    // Edit Mode State
    const [editingInteractionIndex, setEditingInteractionIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    // Question Pool State for this session
    const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/campaign/${campaignId}/sessions?status=SUBMITTED`);
            const data = await res.json();

            // Sort: High Priority (red) first, then Media, then Normal. Then by Date.
            const sorted = data.sort((a: Session, b: Session) => {
                const getPrio = (s: Session) => {
                    const score = s.triage?.score ?? s.red_flag_score ?? 0;
                    if (score >= 70 || s.triage?.level === 'rojo') return 3;
                    if (score >= 40 || s.triage?.level === 'ambar') return 2;
                    return 1;
                };

                const pA = getPrio(a);
                const pB = getPrio(b);
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

    // Typewriter effect helper
    const typeWriterRef = useRef<NodeJS.Timeout | null>(null);

    const startTypewriter = (text: string) => {
        setDisplayedSummary("");
        if (typeWriterRef.current) clearInterval(typeWriterRef.current);

        let i = 0;
        typeWriterRef.current = setInterval(() => {
            setDisplayedSummary(text.slice(0, i + 1));
            i++;
            if (i >= text.length) {
                if (typeWriterRef.current) clearInterval(typeWriterRef.current);
            }
        }, 10);
    };

    // Track last init session to prevent re-renders wiping state
    const lastInitId = useRef<string | null>(null);

    // Watch for modal open
    useEffect(() => {
        // Only run if we have a session and it's a DIFFERENT session than last time
        if (insightsSession && insightsSession.id !== lastInitId.current) {
            lastInitId.current = insightsSession.id;

            // Init summary
            if (insightsSession.triage?.aiSummary) {
                startTypewriter(insightsSession.triage.aiSummary);
            }
            // Init questions (default ones from triage initially)
            // IMPORTANT: If we have saved interactions, we should filter them out from the initial pool
            // to avoid showing questions we already answered if they came from the triage list.
            const existingAnswers = insightsSession.ai_interactions?.map(i => i.question) || [];
            let initQuestions = insightsSession.triage?.aiQuestions || [];

            // Filter out already answered ones from the suggestion list
            initQuestions = initQuestions.filter(q => !existingAnswers.includes(q));

            setCurrentQuestions(initQuestions);

            // Init interactions
            setSavedInteractions(insightsSession.ai_interactions || []);
            // Reset local states
            setActiveQuestions({});
            setQuestionAnswers({});
            setEditingInteractionIndex(null);
        } else if (!insightsSession) {
            // Reset ref when modal closes
            lastInitId.current = null;
        }
    }, [insightsSession]);

    const handleRegenerateIA = async () => {
        setRegenerating(true);
        setDisplayedSummary(""); // Clear text

        // Simulate "Processing" delay
        await new Promise(r => setTimeout(r, 1000));

        setRegenerating(false);

        if (insightsSession?.triage?.aiSummary) startTypewriter(insightsSession?.triage?.aiSummary);

        // Shuffle Questions (Pick 3 new ones from pool)
        // Exclude ones already in savedInteractions
        const answeredQs = savedInteractions.map(i => i.question);

        const allPossible = Array.from(new Set([
            ...(insightsSession?.triage?.aiQuestions || []),
            ...EXTRA_QUESTIONS_POOL
        ])).filter(q => !answeredQs.includes(q));

        const shuffled = allPossible.sort(() => 0.5 - Math.random());
        setCurrentQuestions(shuffled.slice(0, 3));
    };

    const persistSessionUpdate = async (updatedSession: Session) => {
        setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
        try {
            await fetch(`/api/session/${updatedSession.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ai_interactions: updatedSession.ai_interactions,
                    reviewed: updatedSession.reviewed,
                    status: updatedSession.status
                })
            });
        } catch (e) { console.error("Failed to persist session", e); }
    };

    const handleMarkReviewed = async () => {
        if (!insightsSession) return;
        const updated = { ...insightsSession, reviewed: true, reviewed_at: new Date().toISOString() };
        setInsightsSession(null);
        await persistSessionUpdate(updated);
    };

    const toggleQuestionActive = (q: string) => {
        setActiveQuestions(prev => ({
            ...prev,
            [q]: !prev[q]
        }));
    };

    // REPLACED: Updated to handle Replenishment
    const handleSaveInteraction = async (q: string) => {
        const answer = questionAnswers[q];
        if (!answer || !answer.trim()) return;

        const newInteraction: AIInteraction = {
            question: q,
            answer: answer,
            added_at: new Date().toISOString()
        };

        const newInteractions = [...savedInteractions, newInteraction];
        setSavedInteractions(newInteractions);

        // Clear input state
        setActiveQuestions(prev => ({ ...prev, [q]: false }));
        setQuestionAnswers(prev => ({ ...prev, [q]: "" }));

        // REPLENISH LOGIC: Remove answered Q, Add new Q
        const remainingCurrent = currentQuestions.filter(cj => cj !== q);

        // Find existing answers to exclude
        const answeredQs = newInteractions.map(i => i.question);

        // Find candidate pool
        const candidates = EXTRA_QUESTIONS_POOL.filter(
            cand => !answeredQs.includes(cand) && !remainingCurrent.includes(cand)
        );

        let nextQuestions = [...remainingCurrent];
        if (candidates.length > 0) {
            // Pick random
            const nextQ = candidates[Math.floor(Math.random() * candidates.length)];
            nextQuestions.push(nextQ);
        }

        setCurrentQuestions(nextQuestions);

        // Persist
        if (insightsSession) {
            const updatedSession = { ...insightsSession, ai_interactions: newInteractions };
            setInsightsSession(updatedSession);
            await persistSessionUpdate(updatedSession);
        }
    };

    // EDIT LOGIC
    const startEditing = (index: number) => {
        setEditingInteractionIndex(index);
        setEditValue(savedInteractions[index].answer);
    };

    const cancelEditing = () => {
        setEditingInteractionIndex(null);
        setEditValue("");
    };

    const saveEdit = async (index: number) => {
        if (!editValue.trim()) return;

        const updatedInteractions = [...savedInteractions];
        updatedInteractions[index] = {
            ...updatedInteractions[index],
            answer: editValue
        };

        setSavedInteractions(updatedInteractions);
        setEditingInteractionIndex(null);
        setEditValue("");

        if (insightsSession) {
            const updatedSession = { ...insightsSession, ai_interactions: updatedInteractions };
            setInsightsSession(updatedSession);
            await persistSessionUpdate(updatedSession);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, [campaignId]);

    useEffect(() => {
        // Filter Logic ... (Same as before)
        let res = sessions;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter(s =>
                s.worker_id?.toLowerCase().includes(term) ||
                (s.answers?.['name'] && String(s.answers['name']).toLowerCase().includes(term)) ||
                (s.worker_firstname && s.worker_firstname.toLowerCase().includes(term)) ||
                (s.worker_lastname && s.worker_lastname.toLowerCase().includes(term))
            );
        }
        if (filterPriority !== "all") {
            if (filterPriority === "high") res = res.filter(s => (s.triage?.score ?? 0) >= 70);
            else if (filterPriority === "medium") res = res.filter(s => (s.triage?.score ?? 0) >= 40 && (s.triage?.score ?? 0) < 70);
            else if (filterPriority === "normal") res = res.filter(s => (s.triage?.score ?? 0) < 40);
        }
        setFiltered(res);
    }, [sessions, searchTerm, filterPriority]);

    const getPriorityBadge = (score: number, level?: string) => {
        const isRed = score >= 70 || level === 'rojo';
        const isAmber = !isRed && (score >= 40 || level === 'amber');

        if (isRed) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100/80 text-red-700 border border-red-200">ALTA</span>;
        if (isAmber) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/80 text-amber-700 border border-amber-200">MEDIA</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100/80 text-green-700 border border-green-200">NORMAL</span>;
    };

    const getPatientName = (s: Session) => {
        if (s.worker_firstname || s.worker_lastname) {
            return `${s.worker_firstname || ""} ${s.worker_lastname || ""}`.trim();
        }
        return s.answers?.['firstname'] || s.answers?.['name'] || "Sin nombre";
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
                    {/* ... (Same layout) */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => fetchSessions()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
                            <Activity size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">DR</div>
                    </div>
                </div>
            </nav>

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
                    {/* ... Select */}
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
                </div>

                {/* Table (Same) */}
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
                                        <button onClick={loadDemoData} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors">
                                            ⚡ Cargar Demo Data (10)
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(s => (
                                    <tr key={s.id} className={`transition-colors group ${!(s as any).reviewed ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700 align-top">{s.worker_id}</td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-slate-900">{getPatientName(s)}</div>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {s.triage?.reasons?.slice(0, 2).map((r, i) => (
                                                    <span key={i} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{r}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm align-top">
                                            {new Date(s.submitted_at || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center gap-2">
                                                {getPriorityBadge(s.triage?.score ?? s.red_flag_score, s.triage?.level)}
                                                <span className="text-xs font-mono text-slate-400 font-medium">{s.triage?.score ?? s.red_flag_score}/100</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {(s as any).reviewed ?
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✔ REVISADO</span> :
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">⚠️ PENDIENTE</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <div className="flex flex-col gap-2 items-end">
                                                <button onClick={() => setInsightsSession(s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors border border-indigo-100">
                                                    <Brain size={14} /> Ver IA
                                                </button>
                                                <button onClick={() => router.push(`/panel/report/${s.id}`)} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 text-xs font-bold hover:underline transition-colors mt-1">
                                                    Informe <ArrowRight size={12} />
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

            {/* IA INSIGHTS MODAL */}
            {insightsSession && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300" onClick={() => setInsightsSession(null)} />

                    <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col overflow-hidden border-l border-indigo-100 transform transition-all animate-slide-in-right">

                        {/* Header */}
                        <div className="px-6 py-3 border-b border-slate-100 bg-white/80 backdrop-blur flex justify-between items-center z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-50 rounded-lg">
                                    <Brain size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold leading-none text-slate-900">IA Insights: {getPatientName(insightsSession)}</h2>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Análisis Predictivo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                    <span className="text-xs font-bold text-slate-700">Score: {insightsSession.triage?.score}</span>
                                    {getPriorityBadge(insightsSession.triage?.score || 0, insightsSession.triage?.level)}
                                </div>
                                <button onClick={() => setInsightsSession(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {insightsSession.triage ? (
                            <div className="flex-1 overflow-y-auto p-0 bg-slate-50/30">
                                <div className="p-6 space-y-6">
                                    {/* Summary */}
                                    <div>
                                        <div className={`p-4 rounded-xl text-sm leading-relaxed border shadow-sm relative transition-all ${insightsSession.triage.level === 'rojo' ? 'bg-red-50/50 text-slate-800 border-red-100' : 'bg-white text-slate-700 border-indigo-100'}`}>
                                            <span className="block min-h-[40px] font-medium">
                                                {displayedSummary}
                                                {regenerating && <span className="inline-block w-1.5 h-3.5 bg-indigo-500 animate-pulse ml-0.5 align-middle"></span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* History (Editable) */}
                                    {savedInteractions.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Historial de Interacciones</h3>
                                            {savedInteractions.map((inter, i) => (
                                                <div key={i} className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-sm group relative">
                                                    <p className="text-slate-500 text-xs mb-1 font-medium">{inter.question}</p>

                                                    {editingInteractionIndex === i ? (
                                                        <div className="mt-1">
                                                            <textarea
                                                                className="w-full text-sm p-2 border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <button onClick={cancelEditing} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
                                                                <button onClick={() => saveEdit(i)} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700">Guardar</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between items-start gap-2">
                                                            <p className="text-emerald-900 font-medium">{inter.answer}</p>
                                                            <button
                                                                onClick={() => startEditing(i)}
                                                                className="text-emerald-400 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                title="Editar respuesta"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Current Questions */}
                                    <div>
                                        <div className="flex justify-between items-end mb-3 px-1">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preguntas Sugeridas</h3>
                                            <button
                                                onClick={handleRegenerateIA}
                                                disabled={regenerating}
                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wide cursor-pointer"
                                            >
                                                <RefreshCw size={10} className={regenerating ? "animate-spin" : ""} />
                                                {regenerating ? "Generando..." : "Nuevas Preguntas"}
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {currentQuestions.map((q, i) => {
                                                const isActive = activeQuestions[q];
                                                return (
                                                    <div key={i} className={`rounded-xl border transition-all duration-300 overflow-hidden bg-white ${isActive ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                                                        <div className="flex gap-3 items-start p-3 cursor-pointer select-none" onClick={() => toggleQuestionActive(q)}>
                                                            <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                                {isActive ? <CheckCircle size={12} className="text-white" /> : <MessageSquare size={12} className="text-slate-300" />}
                                                            </div>
                                                            <span className={`text-sm leading-snug ${isActive ? 'text-indigo-900 font-bold' : 'text-slate-600'}`}>{q}</span>
                                                        </div>

                                                        {isActive && (
                                                            <div className="px-3 pb-3 pt-0 animate-fade-in-down">
                                                                <div className="relative">
                                                                    <textarea
                                                                        autoFocus
                                                                        placeholder="Escribe la respuesta del paciente..."
                                                                        className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white transition-colors resize-none h-20 text-slate-800 placeholder:text-slate-400"
                                                                        value={questionAnswers[q] || ""}
                                                                        onChange={e => setQuestionAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                e.preventDefault();
                                                                                handleSaveInteraction(q);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleSaveInteraction(q)}
                                                                        className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        disabled={!questionAnswers[q]?.trim()}
                                                                        title="Guardar respuesta"
                                                                    >
                                                                        <Save size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Reasons */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1 mt-4">Factores de Riesgo</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {insightsSession.triage.reasons.length > 0 ?
                                                insightsSession.triage.reasons.map((r, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600">
                                                        <AlertTriangle size={10} className="text-amber-500" />
                                                        {r}
                                                    </span>
                                                )) : <span className="text-slate-400 italic text-xs">Sin factores específicos.</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                                <Brain size={64} className="mb-4 opacity-10 text-indigo-500" />
                                <p>Análisis no disponible.</p>
                            </div>
                        )}

                        {/* Footer - IMPROVED LAYOUT */}
                        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 pb-8">
                            <button
                                onClick={() => router.push(`/panel/report/${insightsSession.id}`)}
                                className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all group"
                            >
                                <FileText size={18} className="text-indigo-400 group-hover:text-indigo-300" />
                                <span>VER INFORME COMPLETO</span>
                                <ArrowRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button
                                onClick={handleMarkReviewed}
                                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs shadow-sm border border-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-wide"
                            >
                                <CheckCircle size={16} />
                                Marcar Revisado y Cerrar
                            </button>
                        </div>
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
