import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    Grid,
    Divider,
    Card,
    CardContent,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export const Profile: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validatePasswordChange = () => {
        if (!formData.currentPassword) {
            setError('Current password is required');
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return false;
        }

        if (formData.newPassword && formData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.newPassword && !validatePasswordChange()) {
            return;
        }

        try {
            setLoading(true);
            const updateData: { email?: string; password?: string; currentPassword?: string } = {};

            if (formData.email) {
                updateData.email = formData.email;
            }

            if (formData.newPassword) {
                updateData.password = formData.newPassword;
                updateData.currentPassword = formData.currentPassword;
            }

            await updateProfile(updateData);
            setSuccess('Profile updated successfully');
            setFormData({
                email: '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                {/* User Info Card */}
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Profile Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Username
                                </Typography>
                                <Typography variant="body1">{user.username}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">{user.email}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Account Type
                                </Typography>
                                <Typography variant="body1">
                                    {user.is_admin ? 'Administrator' : 'User'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Member Since
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </Typography>
                            </Grid>
                            {user.last_login && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Last Login
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(user.last_login).toLocaleString()}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>

                {/* Update Profile Form */}
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        Update Profile
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {success}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Change Email
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="email"
                                    label="New Email Address"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Change Password
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            name="currentPassword"
                                            label="Current Password"
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            name="newPassword"
                                            label="New Password"
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            disabled={loading}
                                            helperText="Minimum 8 characters"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            name="confirmPassword"
                                            label="Confirm New Password"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                >
                                    {loading ? 'Updating...' : 'Update Profile'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}; 