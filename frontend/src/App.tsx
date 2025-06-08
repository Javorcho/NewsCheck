import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Home } from './components/Home/Home';
import { Profile } from './components/Profile/Profile';
import { AdminPanel } from './components/Admin/AdminPanel';
import { History } from './components/History/History';
import { MyFeedback } from './components/Feedback/MyFeedback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';

// Create a client for React Query
const queryClient = new QueryClient();

// Create theme instance
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
});

// Admin Route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user?.is_admin) {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <WebSocketProvider>
                        <Router>
                            <div className="min-h-screen bg-gray-100">
                                <Navigation />
                                <main className="py-10">
                                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                                        <Routes>
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />
                                            <Route
                                                path="/"
                                                element={
                                                    <ProtectedRoute>
                                                        <Layout>
                                                            <Home />
                                                        </Layout>
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/history"
                                                element={
                                                    <ProtectedRoute>
                                                        <Layout>
                                                            <History />
                                                        </Layout>
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/my-feedback"
                                                element={
                                                    <ProtectedRoute>
                                                        <Layout>
                                                            <MyFeedback />
                                                        </Layout>
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/profile"
                                                element={
                                                    <ProtectedRoute>
                                                        <Layout>
                                                            <Profile />
                                                        </Layout>
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/*"
                                                element={
                                                    <AdminRoute>
                                                        <Layout>
                                                            <AdminPanel />
                                                        </Layout>
                                                    </AdminRoute>
                                                }
                                            />
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </div>
                                </main>
                            </div>
                        </Router>
                    </WebSocketProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App; 