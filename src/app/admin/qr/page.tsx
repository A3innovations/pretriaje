"use client";

import { useState, useEffect } from "react";
import { QrCode, RefreshCw, Copy, ExternalLink, Check, Clock, ShieldCheck, AlertCircle, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function AdminQRPage() {
    const [campaignId] = useState("demo-campaign");
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<{ token: string; url: string; expiresAt?: string }>({ token: "", url: "" });
    const [expiresIn, setExpiresIn] = useState<string>("--:--:--");
    const [copied, setCopied] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchToken = async () => {
        // setLoading(true); // Don't block UI on refresh
        try {
            const res = await fetch(`/api/admin/qr?campaignId=${campaignId}`);
            const data = await res.json();
            if (data.token) {
                setQrData({ token: data.token, expiresAt: data.expiresAt, url: data.url || "" });
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const rotateToken = async (silent = false) => {
        // if (!silent && !confirm("¿Generar nuevo QR? El anterior dejará de funcionar inmediatamente.")) return; // Removed to prevent blocking issues

        if (!silent) setLoading(true); // Only show loader on manual action
        try {
            const res = await fetch(`/api/admin/qr`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId })
            });
            const data = await res.json();
            if (data.token) {
                setQrData({ token: data.token, expiresAt: data.expiresAt, url: data.url || "" });
                setLastUpdated(new Date());
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchToken();
    }, []);

    // Auto-Rotation disabled per user feedback (expires too fast)
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         rotateToken(true);
    //     }, 60000); // 60 seconds
    //     return () => clearInterval(interval);
    // }, []);

    // Countdown Logic (Visual only for the 60s reset)
    // Disabled visual timer too since we disabled rotation
    const [progress, setProgress] = useState(100);
    // useEffect(() => { ... }, [lastUpdated]); 

    const [baseUrl, setBaseUrl] = useState("");
    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    const fullUrl = `${baseUrl}/start?campaign_id=${campaignId}&token=${encodeURIComponent(qrData.token)}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading && !qrData.token) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-sans">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
                <span className="font-medium">Iniciando sistema Priora...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-indigo-500 to-emerald-500 z-20"></div>

                {/* Left Side: QR & Presentation */}
                <div className="flex-[3] flex flex-col items-center justify-center relative bg-gradient-to-br from-white via-indigo-50/10 to-indigo-50/30 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100">

                    {/* Header Badge */}
                    <div className="absolute top-8 left-8 lg:top-12 lg:left-12 flex items-center gap-4 animate-fade-in-down">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-sm font-bold tracking-wide uppercase">SISTEMA ACTIVO</span>
                        </div>
                    </div>

                    {/* Branding Top Right */}
                    <div className="absolute top-8 right-8 lg:top-12 lg:right-12 opacity-50 grayscale hover:grayscale-0 transition-all opacity-100">
                        <span className="font-black text-xl tracking-tighter text-indigo-900">PRIORA</span>
                    </div>

                    <div className="mb-10 text-center animate-fade-in-up">
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3">Punto de Acceso</h1>
                        <p className="text-xl text-slate-500 font-medium max-w-md mx-auto">Escanea el código para iniciar tu evaluación de pre-triaje de forma segura.</p>
                    </div>

                    <div className="relative group perspective-1000 animate-zoom-in">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative p-8 bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 transform transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1">
                            {qrData.token ? (
                                <QRCodeSVG
                                    value={fullUrl}
                                    size={500}
                                    level={"H"}
                                    includeMargin={true}
                                    className="rounded-xl w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]"
                                />
                            ) : (
                                <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                    <RefreshCw className="animate-spin" size={48} />
                                </div>
                            )}

                            {/* Security Watermark */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-300 opacity-50 font-mono text-xs uppercase tracking-widest pointer-events-none">
                                <ShieldCheck size={14} /> Conexión Segura SSL
                            </div>
                        </div>
                    </div>

                    {/* Session Active Info */}
                    <div className="mt-12 flex flex-wrap justify-center gap-6 animate-fade-in-up delay-100">
                        <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl px-6 py-4 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Campaña</span>
                            <span className="text-lg font-bold text-slate-700">TechSolutions S.L.</span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl px-6 py-4 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rotación</span>
                            <span className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <Zap size={16} className="text-amber-500 fill-amber-500" /> 60s
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Actions & Timer */}
                <div className="flex-1 min-w-[320px] max-w-md bg-white p-8 lg:p-12 flex flex-col justify-between shadow-2xl z-10 relative">

                    <div className="pt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Seguridad Dinámica</h3>
                        <div className="text-center bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-8 relative overflow-hidden">
                            {/* Progress Bar Background */}
                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>

                            <div className="text-5xl font-mono font-bold tracking-tight tabular-nums mb-2 text-slate-900">
                                {expiresIn}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-indigo-100 text-indigo-600">
                                Próxima actualización
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Acciones</h3>

                        <button
                            onClick={copyToClipboard}
                            className={`w-full h-16 text-base font-bold rounded-2xl transition-all flex items-center justify-between px-6 active:scale-95 ${copied
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'
                                }`}
                        >
                            <span>{copied ? '¡URL Copiada!' : 'Copiar Enlace Público'}</span>
                            {copied ? <Check size={24} /> : <Copy size={24} />}
                        </button>

                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-16 text-base font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-between px-6 active:scale-95"
                        >
                            <span>Abrir en Nueva Pestaña</span>
                            <ExternalLink size={24} className="text-slate-400" />
                        </a>

                        <div className="h-4"></div>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <button
                                onClick={() => rotateToken(false)}
                                className="w-full h-14 text-sm font-bold bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <RefreshCw size={18} />
                                Forzar Rotación Manual
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            Software developed by
                        </p>
                        <p className="text-sm font-black tracking-tight text-slate-800 mt-1">
                            PRIORA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
