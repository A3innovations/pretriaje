import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeTriage } from "@/lib/triage";

export async function POST(req: NextRequest) {
    try {
        const campaignId = "demo-campaign";
        // Create 10 fake sessions
        const names = ["Juan Perez", "Maria Garcia", "Luis Lopez", "Ana Martinez", "Carlos Sanchez", "Laura Rodriguez", "Jose Gonzalez", "Elena Fernandez", "Miguel Gomez", "Lucia Diaz"];

        for (let i = 0; i < 10; i++) {
            const session = db.createSession(campaignId);

            // Random Answers
            const pain = Math.floor(Math.random() * 9); // 0-8
            const redFlag = Math.random() > 0.8 ? "Dolor en el pecho" : "Ninguna";
            const meds = Math.random() > 0.7 ? "Sí" : "No";

            const answers = {
                "name": names[i],
                "firstname": names[i],
                "q_age": "31-45",
                "q_role": "Administración",
                "q_fit_now": "Sí",
                "q_pain_level": pain.toString(),
                "q_red_flags": [redFlag],
                "q_red_flags_now": redFlag !== "Ninguna" ? "Sí" : "No",
                "q_meds_today": meds,
                "q_exposure": "Pantallas"
            };

            // Compute Triage
            const triage = computeTriage(answers);

            // Update DB using internal method (simulated)
            const s = db.getSession(session.id);
            if (s) {
                s.answers = answers;
                s.status = 'SUBMITTED';
                s.submitted_at = new Date().toISOString();
                s.triage = triage;
                s.red_flag_score = triage.score; // Sync for compatibility
                s.red_flags = triage.reasons.map(r => ({ title: r, detail: r }));

                // Add worker_id for table
                s.worker_id = `ID-${1000 + i}`;
            }
        }

        return NextResponse.json({ success: true, count: 10 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
