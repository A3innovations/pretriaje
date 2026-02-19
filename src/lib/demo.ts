import { Session } from "@/lib/types";
import { computeTriage } from "@/lib/triage";

// Helper for unique DNI (Deterministic for same index if needed, but random is fine for seed as long as session is kept)
const generateDNI = (seed: number) => {
    // Deterministic pseudo-random based on seed
    const num = (12345678 + seed * 100).toString().padStart(8, '0');
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const letter = letters[parseInt(num) % 23];
    return `${num}${letter}`;
};

// 10 Structured Profiles for Demo (High / Medium / Low Risk)
export const DEMO_PROFILES = [
    // --- HIGH RISK (RED) - 3 Profiles ---
    {
        name: "Carlos Sanchez Ruiz",
        age: "56",
        role: "Conducción",
        shift: ["Noche", "Rotatorio"],
        pain: "8",
        red_flag: "Dolor en el pecho",
        red_flag_now: "Sí",
        history_fam: ["Cardiopatías / Infarto / Ictus"],
        history_pers: ["Enfermedad cardiaca", "Hipertensión"],
        surgeries: ["Sí, cirugía mayor"],
        meds: ["Anticoagulantes", "Antihipertensivos"],
        allergies: ["No"],
        vascular: ["Otros"],
        habits: ["Fumador/a"],
        mental: ["No"],
        additional: "Sí",
        additional_desc: "Siento presión en el pecho al subir escaleras",
        exposure: "Conducción"
    },
    {
        name: "Maria Garcia Lopez",
        age: "62",
        role: "Limpieza / mantenimiento",
        shift: ["Mañana"],
        pain: "9",
        red_flag: "Dificultad respiratoria",
        red_flag_now: "Sí",
        history_fam: ["Cáncer"],
        history_pers: ["Enfermedad respiratoria"],
        surgeries: ["No"],
        meds: ["Otros", "Suplementos"],
        allergies: ["Polvo / Ácaros (Otros)"],
        vascular: ["Varices"],
        habits: ["No"],
        mental: ["Depresión"],
        additional: "No",
        additional_desc: "",
        exposure: "Químicos"
    },
    {
        name: "Antonio Diaz Perez",
        age: "59",
        role: "Trabajo con maquinaria / industria",
        shift: ["Tarde"],
        pain: "7",
        red_flag: "Mareo intenso",
        red_flag_now: "Sí",
        history_fam: ["Muerte súbita (<50 años)"],
        history_pers: ["No"],
        surgeries: ["Sí, ingreso hospitalario sin cirugía"],
        meds: ["No"],
        allergies: ["No"],
        vascular: ["No"],
        habits: ["Consumo habitual de alcohol", "Fumador/a"],
        mental: ["No"],
        additional: "No",
        additional_desc: "",
        exposure: "Maquinaria"
    },

    // --- MEDIUM RISK (AMBER) - 3 Profiles ---
    {
        name: "Ana Martinez Fernandez",
        age: "50",
        role: "Administración",
        shift: ["Mañana"],
        pain: "5",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["Diabetes"],
        history_pers: ["Diabetes", "Hipertensión"],
        surgeries: ["Sí, cirugía menor"],
        meds: ["Antihipertensivos"],
        allergies: ["Medicamentos"],
        vascular: ["Insuficiencia venosa"],
        habits: ["Exfumador/a"],
        mental: ["Ansiedad"],
        additional: "Sí",
        additional_desc: "Control regular con endocrino",
        exposure: "Pantallas"
    },
    {
        name: "Jose Gonzalez Martin",
        age: "38",
        role: "Trabajo físico / esfuerzo manual",
        shift: ["Rotatorio"],
        pain: "6",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["No lo sabe"],
        history_pers: ["Trastorno psicológico"],
        surgeries: ["No"],
        meds: ["Antidepresivos / Ansiolíticos"],
        allergies: ["No"],
        vascular: ["No"],
        habits: ["Fumador/a"],
        mental: ["Ansiedad", "Depresión"],
        additional: "No",
        additional_desc: "",
        exposure: "Esfuerzo Físico"
    },
    {
        name: "Elena Fernandez Gomez",
        age: "41",
        role: "Sanidad / cuidados",
        shift: ["Noche"],
        pain: "4",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["Enfermedad neurológica"],
        history_pers: ["No"],
        surgeries: ["Sí, cirugía menor"],
        meds: ["Suplementos"],
        allergies: ["Alimentos"],
        vascular: ["Varices"],
        habits: ["No"],
        mental: ["Prefiere no responder"],
        additional: "No",
        additional_desc: "",
        exposure: "Biológico"
    },

    // --- LOW RISK (GREEN) - 4 Profiles ---
    {
        name: "Laura Rodriguez Santos",
        age: "24",
        role: "Atención al público",
        shift: ["Tarde"],
        pain: "2",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["Ninguno conocido"],
        history_pers: ["No"],
        surgeries: ["No"],
        meds: ["Anticonceptivos hormonales"],
        allergies: ["No"],
        vascular: ["No"],
        habits: ["No"],
        mental: ["No"],
        additional: "No",
        additional_desc: "",
        exposure: "Pantallas"
    },
    {
        name: "Miguel Gomez Romero",
        age: "29",
        role: "Educación",
        shift: ["Mañana"],
        pain: "0",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["Ninguno conocido"],
        history_pers: ["No"],
        surgeries: ["No"],
        meds: ["No"],
        allergies: ["Primavera / Polen (Otros)"],
        vascular: ["No"],
        habits: ["No"],
        mental: ["No"],
        additional: "No",
        additional_desc: "",
        exposure: "Voz"
    },
    {
        name: "Lucia Diaz Torres",
        age: "33",
        role: "Trabajo de oficina / pantallas",
        shift: ["Mañana"],
        pain: "1",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["Ninguno conocido"],
        history_pers: ["No"],
        surgeries: ["Sí, cirugía menor"],
        meds: ["No"],
        allergies: ["No"],
        vascular: ["No"],
        habits: ["No"],
        mental: ["No"],
        additional: "No",
        additional_desc: "",
        exposure: "Pantallas"
    },
    {
        name: "Juan Perez Castillo",
        age: "27",
        role: "Otro puesto de trabajo",
        shift: ["Mañana"],
        pain: "0",
        red_flag: "Ninguna",
        red_flag_now: "No",
        history_fam: ["Ninguno conocido"],
        history_pers: ["No"],
        surgeries: ["No"],
        meds: ["No"],
        allergies: ["No"],
        vascular: ["No"],
        habits: ["No"],
        mental: ["No"],
        additional: "No",
        additional_desc: "",
        exposure: "Ninguna"
    }
];

