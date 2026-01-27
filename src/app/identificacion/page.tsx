"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User, Calendar, Mail } from "lucide-react";

export default function IdentificationPage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [dni, setDni] = useState("");
    const [dob, setDob] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        // Client-side only
        const sid = sessionStorage.getItem("session_id");
        if (!sid) {
            router.push("/start");
        } else {
            setSessionId(sid);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionId) return;

        // Validation: 18+
        if (dob) {
            const birth = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            if (age < 18) {
                alert("Debes ser mayor de 18 años para realizar este pre-triaje.");
                return;
            }
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/session/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    worker_id: dni,
                    dob: dob,
                    worker_email: email,
                }),
            });

            if (!res.ok) throw new Error("Error al guardar datos");

            router.push("/wizard");
        } catch (err) {
            alert("Hubo un error al guardar tus datos. Inténtalo de nuevo.");
            setLoading(false);
        }
    };

    if (!sessionId) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans">

            {/* Header */}
            <div className="mt-8 mb-10 anim-enter">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                    <User className="text-indigo-600" size={24} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                    Identifícate
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                    Para asociar tus resultados a tu historial médico.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 anim-enter" style={{ animationDelay: "100ms" }}>

                {/* DNI Field */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        DNI / Documento de identidad
                    </label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            required
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            placeholder="Ej: 12345678A"
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* DOB Field */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Fecha de nacimiento
                    </label>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <p className="text-xs text-slate-400 ml-1">Opcional. Ayuda a confirmar tu identidad.</p>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Email personal <span className="text-slate-400 font-normal normal-case">(Opcional)</span>
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-300"
                        />
                    </div>
                    <p className="text-xs text-slate-400 ml-1">Te enviaremos una copia del informe.</p>
                </div>

                <div className="flex-1"></div>

                <div className="pt-4 pb-8">
                    <button
                        type="submit"
                        disabled={loading || !dni}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white h-16 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200/50 flex items-center justify-center transition-all transform active:scale-[0.98]"
                    >
                        {loading ? "Guardando..." : "Continuar"}
                        {!loading && <ArrowRight size={24} className="ml-2" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
