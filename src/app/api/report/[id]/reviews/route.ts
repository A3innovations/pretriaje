import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await segmentData.params;
        const session = db.getSession(id);

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Update with reviewed flag
        const updates: any = { reviewed: true, reviewed_at: new Date().toISOString() };
        db.updateSession(id, updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Review API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
