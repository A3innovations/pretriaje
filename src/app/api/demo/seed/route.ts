import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeTriage } from "@/lib/triage";

export async function POST(req: NextRequest) {
    try {
        const campaignId = "demo-campaign";
        // Create 10 fake sessions
        // 10 Structured Profiles for Demo
        const demoProfiles = [
            // --- HIGH RISK (RED) ---
            {
                name: "Carlos Sanchez",
                age: "56",
                role: "Conducción",
                pain: "8",
                red_flag: "Dolor en el pecho",
                red_flag_now: "Sí",
                history_fam: ["Cardiopatías / Infarto / Ictus"],
                history_pers: ["Hipertensión", "Enfermedad cardiaca"],
                meds: ["Anticoagulantes", "Antihipertensivos"],
                habits: ["Fumador/a"],
                exposure: "Conducción"
            },
            {
                name: "Maria Garcia",
                age: "62",
                role: "Limpieza / mantenimiento",
                pain: "9",
                red_flag: "Dificultad respiratoria",
                red_flag_now: "Sí",
                history_fam: ["Cáncer"],
                history_pers: ["Enfermedad respiratoria"],
                meds: ["Otros"],
                habits: ["No"],
                exposure: "Químicos"
            },
            {
                name: "Luis Lopez",
                age: "45",
                role: "Trabajo con maquinaria / industria",
                pain: "7",
                red_flag: "Mareo intenso",
                red_flag_now: "Sí",
                history_fam: ["Muerte súbita (<50 años)"],
                history_pers: ["No"],
                meds: ["No"],
                habits: ["Consumo habitual de alcohol"],
                exposure: "Maquinaria"
            },
            // --- MEDIUM RISK (AMBER) ---
            {
                name: "Ana Martinez",
                age: "50",
                role: "Administración",
                pain: "5",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["Diabetes"],
                history_pers: ["Diabetes", "Hipertensión"],
                meds: ["Antihipertensivos"],
                habits: ["Exfumador/a"],
                exposure: "Pantallas"
            },
            {
                name: "Jose Gonzalez",
                age: "38",
                role: "Trabajo físico / esfuerzo manual",
                pain: "6",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["No lo sabe"],
                history_pers: ["No"],
                meds: ["Ansiolíticos / Antidepresivos"],
                habits: ["Fumador/a"],
                exposure: "Esfuerzo Físico"
            },
            {
                name: "Elena Fernandez",
                age: "41",
                role: "Sanidad / cuidados",
                pain: "4",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["Enfermedad neurológica"],
                history_pers: ["Trastorno psicológico"],
                meds: ["Suplementos"],
                habits: ["No"],
                exposure: "Esfuerzo Físico"
            },
            // --- LOW RISK (GREEN) ---
            {
                name: "Laura Rodriguez",
                age: "24",
                role: "Atención al público",
                pain: "2",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["Ninguno conocido"],
                history_pers: ["No"],
                meds: ["Anticonceptivos hormonales"],
                habits: ["No"],
                exposure: "Pantallas"
            },
            {
                name: "Miguel Gomez",
                age: "29",
                role: "Educación",
                pain: "0",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["Ninguno conocido"],
                history_pers: ["No"],
                meds: ["No"],
                habits: ["No"],
                exposure: "Pantallas"
            },
            {
                name: "Lucia Diaz",
                age: "33",
                role: "Trabajo de oficina / pantallas",
                pain: "1",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["Ninguno conocido"],
                history_pers: ["No"],
                meds: ["No"],
                habits: ["No"],
                exposure: "Pantallas"
            },
            {
                name: "Juan Perez",
                age: "27",
                role: "Otro puesto de trabajo",
                pain: "0",
                red_flag: "Ninguna",
                red_flag_now: "No",
                history_fam: ["Ninguno conocido"],
                history_pers: ["No"],
                meds: ["No"],
                habits: ["No"],
                exposure: "Ninguna"
            }
        ];

        for (let i = 0; i < demoProfiles.length; i++) {
            const p = demoProfiles[i];
            const session = db.createSession(campaignId);

            const answers = {
                "name": p.name,
                "firstname": p.name.split(" ")[0],
                "lastname": p.name.split(" ")[1],
                "q_age": p.age,
                "q_role": p.role,
                "q_fit_now": "Sí",
                "q_pain_level": p.pain,
                "q_red_flags": [p.red_flag],
                "q_red_flags_now": p.red_flag_now,
                "q_family_history": p.history_fam,
                "q_personal_history": p.history_pers,
                "q_medication_habitual": p.meds,
                "q_habits": p.habits,
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
