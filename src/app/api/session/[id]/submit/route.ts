import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RedFlag, Report, SessionStatus } from "@/lib/types";
import { computeTriage } from "@/lib/triage";
import questionsData from "@/lib/questions.json";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = db.getSession(id);

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // 2. AI Triage Computation
        const triage = computeTriage(session.answers);

        // Create Report
        const report: Report = {
            id: crypto.randomUUID(),
            session_id: session.id,
            campaign_id: session.campaign_id,
            created_at: new Date().toISOString(),
            summary: {
                score: triage.score,
                redFlags: triage.reasons.map(r => ({ title: r, detail: r })),
                answers: session.answers,
                triage
            }
        };

        db.createReport(report);

        // Update Session
        db.updateSession(session.id, {
            status: 'SUBMITTED',
            red_flag_score: triage.score,
            red_flags: triage.reasons.map(r => ({ title: r, detail: r })), // Map strings to RedFlag objects for compatibility
            triage: triage,
            submitted_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, reportId: report.id });
    } catch (error) {
        console.error("Error submitting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
