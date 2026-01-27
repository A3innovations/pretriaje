import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { campaignId } = await request.json();

        // Stateless Token Generation (for Vercel compatibility)
        // Format: simple base64 of json { c: campaignId, e: timestamp }
        // 12 hours validity from rotation
        const payload = {
            c: campaignId,
            e: Date.now() + 12 * 60 * 60 * 1000,
            s: Math.random().toString(36).substring(7) // salt
        };

        const newToken = Buffer.from(JSON.stringify(payload)).toString('base64');

        // We still update DB for local consistency in the same lambda
        db.rotateCampaignToken(campaignId);

        return NextResponse.json({
            token: newToken,
            expiresAt: new Date(payload.e).toISOString(),
            urlParams: `?campaign_id=${campaignId}&token=${newToken}`
        });
    } catch (e) {
        console.error("QR Rotation Error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const c = db.getCampaign(campaignId);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
        token: c.qr_token_current,
        expiresAt: c.qr_token_expires_at
    });
}
