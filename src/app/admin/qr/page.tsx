"use client";

import { useState, useEffect } from "react";
import { QrCode, RefreshCw, Copy, ExternalLink, Check, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function AdminQRPage() {
    const [campaignId] = useState("demo-campaign"); // Hardcoded for MVP
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<{ token: string; url: string; expiresAt?: string }>({ token: "", url: "" });
    const [expiresIn, setExpiresIn] = useState<string>("--:--");
    const [copied, setCopied] = useState(false);

    const fetchToken = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/qr?campaignId=${campaignId}`);
            const data = await res.json();
            if (data.token) {
                setQrData({ token: data.token, expiresAt: data.expiresAt, url: data.url || "" });
            }
        } finally {
            setLoading(false);
        }
    };

    const rotateToken = async () => {
        if (!confirm("¿Generar nuevo QR? El anterior dejará de funcionar.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/qr`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId })
            });
            console.log("Rotate response status:", res.status);
            const data = await res.json();
            if (data.token) {
                setQrData({ token: data.token, expiresAt: data.expiresAt, url: data.url || "" });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchToken();
    }, []);

    // Countdown Logic
    useEffect(() => {
        const calculateExpires = () => {
            if (qrData?.expiresAt) {
                const now = new Date();
                const expiry = new Date(qrData.expiresAt);
                const diff = expiry.getTime() - now.getTime();

                if (diff <= 0) {
                    setExpiresIn("Expirado");
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setExpiresIn(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                }
            }
        };

        calculateExpires(); // Run immediately
        const timer = setInterval(calculateExpires, 1000);
        return () => clearInterval(timer);
    }, [qrData]);

    // Construct URL
    // We need absolute URL for QR. In client we can use window.location
    const [baseUrl, setBaseUrl] = useState("");
    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    const fullUrl = `${baseUrl}/start?campaign_id=${campaignId}&token=${qrData.token}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading && !qrData.token) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-sans">
            <RefreshCw className="animate-spin mr-2" /> Cargando sistema...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row anim-enter">

                {/* Left Side: QR & Info */}
                <div className="flex-[2] flex flex-col items-center justify-center border-r border-slate-100 relative bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 p-8">
                    <div className="absolute top-10 left-10 flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-200"></div>
                        <span className="text-sm font-extrabold text-slate-400 tracking-widest uppercase">En Vivo</span>
                    </div>

                    <div className="mb-12 text-center scale-110">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Punto de Acceso</h1>
                        <p className="text-lg text-slate-500 font-medium">Escanea para iniciar el pre-triaje</p>
                    </div>

                    <div className="p-8 bg-white rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] border border-slate-100 mb-12 transform transition-transform duration-500 hover:scale-105">
                        {qrData.token ? (
                            <QRCodeSVG
                                value={fullUrl}
                                size={550}
                                level={"Q"}
                                includeMargin={true}
                                className="rounded-2xl"
                            />
                        ) : (
                            <div className="w-[550px] h-[550px] bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-300">
                                <RefreshCw className="animate-spin" size={60} />
                            </div>
                        )}
                    </div>

                    <div className="w-full max-w-[600px] bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CÓDIGO DE SESIÓN</span>
                            <span className="font-mono text-3xl font-bold text-slate-900 tracking-widest leading-none">{qrData.token.slice(0, 8) || "--------"}...</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">EXPIRA EN</span>
                            <div className="flex items-center gap-3 text-indigo-600 font-bold bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100">
                                <Clock size={20} />
                                <span className="font-mono text-2xl leading-none pt-1">{expiresIn}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Actions (Sidebar) */}
                <div className="bg-white p-12 w-full md:w-[320px] xl:w-[400px] flex flex-col justify-center border-l border-slate-100 shadow-xl z-10 relative">

                    <div className="mb-auto pt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">Control del Panel</h3>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={copyToClipboard}
                            className={`btn h-14 text-base shadow-sm rounded-xl transition-all font-bold flex items-center justify-center ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                            {copied ? <Check className="mr-2" size={20} /> : <Copy className="mr-2" size={20} />}
                            {copied ? '¡Copiado!' : 'Copiar Enlace'}
                        </button>

                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn h-14 text-base bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm rounded-xl transition-all font-bold flex items-center justify-center"
                        >
                            <ExternalLink className="mr-2" size={20} />
                            Abrir URL
                        </a>

                        <div className="h-px bg-slate-200 my-2"></div>

                        <button
                            onClick={rotateToken}
                            className="btn h-14 text-base bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 shadow-sm rounded-xl transition-all font-semibold flex items-center justify-center"
                        >
                            <RefreshCw className="mr-2" size={18} />
                            Rotar código
                        </button>
                    </div>

                    <div className="mt-auto pt-6 text-center">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="font-semibold text-slate-500">Nota:</span> Rotar el código invalidará todos los enlaces anteriores inmediatamente.
                        </p>
                        <p className="text-xs text-slate-300 mt-2 font-mono">
                            Expira: {qrData.expiresAt ? new Date(qrData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
