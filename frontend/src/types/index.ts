export interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
    created_at: string;
    last_login?: string;
}

export interface NewsRequest {
    id: number;
    content: string;
    is_url: boolean;
    analysis_result: string;
    confidence_score: number;
    created_at: string;
    feedback: Feedback[];
}

export interface Feedback {
    id: number;
    user: {
        id: number;
        username: string;
    };
    agrees_with_analysis: boolean;
    comment?: string;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface ApiError {
    error: string;
} 