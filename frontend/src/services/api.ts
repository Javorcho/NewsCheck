import axios, { AxiosInstance } from 'axios';
import { AuthResponse, NewsRequest, User, Feedback, ApiResponse, NewsVerification, VerificationFeedback } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        const response = await this.api.post('/auth/refresh', { refresh_token: refreshToken });
                        const { access_token } = response.data;

                        localStorage.setItem('token', access_token);
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;

                        return this.api(originalRequest);
                    } catch (refreshError) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Auth endpoints
    async login(email: string, password: string): Promise<ApiResponse<{ access_token: string; refresh_token: string; user: User }>> {
        const response = await this.api.post('/auth/login', { email, password });
        return response.data;
    }

    async register(username: string, email: string, password: string): Promise<ApiResponse<User>> {
        const response = await this.api.post('/auth/register', { username, email, password });
        return response.data;
    }

    async logout(): Promise<void> {
        const refreshToken = localStorage.getItem('refreshToken');
        await this.api.post('/auth/logout', { refresh_token: refreshToken });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }

    // News verification endpoints
    async verifyNews(content: string, url?: string): Promise<ApiResponse<NewsVerification>> {
        const response = await this.api.post('/verify', { content, url });
        return response.data;
    }

    async getVerificationHistory(): Promise<ApiResponse<NewsVerification[]>> {
        const response = await this.api.get('/verify/history');
        return response.data;
    }

    async submitFeedback(
        verificationId: number,
        agreesWithAnalysis: boolean,
        comment?: string
    ): Promise<ApiResponse<VerificationFeedback>> {
        const response = await this.api.post('/verify/feedback', {
            verification_id: verificationId,
            agrees_with_analysis: agreesWithAnalysis,
            comment,
        });
        return response.data;
    }

    // User profile endpoints
    async getProfile(): Promise<ApiResponse<User>> {
        const response = await this.api.get('/users/profile');
        return response.data;
    }

    async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
        const response = await this.api.put('/users/profile', data);
        return response.data;
    }
}

export const apiService = new ApiService();

// Auth API
export const auth = {
    register: (username: string, email: string, password: string) =>
        apiService.register(username, email, password),
        
    login: (email: string, password: string) =>
        apiService.login(email, password),
        
    getCurrentUser: () => apiService.getProfile(),
    
    updateProfile: (data: { email?: string; password?: string }) =>
        apiService.updateProfile(data),
};

// News API
export const news = {
    analyze: (content: string) =>
        apiService.verifyNews(content),
        
    getHistory: (page = 1, perPage = 10) =>
        apiService.getVerificationHistory(),
        
    getDetails: (newsId: number) =>
        apiService.verifyNews(newsId.toString()),
};

// Feedback API
export const feedback = {
    submit: (newsId: number, data: { agrees_with_analysis: boolean; comment?: string }) =>
        apiService.submitFeedback(newsId, data.agrees_with_analysis, data.comment),
        
    getFeedback: (newsId: number) =>
        apiService.verifyNews(newsId.toString()),
        
    updateFeedback: (feedbackId: number, data: { agrees_with_analysis?: boolean; comment?: string }) =>
        apiService.submitFeedback(feedbackId, data.agrees_with_analysis, data.comment),
        
    deleteFeedback: (feedbackId: number) =>
        apiService.submitFeedback(feedbackId, false),
        
    getUserFeedback: (page = 1, perPage = 10) =>
        apiService.getVerificationHistory(),
};

// Admin API
export const admin = {
    getUsers: (page = 1, perPage = 10) =>
        apiService.getVerificationHistory(),
        
    updateUser: (userId: number, data: { is_active?: boolean; is_admin?: boolean }) =>
        apiService.updateProfile(data),
        
    getAnalytics: (days = 30) =>
        apiService.getVerificationHistory(),
        
    getBlockedIPs: () =>
        apiService.getVerificationHistory(),
        
    unblockIP: (ipAddress: string) =>
        apiService.verifyNews(ipAddress),
}; 