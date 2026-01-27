import { Campaign, Report, Session } from './types';

// Mock Data
class InMemoryDB {
    private campaigns: Campaign[] = [];
    private sessions: Session[] = [];
    private reports: Report[] = [];

    constructor() {
        this.seed();
    }

    private seed() {
        // Default Campaign
        this.campaigns.push({
            id: 'demo-campaign',
            company_name: 'TechSolutions S.L.',
            unit_name: 'Unidad Móvil MAD-01',
            location: 'Polígono Alcobendas',
            doctor_emails: ['medico@prevencion.com'],
            qr_token_current: 'token123',
            qr_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h default
            settings: {
                allow_worker_copy: true,
                worker_copy_mode: 'download',
                session_timeout_minutes: 15
            }
        });
    }

    rotateCampaignToken(campaignId: string): string | null {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return null;

        const newToken = crypto.randomUUID().slice(0, 8); // Simple 8 char token
        campaign.qr_token_current = newToken;
        // set 12h expiry
        campaign.qr_token_expires_at = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

        return newToken;
    }

    // Session Ops
    createSession(campaignId: string): Session {
        const session: Session = {
            id: crypto.randomUUID(),
            campaign_id: campaignId,
            status: 'IN_PROGRESS',
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            red_flag_score: 0,
            red_flags: [],
            answers: {}
        };
        this.sessions.push(session);
        return session;
    }

    getSession(id: string): Session | undefined {
        return this.sessions.find(s => s.id === id);
    }

    updateSession(id: string, updates: Partial<Session>): Session | undefined {
        const idx = this.sessions.findIndex(s => s.id === id);
        if (idx === -1) return undefined;

        this.sessions[idx] = { ...this.sessions[idx], ...updates, last_activity_at: new Date().toISOString() };
        return this.sessions[idx];
    }

    getSessionsByCampaign(campaignId: string) {
        return this.sessions.filter(s => s.campaign_id === campaignId);
    }

    // Campaign Ops
    getCampaignByToken(token: string): Campaign | undefined {
        return this.campaigns.find(c => c.qr_token_current === token);
    }

    getCampaign(id: string): Campaign | undefined {
        return this.campaigns.find(c => c.id === id);
    }

    // Reporting
    createReport(report: Report) {
        this.reports.push(report);
    }

    getReports(campaignId: string) {
        return this.reports.filter(r => r.campaign_id === campaignId);
    }
}

// Global Singleton for Next.js dev server
const globalForDB = global as unknown as { db: InMemoryDB };

export const db = globalForDB.db || new InMemoryDB();

if (process.env.NODE_ENV !== 'production') globalForDB.db = db;
