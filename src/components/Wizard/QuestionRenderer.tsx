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

export default function QuestionRenderer({ question, value, onChange, onNext, otherValue, onOtherChange }: QuestionRendererProps & { otherValue?: string, onOtherChange?: (val: string) => void }) {

    // Legacy support for "Otro (especificar)" modal if needed, but for "hasOther" we use inline
    const [otherOpen, setOtherOpen] = useState(false);
    const [legacyOtherText, setLegacyOtherText] = useState("");

    const handleSelect = (option: string) => {
        // Legacy behavior for specific string (backward compat if needed)
        if (option === "Otro (especificar)") {
            setOtherOpen(true);
            // Pre-fill if existing value is custom
            if (value && !question.options?.includes(value) && typeof value === 'string') {
                setLegacyOtherText(value);
            }
            return;
        }

        if (question.type === "multi") {
            handleMulti(option);
        } else {
            onChange(option);
        }
    };

    const handleMulti = (option: string) => {
        const current = Array.isArray(value) ? value : [];

        if (option === "Ninguna" || option === "Ninguno") {
            if (current.includes(option)) onChange([]);
            else onChange([option]);
            // If "Ninguna" selected, maybe clear Other? 
            // The requirement says "Permitir múltiples selecciones", implies Other + Symptoms is OK.
            // But usually "Ninguna" is exclusive.
            // Let's assume Ninguna clears everything else.
            if (onOtherChange) onOtherChange("");
            return;
        }

        let next = current.filter((v: string) => v !== "Ninguna" && v !== "Ninguno");

        if (next.includes(option)) {
            next = next.filter((v: string) => v !== option);
            // If checking off "Otro", clear the text?
            if (option === "Otro" && onOtherChange) onOtherChange("");
        } else {
            next = [...next, option];
        }

        onChange(next);
    };

    const saveLegacyOther = () => {
        if (!legacyOtherText.trim()) return;
        if (question.type === "multi") {
            const current = Array.isArray(value) ? value : [];
            onChange([...current, legacyOtherText]);
        } else {
            onChange(legacyOtherText);
        }
        setOtherOpen(false);
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
                    spellCheck={false}
                />
                <div className="text-right text-xs text-slate-400 mt-2">
                    {(value || "").length} / {question.maxChars || 200}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="stack anim-enter">
                {question.options?.map((opt) => {
                    const selected = isSelected(opt);
                    const isOtherOption = opt === "Otro";

                    return (
                        <div key={opt}>
                            <div
                                onClick={() => handleSelect(opt)}
                                className={`option-card ${selected ? 'selected' : ''}`}
                            >
                                <span className={`font-medium ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    {opt}
                                </span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                    {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                                </div>
                            </div>

                            {/* Inline Input for "Otro" */}
                            {isOtherOption && selected && question.hasOther && (
                                <div className="mt-2 pl-4 pr-1 animate-in slide-in-from-top-2 duration-200">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={otherValue || ""}
                                        onChange={(e) => onOtherChange && onOtherChange(e.target.value)}
                                        placeholder="Especifica aquí..."
                                        className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 outline-none text-slate-700 font-medium bg-slate-50 transition-colors"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legacy "Other" Modal */}
            {otherOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <h3 className="font-bold text-lg mb-4 text-slate-900">Especificar respuesta</h3>
                        <textarea
                            autoFocus
                            value={legacyOtherText}
                            onChange={(e) => setLegacyOtherText(e.target.value)}
                            placeholder="Escribe aquí..."
                            maxLength={160}
                            className="input-field min-h-[100px] mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setOtherOpen(false)} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 flex-1">
                                Cancelar
                            </button>
                            <button onClick={saveLegacyOther} disabled={!legacyOtherText.trim()} className="btn bg-indigo-600 text-white hover:bg-indigo-700 flex-1">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
