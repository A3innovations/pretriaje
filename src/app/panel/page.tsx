"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    LayoutGrid, Users, Settings, FileText, Bell, Search,
    Filter, ChevronDown, CheckCircle, Clock, AlertTriangle, Activity
} from "lucide-react";
import { Session } from "@/lib/types";

import { Suspense } from "react";

function PanelContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const campaignId = searchParams.get("campaign_id") || "demo-campaign";

    const [sessions, setSessions] = useState<Session[]>([]);
    const [filtered, setFiltered] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");

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
        <div className="min-h-screen bg-[#F7F8FA] font-sans text-slate-900">
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
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">DNI</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay pacientes</td></tr>
                            ) : (
                                filtered.map(s => (
                                    <tr key={s.id} className={`transition-colors group ${!(s as any).reviewed ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{s.worker_id}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{s.answers?.['firstname'] || s.answers?.['name'] || "Sin nombre"}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(s.submitted_at || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">{getPriorityBadge(s.red_flag_score)}</td>
                                        <td className="px-6 py-4">
                                            {(s as any).reviewed ?
                                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                                    <CheckCircle size={14} className="mr-1.5" strokeWidth={2.5} /> REVISADO
                                                </span> :
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                                    ⚠️ PENDIENTE
                                                </span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.push(`/panel/report/${s.id}`)}
                                                className="text-indigo-600 font-medium text-sm hover:underline decoration-2 underline-offset-2"
                                            >
                                                Ver informe
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
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
