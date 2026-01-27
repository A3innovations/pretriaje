import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RedFlag, Report, SessionStatus } from "@/lib/types";
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

        // Calculate Red Flags & Score
        const answers = session.answers;
        const redFlags: RedFlag[] = [];
        let score = 0;

        // Process Red Flags Logic from JSON
        // We iterate over all possible questions (core + modules)
        const allQuestions = [...questionsData.core, ...questionsData.modules.flatMap(m => m.questions)];
        const scoringMap = questionsData.scoring.redFlagScoreMap as Record<string, number>;

        allQuestions.forEach((q: any) => {
            const ans = answers[q.id];
            if (!ans) return;

            // key:value checks
            // Simple check: if ans matches redFlagIf
            if (q.redFlagIf && Array.isArray(q.redFlagIf)) {
                // Handle single or multi
                const check = Array.isArray(ans) ? ans : [ans];
                const hasFlag = check.some((v: string) => q.redFlagIf.includes(v));

                if (hasFlag) {
                    redFlags.push({ title: q.text, detail: Array.isArray(ans) ? ans.join(", ") : ans });

                    // Calculate score
                    // Map key format: "questionId:Response"
                    check.forEach((v: string) => {
                        const key = `${q.id}:${v}`;
                        if (scoringMap[key]) {
                            score += scoringMap[key];
                        }
                    });
                }
            }
        });

        // Create Report
        const report: Report = {
            id: crypto.randomUUID(),
            session_id: session.id,
            campaign_id: session.campaign_id,
            created_at: new Date().toISOString(),
            summary: {
                score,
                redFlags,
                answers
            }
        };

        db.createReport(report);

        // Update Session
        db.updateSession(session.id, {
            status: 'SUBMITTED',
            red_flag_score: score,
            red_flags: redFlags,
            submitted_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, reportId: report.id });
    } catch (error) {
        console.error("Error submitting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
