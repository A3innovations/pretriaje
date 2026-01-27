import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// We'll use session ID to look up the report for simplicity in routing, 
// unless we want to look up by Report ID. 
// The panel links to "Ver informe". Let's assume the link uses Session ID.
// But technically we stored a Report object too.
// Let's make this route accept session_id or report_id.
// Given the panel uses session.id in the map key, let's use session_id.

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // id is session_id
) {
    try {
        const { id } = await params;
        // Find report processing
        // In our submit logic, we created a report.
        // In our DB mock, 'db.getReports' filters by campaign, not session.
        // Let's add db.getReportBySessionId if needed, or just find it.

        // Hack for MVP since I didn't add getReportBySessionId to mock DB explicitly
        // I can just return the session and re-construct the view, 
        // OR I can add the method to the DB file.
        // Let's just return the session + derived data, keeping it simple.
        // The report snapshot is technically static, but for this demo, session data is fine.

        const session = db.getSession(id);
        if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (session.status !== 'SUBMITTED') {
            return NextResponse.json({ error: "El reporte aún no está disponible." }, { status: 403 });
        }

        // Return what the report page needs
        // We can return the Session object which contains answers and red flags
        return NextResponse.json(session);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
