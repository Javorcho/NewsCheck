export interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
    created_at: string;
    last_login: string | null;
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

export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface NewsVerification {
    id: number;
    content: string;
    url: string | null;
    reliability_score: number;
    verification_status: 'VERIFIED' | 'LIKELY_TRUE' | 'UNCERTAIN' | 'LIKELY_FALSE' | 'MISINFORMATION';
    analysis_result: {
        content_analysis: {
            sentiment: {
                label: string;
                score: number;
            };
            entities: Array<{
                text: string;
                label: string;
            }>;
            sentence_count: number;
            word_count: number;
            key_phrases: string[];
        };
        metadata: {
            title?: string;
            authors?: string[];
            publish_date?: string;
            source_domain?: string;
            keywords?: string[];
            summary?: string;
        };
        timestamp: string;
    };
    created_at: string;
}

export interface VerificationFeedback {
    id: number;
    verification_id: number;
    user_id: number;
    agrees_with_analysis: boolean;
    comment: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
} 