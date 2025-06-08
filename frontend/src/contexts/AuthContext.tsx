import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User } from '../types';
import { apiService } from '../services/api';

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: false,
    loading: true,
    error: null,
};

type AuthAction =
    | { type: 'LOGIN_START' }
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
    | { type: 'LOGIN_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                loading: true,
                error: null,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                refreshToken: action.payload.refreshToken,
                isAuthenticated: true,
                loading: false,
                error: null,
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                loading: false,
                error: action.payload,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const loadUser = async () => {
            if (state.token) {
                try {
                    const response = await apiService.getProfile();
                    if (response.data) {
                        dispatch({
                            type: 'LOGIN_SUCCESS',
                            payload: {
                                user: response.data,
                                token: state.token,
                                refreshToken: state.refreshToken || '',
                            },
                        });
                    }
                } catch (error) {
                    dispatch({ type: 'LOGOUT' });
                }
            } else {
                dispatch({ type: 'LOGOUT' });
            }
        };

        loadUser();
    }, [state.token, state.refreshToken]);

    const login = async (email: string, password: string) => {
        try {
            dispatch({ type: 'LOGIN_START' });
            const response = await apiService.login(email, password);
            if (response.data) {
                const { access_token, refresh_token, user } = response.data;
                localStorage.setItem('token', access_token);
                localStorage.setItem('refreshToken', refresh_token);
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        user,
                        token: access_token,
                        refreshToken: refresh_token,
                    },
                });
            }
        } catch (error: any) {
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: error.response?.data?.error || 'An error occurred during login',
            });
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            dispatch({ type: 'LOGIN_START' });
            const response = await apiService.register(username, email, password);
            if (response.data) {
                await login(email, password);
            }
        } catch (error: any) {
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: error.response?.data?.error || 'An error occurred during registration',
            });
            throw error;
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            dispatch({ type: 'LOGOUT' });
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                register,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 