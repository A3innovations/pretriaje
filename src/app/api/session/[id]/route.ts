import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Use destructuring for params in Next.js 15+ or 13+ type signature
// But we need to be careful with the exact signature.
// Standard: export async function PATCH(request: Request, { params }: { params: { id: string } })

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updates = await request.json();

        const session = db.updateSession(id, updates);

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("Error updating session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = db.getSession(id);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }
        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
