import React, { useState } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Switch,
    IconButton,
    Typography,
    Alert,
    Box,
    Chip,
} from '@mui/material';
import {
    Check as CheckIcon,
    Block as BlockIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { admin } from '../../services/api';
import { User } from '../../types';

export const UserManagement: React.FC = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const queryClient = useQueryClient();

    const { data: usersData, isLoading, error } = useQuery(
        ['users', page, rowsPerPage],
        () => admin.getUsers(page + 1, rowsPerPage),
        {
            keepPreviousData: true,
        }
    );

    const updateUserMutation = useMutation(
        (params: { userId: number; data: { is_active?: boolean; is_admin?: boolean } }) =>
            admin.updateUser(params.userId, params.data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
            },
        }
    );

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleToggleActive = (userId: number, currentValue: boolean) => {
        updateUserMutation.mutate({
            userId,
            data: { is_active: !currentValue },
        });
    };

    const handleToggleAdmin = (userId: number, currentValue: boolean) => {
        updateUserMutation.mutate({
            userId,
            data: { is_admin: !currentValue },
        });
    };

    if (isLoading) {
        return <Typography>Loading users...</Typography>;
    }

    if (error) {
        return (
            <Alert severity="error">
                Failed to load users: {(error as any).response?.data?.error || 'Unknown error'}
            </Alert>
        );
    }

    return (
        <Paper elevation={3}>
            <Box p={3}>
                <Typography variant="h5" gutterBottom>
                    User Management
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Member Since</TableCell>
                                <TableCell>Last Login</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usersData?.users.map((user: User) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={user.is_active ? <CheckIcon /> : <BlockIcon />}
                                            label={user.is_active ? 'Active' : 'Inactive'}
                                            color={user.is_active ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={<AdminIcon />}
                                            label={user.is_admin ? 'Admin' : 'User'}
                                            color={user.is_admin ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleString()
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleToggleActive(user.id, user.is_active)}
                                            color={user.is_active ? 'success' : 'error'}
                                        >
                                            {user.is_active ? <CheckIcon /> : <BlockIcon />}
                                        </IconButton>
                                        <Switch
                                            checked={user.is_admin}
                                            onChange={() => handleToggleAdmin(user.id, user.is_admin)}
                                            color="primary"
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={usersData?.total || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Box>
        </Paper>
    );
}; 