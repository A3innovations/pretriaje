import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const success = db.deleteSession(id);

        // Idempotency: If not found, considered deleted.
        // This handles Vercel's serverless nature where a delete request might hit a fresh instance.
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
