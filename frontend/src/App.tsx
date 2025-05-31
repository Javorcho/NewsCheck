import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Home } from './components/Home/Home';

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

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

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

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <Router>
                        <Routes>
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
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                                path="/history"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <div>History Page</div>
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-feedback"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <div>My Feedback Page</div>
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <div>Profile Page</div>
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/*"
                                element={
                                    <AdminRoute>
                                        <Layout>
                                            <div>Admin Panel</div>
                                        </Layout>
                                    </AdminRoute>
                                }
                            />
                        </Routes>
                    </Router>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App; 