export function GENERATE_DEMO_SESSIONS(campaignId: string = "demo-campaign"): Session[] {
    return DEMO_PROFILES.map((p, i) => {
        // Deterministic ID
        const id = `ID-${1000 + i}`;

        const answers = {
            "name": p.name,
            "firstname": p.name.split(" ")[0],
            "lastname": p.name.split(" ").slice(1).join(" "),
            "dni": generateDNI(i), // Deterministic DNI
            "q_age": p.age,

            // Questionnaire Answers
            "q_role": p.role,
            "q_shift": p.shift,
            "q_family_history": p.history_fam,
            "q_personal_history": p.history_pers,
            "q_surgeries": p.surgeries,
            "q_medication_habitual": p.meds,
            "q_allergies_known": p.allergies,
            "q_vascular": p.vascular,
            "q_habits": p.habits,
            "q_mental_health": p.mental,
            "q_additional_info": p.additional,
            "q_additional_text": p.additional_desc,

            // Legacy/Background fields
            "q_fit_now": "Sí",
            "q_pain_level": p.pain,
            "q_red_flags": [p.red_flag],
            "q_red_flags_now": p.red_flag_now,
            "q_exposure": p.exposure
        };

        const triage = computeTriage(answers);

        return {
            id,
            campaign_id: campaignId,
            worker_id: id,
            worker_firstname: p.name.split(" ")[0],
            worker_lastname: p.name.split(" ").slice(1).join(" "),
            status: 'SUBMITTED',
            created_at: new Date().toISOString(),
            submitted_at: new Date(Date.now() - (i * 1000 * 60 * 5)).toISOString(),
            answers,
            triage: {
                level: triage.level,
                score: triage.score,
                reasons: triage.reasons,
                aiSummary: triage.aiSummary,
                aiQuestions: triage.aiQuestions
            },
            red_flag_score: triage.score,
            red_flags: triage.reasons.map(r => ({ title: r, detail: r })),
            reviewed: false
        };
    });
}

export function GET_DEMO_SESSION(id: string): Session | undefined {
    // Check if it's a demo ID format ID-1xxx
    if (!id.startsWith("ID-1") || id.length !== 7) return undefined;

    const index = parseInt(id.substring(3));
    const offset = index - 1000;

    if (offset >= 0 && offset < 10) {
        const sessions = GENERATE_DEMO_SESSIONS();
        return sessions[offset];
    }
    return undefined;
}
