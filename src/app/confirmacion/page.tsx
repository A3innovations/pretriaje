"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Download, Home, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import questionsData from "@/lib/questions.json";
import { Session } from "@/lib/types";

export default function ConfirmationPage() {
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sid = sessionStorage.getItem("session_id");
        if (sid) {
            fetch(`/api/session/${sid}`)
                .then(res => res.json())
                .then(data => {
                    setSession(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const handleDownload = () => {
        if (!session) return;

        const doc = new jsPDF();
        let yPos = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;

        // Helpers
        // Helpers
        const checkPageBreak = (spaceNeeded: number) => {
            // ULTRA STRICT: Page is 297mm. Margin 20mm. Stop at 260mm for safety.
            if (yPos + spaceNeeded > 260) {
                doc.addPage();
                yPos = 30; // Reset top with generous margin
            }
        };

        const addTitle = (text: string) => {
            checkPageBreak(15);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59); // Slate 800
            doc.text(text, margin, yPos);
            yPos += 10;
        };

        const addPair = (label: string, value: string) => {
            // Not used anymore in main logic but kept for safety reference
            // checkPageBreak(14);
            // doc.setFontSize(9);
            // doc.setFont("helvetica", "bold");
            // doc.setTextColor(100, 116, 139); // Slate 500
            // doc.text(label.toUpperCase(), margin, yPos);
            // yPos += 5;

            // doc.setFontSize(11);
            // doc.setFont("helvetica", "normal");
            // doc.setTextColor(15, 23, 42); // Slate 900
            // // Handle multi-line text
            // const splitText = doc.splitTextToSize(value, 170);
            // doc.text(splitText, margin, yPos);
            // yPos += (splitText.length * 5) + 6;
        };

        // --- HEADER ---
        // Header Background
        doc.setFillColor(79, 70, 229); // Indigo 600
        doc.rect(0, 0, 210, 40, "F");

        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255); // White
        doc.text("INFORME PRE-TRIAJE", margin, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(224, 231, 255); // Indigo 100
        doc.text("DOCUMENTO CLÍNICO CONFIDENCIAL", margin, 28);

        // Right side header info
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`ID PACIENTE: ${session.worker_id || "PENDIENTE"}`, 140, 18);
        doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 140, 26);

        yPos = 55;

        // --- SECTION: SUMMARY (Compact) ---
        // User requested NO red box and Single Page fit.
        // We will just list red flags inline or very compactly if they exist, without big boxes.

        // Just move down a bit, no text, no color.
        yPos += 5;

        // Helper for sections to keep it tight
        const renderSectionHeader = (title: string, color: [number, number, number] = [79, 70, 229]) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...color);
            doc.text(title, margin, yPos);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, yPos + 2, 210 - margin, yPos + 2);
            yPos += 8;
        };

        // --- SECTION: CORE & MODULES ---
        renderSectionHeader("HISTORIAL Y DATOS GENERALES");

        // Helper to strip emojis for PDF (Helvetica doesn't support them)
        const cleanText = (text: string) => {
            return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F100}-\u{1F1FF}\u{FE0F}]/gu, '')
                .trim();
        };

        // 1. Datos Generales (Core)
        questionsData.core.forEach((q: any) => {
            if (session.answers[q.id] && q.type !== 'info') {
                // Remove emoji from label
                let label = cleanText(q.text);

                const val = Array.isArray(session.answers[q.id])
                    ? session.answers[q.id].join(", ")
                    : String(session.answers[q.id]);

                const isRisk = checkRisk(q.id, val);
                printRow(label, val, false, isRisk);
            }
        });

        yPos += 8;

        // 2. Modules
        questionsData.modules.forEach((mod: any) => {
            const hasAnswers = mod.questions.some((q: any) => session.answers[q.id]);
            if (!hasAnswers) return;

            // Header for Module
            if (yPos + 15 > pageHeight - margin) {
                doc.addPage();
                yPos = margin + 10;
            }

            const modTitleMap: Record<string, string> = {
                'mod_pvd': 'PANTALLAS Y VISIÓN',
                'mod_load': 'CARGAS Y ESFUERZO',
                'mod_noise': 'RUIDO',
                'mod_chem': 'QUÍMICOS Y RESPIRATORIO',
                'mod_bio': 'RIESGO BIOLÓGICO',
                'mod_drive': 'CONDUCCIÓN',
                'mod_height': 'TRABAJO EN ALTURA'
            };
            const cleanTitle = (modTitleMap[mod.id] || mod.id).toUpperCase();

            // Module Header Styling
            doc.setFillColor(248, 250, 252); // Slate 50
            doc.rect(margin, yPos - 1, 210 - (margin * 2), 8, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105); // Slate 600
            doc.text(cleanTitle, margin + 2, yPos + 5);
            yPos += 12;

            mod.questions.forEach((q: any, idx: number) => {
                if (session.answers[q.id] && q.type !== 'info') {
                    const val = Array.isArray(session.answers[q.id])
                        ? session.answers[q.id].join(", ")
                        : String(session.answers[q.id]);

                    const isRisk = checkRisk(q.id, val);
                    printRow(q.text, val, idx === mod.questions.length - 1, isRisk);
                }
            });
            yPos += 8;
        });

        // 3. Closing
        if (questionsData.closing) {
            questionsData.closing.forEach((q: any) => {
                if (session.answers[q.id]) {
                    printRow(q.text, String(session.answers[q.id]));
                }
            });
        }

        // Footer
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${totalPages} - Generado por Pre-Triaje 1.0`, 105, 290, { align: "center" });
        }

        doc.save(`Informe_${session.worker_id || "Pretriaje"}.pdf`);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Generando confirmación...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">

            <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-xl p-10 text-center anim-enter">

                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle size={40} className="text-green-600" strokeWidth={2.5} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                    ¡Informe Enviado!
                </h1>

                <p className="text-slate-500 mb-8 leading-relaxed">
                    Tus respuestas han sido procesadas correctamente. El equipo médico ya tiene acceso a tu pre-triaje.
                </p>

                {/* Actions Card */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
                    <h3 className="font-bold text-indigo-900 mb-1">Tu copia personal</h3>
                    <p className="text-xs text-indigo-600/80 mb-4">
                        Descarga el informe completo en PDF.
                    </p>
                    <button
                        onClick={handleDownload}
                        disabled={!session}
                        className="w-full btn h-12 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-sm font-bold flex items-center justify-center rounded-lg transition-all"
                    >
                        {session ? (
                            <>
                                <Download className="w-5 h-5 mr-2" />
                                Descargar PDF Oficial
                            </>
                        ) : (
                            "Cargando datos..."
                        )}
                    </button>
                    {!session && <p className="text-[10px] text-red-400 mt-2">Error: No se pudo cargar la sesión para el PDF.</p>}
                </div>

                <button
                    onClick={() => router.push("/start")}
                    className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center justify-center transition-colors"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Volver al inicio
                </button>
            </div>
        </div>
    );
}
