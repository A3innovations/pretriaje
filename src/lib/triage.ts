import { Session, TriageAnalysis, TriageLevel } from "./types";

export function computeTriage(answers: Record<string, any>): TriageAnalysis {
    let score = 0;
    const reasons: string[] = [];

    // --- 1. Scoring Logic (Risk Factors) ---

    // 1. Family History
    const family = answers["q_family_history"] || [];
    if (Array.isArray(family) && !family.includes("Ninguno conocido") && !family.includes("No lo sabe")) {
        score += 10;
        if (family.includes("Muerte súbita (<50 años)")) {
            score += 20;
            reasons.push("Antecedentes familiares de riesgo");
        }
    }

    // 2. Personal History (High Risk)
    const personal = answers["q_personal_history"] || [];
    if (Array.isArray(personal) && !personal.includes("No")) {
        score += 20;
        if (personal.includes("Enfermedad cardiaca") || personal.includes("Enfermedad respiratoria")) {
            score += 20;
            reasons.push("Antecedentes personales de riesgo");
        }
    }

    // 3. Vascular
    const vascular = answers["q_vascular"] || [];
    if (Array.isArray(vascular) && !vascular.includes("No")) {
        score += 15;
        reasons.push("Problemas vasculares");
    }

    // 4. Medication
    const meds = answers["q_medication_habitual"] || [];
    if (Array.isArray(meds) && !meds.includes("No")) {
        score += 10;
        if (meds.includes("Anticoagulantes") || meds.includes("Antihipertensivos")) {
            score += 10;
            reasons.push("Medicación crónica relevante");
        }
    }

    // 5. Habits
    const habits = answers["q_habits"] || [];
    if (Array.isArray(habits) && !habits.includes("No")) {
        score += 5;
    }

    // Clamp Score
    score = Math.min(100, Math.max(0, score));

    // --- 2. Level Logic ---
    let level: TriageLevel = 'verde';
    if (score >= 60) {
        level = 'rojo';
    } else if (score >= 30) {
        level = 'ambar';
    }

    // --- 3. Summary Generation ---
    let aiSummary = "";
    if (level === 'verde') {
        aiSummary = `Resumen IA: Perfil de riesgo bajo. Sin antecedentes críticos inmediatos. Apto para revisión estándar.`;
    } else if (level === 'ambar') {
        aiSummary = `Resumen IA: Perfil de riesgo moderado. Antecedentes médicos o medicación crónica que requieren supervisión.`;
    } else {
        aiSummary = `ALERTA IA: Perfil de riesgo elevado. Múltiples factores de salud detectados. Se recomienda revisión médica exhaustiva.`;
    }

    // --- 4. Question Suggestion ---
    const aiQuestions: string[] = [];

    if (personal.includes("Enfermedad cardiaca") || family.includes("Cardiopatías / Infarto / Ictus")) {
        aiQuestions.push("¿Cuándo fue tu última revisión cardiológica completa?");
    }

    if (meds.includes("Anticoagulantes")) {
        aiQuestions.push("¿Llevas un control regular del INR o coagulación?");
    }

    if (habits.includes("Fumador/a")) {
        aiQuestions.push("¿Cuántos cigarrillos consumes al día y desde hace cuánto?");
    }

    if (answers["q_mental_health"] && !answers["q_mental_health"].includes("No")) {
        aiQuestions.push("¿Te encuentras en tratamiento activo actualmente?");
    }

    // Fillers
    if (aiQuestions.length < 3) aiQuestions.push("¿Hay algún otro síntoma reciente que te preocupe?");
    if (aiQuestions.length < 3) aiQuestions.push("¿Tienes alguna alergia no diagnosticada?");
    if (aiQuestions.length < 3) aiQuestions.push("¿Realizas actividad física regularmente?");

    return {
        score,
        level,
        reasons: reasons.slice(0, 4), // Max 4
        aiSummary,
        aiQuestions: aiQuestions.slice(0, 3) // Exactly 3
    };
}

export const EXTRA_QUESTIONS_POOL = [
    "¿Has notado si el dolor aumenta con el reposo o con el movimiento?",
    "¿Hay alguna postura antálgica que te alivie el síntoma?",
    "¿Has tenido fiebre o escalofríos en las últimas horas?",
    "¿Sientes hormigueo o pérdida de fuerza en alguna extremidad?",
    "¿El síntoma se irradia hacia alguna otra zona del cuerpo?",
    "¿Has comido algo fuera de lo habitual hoy?",
    "¿Has estado en contacto con productos químicos recientemente?",
    "¿Cómo calificarías tu nivel de estrés hoy del 0 al 10?",
    "¿Has dormido bien la noche anterior (más de 6 horas)?"
];
