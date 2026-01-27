"use client";

import { Question } from "@/lib/types";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface QuestionRendererProps {
    question: Question;
    value: any;
    onChange: (val: any) => void;
    onNext?: () => void;
}

export default function QuestionRenderer({ question, value, onChange, onNext }: QuestionRendererProps) {
    const [otherOpen, setOtherOpen] = useState(false);
    const [otherText, setOtherText] = useState("");

    const handleSelect = (option: string) => {
        if (option === "Otro (especificar)") {
            setOtherOpen(true);
            // Pre-fill if existing value is custom
            // If current value is not in options, it's custom
            if (value && !question.options?.includes(value) && typeof value === 'string') {
                setOtherText(value);
            }
        } else {
            if (question.type === "multi") {
                handleMulti(option);
            } else {
                onChange(option);
                // onNext && onNext(); // Auto-advance can be annoying if user wants to change. Let's stick to manual.
            }
        }
    };

    const handleMulti = (option: string) => {
        const current = Array.isArray(value) ? value : [];

        if (option === "Ninguna" || option === "Ninguno") {
            if (current.includes(option)) onChange([]);
            else onChange([option]);
            return;
        }

        let next = current.filter((v: string) => v !== "Ninguna" && v !== "Ninguno");
        if (next.includes(option)) next = next.filter((v: string) => v !== option);
        else next = [...next, option];

        onChange(next);
    };

    const saveOther = () => {
        if (!otherText.trim()) return;

        if (question.type === "multi") {
            const current = Array.isArray(value) ? value : [];
            // Remove any previous custom values not in options? Complex.
            // For simplicity, just append.
            onChange([...current, otherText]);
        } else {
            onChange(otherText);
        }
        setOtherOpen(false);
    };

    // Check if value matches an option or is custom
    const isCustomValue = (val: any) => {
        if (!val) return false;
        if (Array.isArray(val)) return false; // Multi handled differently
        return !question.options?.includes(val);
    };

    const isSelected = (opt: string) => {
        if (Array.isArray(value)) return value.includes(opt);
        return value === opt;
    };

    if (question.type === "info") {
        return (
            <div className="anim-enter text-center">
                <div className="bg-indigo-50 text-indigo-800 p-6 rounded-2xl border border-indigo-100 mb-6">
                    <p className="text-lg font-medium leading-relaxed whitespace-pre-line">{question.text}</p>
                </div>
                {/* Parent handles the 'Next' button typically, but if we need a specific acknowledgment checkbox inside an info block, we might do it here. 
                    For pure info, just rendering text is enough. The 'Next' button in WizardPage will be 'Continuar'.
                */}
            </div>
        );
    }

    if (question.type === "text") {
        return (
            <div className="anim-enter">
                <textarea
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder}
                    maxLength={question.maxChars}
                    className="input-field min-h-[140px] resize-none"
                />
                <div className="text-right text-xs text-gray-400 mt-2">
                    {(value || "").length} / {question.maxChars || 200}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="stack anim-enter">
                {question.options?.map((opt, idx) => {
                    const selected = isSelected(opt);
                    return (
                        <div
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`option-card ${selected ? 'selected' : ''}`}
                        >
                            <span className={`font-medium ${selected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>
                                {opt}
                            </span>
                            <div className="check-circle">
                                {selected && <Check size={14} />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* "Other" Modal / Bottom Sheet Overlay */}
            {otherOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <h3 className="font-bold text-lg mb-4">Especificar respuesta</h3>
                        <textarea
                            autoFocus
                            value={otherText}
                            onChange={(e) => setOtherText(e.target.value)}
                            placeholder="Escribe aquí..."
                            maxLength={160}
                            className="input-field min-h-[100px] mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setOtherOpen(false)} className="btn btn-secondary flex-1">
                                Cancelar
                            </button>
                            <button onClick={saveOther} disabled={!otherText.trim()} className="btn btn-primary flex-1">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
