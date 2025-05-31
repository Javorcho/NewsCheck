import React from 'react';
import {
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondary,
    IconButton,
    Alert,
    Divider,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { admin } from '../../services/api';

interface BlockedIP {
    ip_address: string;
    blocked_at: string;
    reason: string;
}

export const BlockedIPs: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: blockedIPs, isLoading, error } = useQuery<BlockedIP[]>(
        'blocked-ips',
        () => admin.getBlockedIPs()
    );

    const unblockMutation = useMutation(
        (ipAddress: string) => admin.unblockIP(ipAddress),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('blocked-ips');
            },
        }
    );

    const handleUnblock = (ipAddress: string) => {
        unblockMutation.mutate(ipAddress);
    };

    if (isLoading) {
        return <Typography>Loading blocked IPs...</Typography>;
    }

    if (error) {
        return (
            <Alert severity="error">
                Failed to load blocked IPs: {(error as any).response?.data?.error || 'Unknown error'}
            </Alert>
        );
    }

    return (
        <Paper elevation={3}>
            <Box p={3}>
                <Typography variant="h5" gutterBottom>
                    Blocked IP Addresses
                </Typography>

                {blockedIPs && blockedIPs.length === 0 ? (
                    <Alert severity="info">No IP addresses are currently blocked.</Alert>
                ) : (
                    <List>
                        {blockedIPs?.map((ip) => (
                            <React.Fragment key={ip.ip_address}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="unblock"
                                            onClick={() => handleUnblock(ip.ip_address)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={ip.ip_address}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="textSecondary">
                                                    Blocked on: {new Date(ip.blocked_at).toLocaleString()}
                                                </Typography>
                                                <br />
                                                <Typography component="span" variant="body2" color="textSecondary">
                                                    Reason: {ip.reason}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
}; 