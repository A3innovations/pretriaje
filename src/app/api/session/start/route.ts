import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { campaignId, token } = body;

        // Validate Campaign
        const campaign = db.getCampaign(campaignId);

        if (!campaign) {
            return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        }

        // Validate Token
        if (campaign.qr_token_current !== token) {
            return NextResponse.json({ error: "Token inválido" }, { status: 403 });
        }

        if (campaign.qr_token_expires_at && new Date(campaign.qr_token_expires_at) < new Date()) {
            return NextResponse.json({ error: "El código QR ha expirado. Solicita uno nuevo." }, { status: 403 });
        }

        // Create Session
        const session = db.createSession(campaign.id);

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error("Error starting session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
