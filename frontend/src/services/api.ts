import axios from 'axios';
import { AuthResponse, NewsRequest, User, Feedback } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const auth = {
    register: (username: string, email: string, password: string) =>
        api.post<AuthResponse>('/auth/register', { username, email, password }),
        
    login: (username: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { username, password }),
        
    getCurrentUser: () => api.get<User>('/auth/me'),
    
    updateProfile: (data: { email?: string; password?: string }) =>
        api.put<{ message: string; user: User }>('/auth/me', data),
};

// News API
export const news = {
    analyze: (content: string) =>
        api.post<NewsRequest>('/news/analyze', { content }),
        
    getHistory: (page = 1, perPage = 10) =>
        api.get<{ items: NewsRequest[]; total: number; pages: number }>('/news/history', {
            params: { page, per_page: perPage },
        }),
        
    getDetails: (newsId: number) =>
        api.get<NewsRequest>(`/news/${newsId}`),
};

// Feedback API
export const feedback = {
    submit: (newsId: number, data: { agrees_with_analysis: boolean; comment?: string }) =>
        api.post<{ message: string; feedback: Feedback }>(`/news/${newsId}/feedback`, data),
        
    getFeedback: (newsId: number) =>
        api.get<{ feedback: Feedback[] }>(`/news/${newsId}/feedback`),
        
    updateFeedback: (feedbackId: number, data: { agrees_with_analysis?: boolean; comment?: string }) =>
        api.put<{ message: string; feedback: Feedback }>(`/feedback/${feedbackId}`, data),
        
    deleteFeedback: (feedbackId: number) =>
        api.delete(`/feedback/${feedbackId}`),
        
    getUserFeedback: (page = 1, perPage = 10) =>
        api.get<{ feedback: Feedback[]; total: number; pages: number }>('/my/feedback', {
            params: { page, per_page: perPage },
        }),
};

// Admin API
export const admin = {
    getUsers: (page = 1, perPage = 10) =>
        api.get<{ users: User[]; total: number; pages: number }>('/admin/users', {
            params: { page, per_page: perPage },
        }),
        
    updateUser: (userId: number, data: { is_active?: boolean; is_admin?: boolean }) =>
        api.put<{ message: string; user: User }>(`/admin/users/${userId}`, data),
        
    getAnalytics: (days = 30) =>
        api.get('/admin/analytics', { params: { days } }),
        
    getBlockedIPs: () =>
        api.get('/admin/blocked-ips'),
        
    unblockIP: (ipAddress: string) =>
        api.delete(`/admin/blocked-ips/${ipAddress}`),
}; 