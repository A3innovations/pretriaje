import { Session, TriageAnalysis, TriageLevel } from "./types";

export function computeTriage(answers: Record<string, any>): TriageAnalysis {
    let score = 0;
    const reasons: string[] = [];

    // --- 1. Scoring Logic ---

    // Red Flags (q_red_flags)
    // Assuming "q_red_flags" returns an array. If includes "Ninguna", no points.
    const redFlags = answers["q_red_flags"];
    const hasRedFlags = Array.isArray(redFlags) && !redFlags.includes("Ninguna") && redFlags.length > 0;

    if (hasRedFlags) {
        score += 50;
        reasons.push("Bandera roja detectada");
    }

    // Happening Now (q_red_flags_now)
    if (answers["q_red_flags_now"] === "Sí") {
        score += 20;
        // Don't push reason yet, maybe redundant with Red Flag?
    }

    // Pain (q_pain_level) - 0 to 10
    const pain = parseInt(answers["q_pain_level"] || "0");
    if (!isNaN(pain) && pain > 0) {
        score += (pain * 3);
        if (pain >= 5) reasons.push(`Dolor intenso (${pain}/10)`);
        else reasons.push(`Dolor moderado (${pain}/10)`);
    }

    // Medication 24h (q_meds_today)
    if (answers["q_meds_today"] === "Sí") {
        score += 5;
        reasons.push("Medicación recientes");
    }

    // Exposures (q_exposure)
    const exposure = answers["q_exposure"];
    if (["Maquinaria", "Conducción"].includes(exposure)) {
        score += 10;
        reasons.push(`Exposición de riesgo: ${exposure}`);
    }

    // Clamp Score
    score = Math.min(100, Math.max(0, score));

    // --- 2. Level Logic ---
    let level: TriageLevel = 'verde';
    if (score >= 70 || (hasRedFlags && answers["q_red_flags_now"] === "Sí")) {
        level = 'rojo';
    } else if (score >= 40) {
        level = 'ambar';
    }

    // --- 3. Summary Generation ---
    let aiSummary = "";
    if (level === 'verde') {
        aiSummary = `Resumen IA: Dolor ${pain}/10. Sin banderas rojas activas. Revisión preventiva estándar recomendada.`;
    } else if (level === 'ambar') {
        aiSummary = `Resumen IA: Puntuación media. ${hasRedFlags ? 'Bandera roja presente.' : ''} Requiere valoración de enfermería antes de aptitud.`;
    } else {
        aiSummary = `ALERTA IA: Síntomas prioritarios detectados. ${hasRedFlags ? 'Banderas rojas activas y actuales.' : ''} Se sugiere revisión médica inmediata.`;
    }

    // --- 4. Question Suggestion ---
    const aiQuestions: string[] = [];

    // Prioritize Red Flag / Pain questions
    if (pain >= 7 || hasRedFlags) {
        aiQuestions.push("¿El síntoma te impide realizar tareas básicas ahora mismo?");
        aiQuestions.push("¿Has sentido este mismo síntoma con esta intensidad antes?");
    }

    // Meds / Drowsiness
    if (answers["q_meds_today"] === "Sí") {
        aiQuestions.push("¿Qué medicamento tomaste y a qué hora exacta?");
        aiQuestions.push("¿Sientes somnolencia o lentitud de reflejos?");
    }

    // Exposure
    if (exposure && exposure !== "Ninguna") {
        aiQuestions.push(`¿Tu tarea de ${exposure} requiere atención constante hoy?`);
    }

    // General History filler if needed
    if (aiQuestions.length < 3) aiQuestions.push("¿Tienes antecedentes familiares relevantes?");
    if (aiQuestions.length < 3) aiQuestions.push("¿Cuándo fue tu última revisión médica?");
    if (aiQuestions.length < 3) aiQuestions.push("¿Hay algo más que debamos saber?");

    return {
        score,
        level,
        reasons: reasons.slice(0, 4), // Max 4
        aiSummary,
        aiQuestions: aiQuestions.slice(0, 3) // Exactly 3
    };
}
