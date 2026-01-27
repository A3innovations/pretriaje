import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    // In a real app, verify admin auth here
    try {
        const { campaignId } = await request.json();
        const newToken = db.rotateCampaignToken(campaignId);

        if (!newToken) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json({
            token: newToken,
            expiresAt: db.getCampaign(campaignId)?.qr_token_expires_at,
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
