import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeTriage } from "@/lib/triage";
import { GENERATE_DEMO_SESSIONS } from "@/lib/demo";

export async function POST(req: NextRequest) {
    try {
        const campaignId = "demo-campaign";
        // Create 10 fake sessions
        // Helper for unique DNI
        const generateRandomDNI = () => {
            const num = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
            const letter = letters[parseInt(num) % 23];
            return `${num}${letter}`;
        };

        // 10 Structured Profiles for Demo (High / Medium / Low Risk)
        const demoProfiles = [
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
                surgeries: ["Sí, cirugía menor"], // Example: wisdom teeth
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

        for (let i = 0; i < demoProfiles.length; i++) {
            const p = demoProfiles[i];
            const session = db.createSession(campaignId);

            const answers = {
                "name": p.name,
                "firstname": p.name.split(" ")[0],
                "lastname": p.name.split(" ").slice(1).join(" "),
                "dni": generateRandomDNI(), // Unique ID
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

                // Legacy/Background fields for Triage Logic
                "q_fit_now": "Sí",
                "q_pain_level": p.pain,
                "q_red_flags": [p.red_flag],
                "q_red_flags_now": p.red_flag_now,
                "q_exposure": p.exposure
            };

            // Compute Triage
            const triage = computeTriage(answers);

            // Update DB using internal method (simulated)
            const s = db.getSession(session.id);
            if (s) {
                s.answers = answers;
                s.status = 'SUBMITTED';
                s.submitted_at = new Date(Date.now() - (i * 1000 * 60 * 5)).toISOString(); // Stagger times
                s.triage = triage;
                s.red_flag_score = triage.score; // Sync for compatibility
                s.red_flags = triage.reasons.map(r => ({ title: r, detail: r }));

                // Add worker_id for table
                s.worker_id = `ID-${1000 + i}`;
                s.worker_firstname = p.name.split(" ")[0];
                s.worker_lastname = p.name.split(" ")[1];
            }
        }

        return NextResponse.json({ success: true, count: 10 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
