import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const success = db.deleteSession(id);

        if (!success) {
            return NextResponse.json({ error: "Session not found or could not be deleted" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
