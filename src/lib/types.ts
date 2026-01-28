export type Campaign = {
    id: string;
    company_name: string;
    unit_name: string;
    location?: string;
    doctor_emails: string[];
    qr_token_current: string;
    qr_token_expires_at?: string; // ISO string
    settings: {
        allow_worker_copy: boolean;
        worker_copy_mode: 'email' | 'download' | 'both';
        session_timeout_minutes: number;
    };
};

export type SessionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'CANCELLED' | 'EXPIRED';

export type Session = {
    id: string;
    campaign_id: string;
    status: SessionStatus;
    started_at: string; // ISO
    last_activity_at: string; // ISO
    submitted_at?: string; // ISO
    reviewed?: boolean;
    reviewed_at?: string; // ISO

    // Worker Data
    worker_id?: string; // DNI/Employee No
    worker_firstname?: string;
    worker_lastname?: string;
    worker_id_last4?: string;
    dob?: string;
    worker_email?: string;

    // Risk/Outcome
    red_flag_score: number;
    red_flags: RedFlag[];

    // Answers map
    answers: Record<string, any>; // question_id -> value

    // AI Triage Data
    triage?: TriageAnalysis;
};

export type TriageLevel = 'verde' | 'ambar' | 'rojo';

export type TriageAnalysis = {
    score: number;
    level: TriageLevel;
    reasons: string[];
    aiSummary: string;
    aiQuestions: string[];
};

export type Answer = {
    question_id: string;
    value: string | string[] | number | boolean;
};

export type RedFlag = {
    title: string;
    detail: string;
};

export type Report = {
    id: string;
    session_id: string;
    campaign_id: string;
    created_at: string;
    summary: any;
    html?: string;
};

// --- Questionnaire Engine Types ---

export type QuestionType = 'single' | 'multi' | 'text' | 'number' | 'info';

export type QuestionOption = string; // Simple string options for now

export type Question = {
    id: string;
    type: QuestionType;
    text: string;
    options?: string[];
    other?: boolean;
    required?: boolean;
    placeholder?: string;
    maxChars?: number;
    showIf?: {
        question: string;
        equals: string;
    };
    redFlagIf?: string[];
};

export type Module = {
    id: string;
    trigger: {
        exposuresIncludes?: string[];
    };
    questions: Question[];
};

export type QuestionnaireConfig = {
    version: string;
    ui: {
        max_options: number;
        other_char_limit: number;
        show_progress: boolean;
    };
    start_ack: {
        text: string;
        consent_checkbox?: {
            label: string;
            required: boolean;
            version: string;
        };
    };
    core: Question[];
    modules: Module[];
    closing: Question[];
    scoring: {
        redFlagScoreMap: Record<string, number>;
        priorityLevels: { minScore: number; label: string }[];
    };
};
