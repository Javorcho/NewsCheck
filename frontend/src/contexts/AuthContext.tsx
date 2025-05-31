import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth } from '../services/api';
import jwt_decode from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: { email?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface TokenPayload {
    sub: number;
    exp: number;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Check if token is expired
                    const decoded = jwt_decode<TokenPayload>(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        localStorage.removeItem('token');
                        return;
                    }

                    const response = await auth.getCurrentUser();
                    setUser(response.data);
                } catch (err) {
                    localStorage.removeItem('token');
                    console.error('Failed to initialize auth:', err);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setError(null);
            const response = await auth.login(username, password);
            localStorage.setItem('token', response.data.access_token);
            setUser(response.data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
            throw err;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            setError(null);
            const response = await auth.register(username, email, password);
            localStorage.setItem('token', response.data.access_token);
            setUser(response.data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to register');
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateProfile = async (data: { email?: string; password?: string }) => {
        try {
            setError(null);
            const response = await auth.updateProfile(data);
            setUser(response.data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                register,
                logout,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}; 