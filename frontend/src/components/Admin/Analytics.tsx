import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from '@mui/material';
import {
    Timeline as TimelineIcon,
    People as PeopleIcon,
    Article as ArticleIcon,
    Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { admin } from '../../services/api';

interface AnalyticsData {
    total_users: number;
    active_users: number;
    total_news_requests: number;
    total_feedback: number;
    daily_stats: {
        date: string;
        news_requests: number;
        user_registrations: number;
        feedback_count: number;
    }[];
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => (
    <Card>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" gutterBottom>
                {value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
                {description}
            </Typography>
        </CardContent>
    </Card>
);

export const Analytics: React.FC = () => {
    const [timeRange, setTimeRange] = useState(30); // days
    const { data, isLoading, error } = useQuery<AnalyticsData>(
        ['analytics', timeRange],
        () => admin.getAnalytics(timeRange)
    );

    if (isLoading) {
        return <Typography>Loading analytics...</Typography>;
    }

    if (error) {
        return (
            <Alert severity="error">
                Failed to load analytics: {(error as any).response?.data?.error || 'Unknown error'}
            </Alert>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <Paper elevation={3}>
            <Box p={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">System Analytics</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            label="Time Range"
                            onChange={(e) => setTimeRange(e.target.value as number)}
                        >
                            <MenuItem value={7}>Last 7 days</MenuItem>
                            <MenuItem value={30}>Last 30 days</MenuItem>
                            <MenuItem value={90}>Last 90 days</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Users"
                            value={data.total_users}
                            icon={<PeopleIcon color="primary" />}
                            description="Total registered users"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Active Users"
                            value={data.active_users}
                            icon={<PeopleIcon color="success" />}
                            description="Users with active accounts"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="News Requests"
                            value={data.total_news_requests}
                            icon={<ArticleIcon color="info" />}
                            description="Total news analysis requests"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Feedback"
                            value={data.total_feedback}
                            icon={<FeedbackIcon color="secondary" />}
                            description="Total user feedback received"
                        />
                    </Grid>
                </Grid>

                {/* Daily Statistics */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Daily Statistics
                    </Typography>
                    <Grid container spacing={3}>
                        {data.daily_stats.map((stat) => (
                            <Grid item xs={12} key={stat.date}>
                                <Card>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Date
                                                </Typography>
                                                <Typography variant="body1">
                                                    {new Date(stat.date).toLocaleDateString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    News Requests
                                                </Typography>
                                                <Typography variant="body1">
                                                    {stat.news_requests}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    New Users
                                                </Typography>
                                                <Typography variant="body1">
                                                    {stat.user_registrations}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Feedback
                                                </Typography>
                                                <Typography variant="body1">
                                                    {stat.feedback_count}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Paper>
    );
}; 