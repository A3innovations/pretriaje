import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Campaign ID

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        let sessions = db.getSessionsByCampaign(id);

        if (status) {
            sessions = sessions.filter(s => s.status === status);
        }

        // Sort by submitted_at desc (newest first)
        sessions.sort((a, b) => {
            const ta = a.submitted_at || a.last_activity_at;
            const tb = b.submitted_at || b.last_activity_at;
            return new Date(tb).getTime() - new Date(ta).getTime();
        });

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
