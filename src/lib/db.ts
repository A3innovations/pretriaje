import { Campaign, Report, Session } from './types';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

interface DBSchema {
    campaigns: Campaign[];
    sessions: Session[];
    reports: Report[];
}

class InMemoryDB {
    private campaigns: Campaign[] = [];
    private sessions: Session[] = [];
    private reports: Report[] = [];

    constructor() {
        this.load();
        if (this.campaigns.length === 0) {
            this.seed();
            this.save();
        }
    }

    private load() {
        try {
            if (fs.existsSync(DB_FILE_PATH)) {
                const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
                const parsed: DBSchema = JSON.parse(data);
                this.campaigns = parsed.campaigns || [];
                this.sessions = parsed.sessions || [];
                this.reports = parsed.reports || [];
                console.log(`[DB] Loaded ${this.sessions.length} sessions from disk.`);
            }
        } catch (error) {
            console.error("[DB] Failed to load database:", error);
        }
    }

    private save() {
        try {
            const data: DBSchema = {
                campaigns: this.campaigns,
                sessions: this.sessions,
                reports: this.reports
            };
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
        } catch (error) {
            // Check if it's a read-only file system error (common in Vercel)
            // We log it but don't throw, allowing the app to continue in-memory
            console.warn("[DB] Failed to save database to disk (running in-memory only):", error);
        }
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
        this.save();

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
        this.save();
        return session;
    }

    getSession(id: string): Session | undefined {
        // Reload to ensure freshness in dev mode? 
        // Ideally we only load on init, but in serverless/nextjs caching might be tricky.
        // For this simple implementation, we rely on in-memory state being kept in the global singleton.
        return this.sessions.find(s => s.id === id);
    }

    updateSession(id: string, updates: Partial<Session>): Session | undefined {
        const idx = this.sessions.findIndex(s => s.id === id);
        if (idx === -1) return undefined;

        this.sessions[idx] = { ...this.sessions[idx], ...updates, last_activity_at: new Date().toISOString() };
        this.save();
        return this.sessions[idx];
    }

    deleteSession(id: string): boolean {
        const initialLength = this.sessions.length;
        this.sessions = this.sessions.filter(s => s.id !== id);
        if (this.sessions.length !== initialLength) {
            this.save();
            return true;
        }
        return false;
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
        this.save();
    }

    getReports(campaignId: string) {
        return this.reports.filter(r => r.campaign_id === campaignId);
    }
}

// Global Singleton for Next.js dev server
const globalForDB = global as unknown as { db: InMemoryDB };

export const db = globalForDB.db || new InMemoryDB();

if (process.env.NODE_ENV !== 'production') globalForDB.db = db;
