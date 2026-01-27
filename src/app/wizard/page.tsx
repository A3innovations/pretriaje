"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import QuestionRenderer from "@/components/Wizard/QuestionRenderer";
import questionsData from "@/lib/questions.json";
import { Question, QuestionnaireConfig } from "@/lib/types";
import { ArrowLeft, ArrowRight } from "lucide-react";

const config = questionsData as unknown as QuestionnaireConfig;

export default function WizardPage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);

    // State
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [history, setHistory] = useState<string[]>([]);
    const [currentQId, setCurrentQId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // -- Initialization --
    useEffect(() => {
        const sid = sessionStorage.getItem("session_id");
        if (!sid) {
            router.push("/start");
            return;
        }
        setSessionId(sid);

        // Resume session
        fetch(`/api/session/${sid}`)
            .then(res => res.json())
            .then(data => {
                if (data.answers) setAnswers(data.answers);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        if (!currentQId) setCurrentQId(config.core[0].id);
    }, [router]);

    // -- Logic --
    const allQuestions = useMemo(() => {
        let qList = [...config.core];
        // Fix: Use correct ID for tasks/exposures
        const exposures = (answers["q1_4_tasks"] as string[]) || (answers["exposures"] as string[]) || [];

        config.modules.forEach(mod => {
            if (mod.trigger.exposuresIncludes) {
                const hasExposure = mod.trigger.exposuresIncludes.some(exp => exposures.includes(exp));
                if (hasExposure) qList = [...qList, ...mod.questions];
            }
        });

        // Append closing questions (e.g. final_notes) at the very end
        if (config.closing) {
            qList = [...qList, ...config.closing];
        }

        return qList;
    }, [answers]);

    const currentQuestion = useMemo(() => {
        if (!currentQId) return null;
        return allQuestions.find(q => q.id === currentQId);
    }, [currentQId, allQuestions]);

    const progress = useMemo(() => {
        if (!currentQuestion) return 0;
        const idx = allQuestions.findIndex(q => q.id === currentQuestion.id);
        return Math.round(((idx + 1) / allQuestions.length) * 100);
    }, [currentQuestion, allQuestions]);

    const currentIndex = useMemo(() => {
        if (!currentQuestion) return 0;
        return allQuestions.findIndex(q => q.id === currentQuestion.id) + 1;
    }, [currentQuestion, allQuestions]);

    // -- Handlers --
    const saveSession = async (currentAnswers: Record<string, any>) => {
        if (!sessionId) return;
        try {
            await fetch(`/api/session/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: currentAnswers })
            });
        } catch (e) {
            console.error("Save error", e);
        }
    };

    const handleAnswerChange = (val: any) => {
        setAnswers(prev => ({ ...prev, [currentQId!]: val }));
        // Removed fetch per keystroke for performance. 
        // We now save on Next/Back navigation events.
    };

    const handleBack = async () => {
        // Save background (fire and forget)
        saveSession(answers);

        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(history.slice(0, -1));
            setCurrentQId(prev);
            window.scrollTo(0, 0); // Comfortable scroll to top
        } else {
            router.push("/identificacion");
        }
    };

    const [processing, setProcessing] = useState(false);

    const handleNext = async () => {
        if (processing) return; // Prevent double click
        if (!currentQuestion) return;

        // Strict validation: check for undefined, null, empty string, or empty array.
        const val = answers[currentQuestion.id];
        const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);

        // Determine if required. Default to TRUE for all input types unless explicitly false.
        // 'info' type maps to nothing so it's never empty (conceptually), but let's be safe.
        const isInfo = currentQuestion.type === 'info';
        const isRequired = currentQuestion.required !== false; // Default strict

        if (!isInfo && isRequired && isEmpty) {
            alert("⚠️ Esta pregunta es obligatoria. Por favor selecciona una respuesta.");
            return;
        }

        setProcessing(true);
        // Save background
        await saveSession(answers).catch(() => { }); // Wait for save just in case, catch error

        const currIdx = allQuestions.findIndex(q => q.id === currentQuestion.id);

        // Critical Fix: Logic to find next visible question
        let nextIdx = currIdx + 1;

        // Safety check to prevent infinite loop (though length is finite)
        let loopCount = 0;
        const maxLoops = allQuestions.length + 5;

        while (nextIdx < allQuestions.length && loopCount < maxLoops) {
            const q = allQuestions[nextIdx];
            let isVisible = true;
            if (q.showIf) {
                const dependentAns = answers[q.showIf.question];
                if (dependentAns !== q.showIf.equals) isVisible = false;
            }
            if (isVisible) break;
            nextIdx++;
            loopCount++;
        }

        setProcessing(false);

        if (nextIdx >= allQuestions.length) {
            router.push("/revision");
        } else {
            setHistory([...history, currentQuestion.id]);
            setCurrentQId(allQuestions[nextIdx].id);
            window.scrollTo(0, 0);
        }
    };

    if (loading || !currentQuestion) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-32">

            {/* Top Bar / Progress */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-slate-200">
                <div className="max-w-md mx-auto px-6 py-4">
                    <div className="flex justify-between items-center mb-2">
                        {/* Removed Text Counter as requested */}
                        <div />
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full ml-auto">
                            {Math.round((currentIndex / allQuestions.length) * 100)}% Completado
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            style={{ width: `${Math.round((currentIndex / allQuestions.length) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Question Container */}
            <div className="max-w-md mx-auto px-6 pt-10 anim-enter">
                <main key={currentQuestion.id} className="space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                            {currentQuestion.text}
                        </h2>

                        {!currentQuestion.required && (
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wide rounded-lg">
                                Opcional
                            </span>
                        )}
                    </div>

                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        <QuestionRenderer
                            question={currentQuestion}
                            value={answers[currentQuestion.id]}
                            onChange={handleAnswerChange}
                        />
                    </div>

                </main>
            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-6 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="max-w-md mx-auto flex gap-4">
                    <button
                        onClick={handleBack}
                        className="w-14 h-14 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                        aria-label="Atrás"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <button
                        onClick={handleNext}
                        className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200/50 flex items-center justify-center transition-all transform active:scale-[0.98]"
                    >
                        Siguiente
                        <ArrowRight size={24} className="ml-2" />
                    </button>
                </div>
            </div>

        </div>
    );
}
