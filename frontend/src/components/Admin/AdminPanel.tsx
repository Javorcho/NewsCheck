import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Box,
} from '@mui/material';
import {
    People as PeopleIcon,
    Analytics as AnalyticsIcon,
    Block as BlockIcon,
} from '@mui/icons-material';
import { UserManagement } from './UserManagement';
import { Analytics } from './Analytics';
import { BlockedIPs } from './BlockedIPs';

export const AdminPanel: React.FC = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            text: 'User Management',
            icon: <PeopleIcon />,
            path: '/admin/users',
        },
        {
            text: 'Analytics',
            icon: <AnalyticsIcon />,
            path: '/admin/analytics',
        },
        {
            text: 'Blocked IPs',
            icon: <BlockIcon />,
            path: '/admin/blocked-ips',
        },
    ];

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Admin Panel
                </Typography>
                <Grid container spacing={3}>
                    {/* Sidebar Navigation */}
                    <Grid item xs={12} md={3}>
                        <Paper elevation={3}>
                            <List>
                                {menuItems.map((item) => (
                                    <ListItem
                                        button
                                        key={item.text}
                                        onClick={() => navigate(item.path)}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Content Area */}
                    <Grid item xs={12} md={9}>
                        <Routes>
                            <Route path="users" element={<UserManagement />} />
                            <Route path="analytics" element={<Analytics />} />
                            <Route path="blocked-ips" element={<BlockedIPs />} />
                        </Routes>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}; 