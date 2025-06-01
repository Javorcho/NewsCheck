import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    TablePagination,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    Alert,
    Chip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { feedback } from '../../services/api';
import { Feedback } from '../../types';

interface EditDialogProps {
    open: boolean;
    feedback: Feedback | null;
    onClose: () => void;
    onSave: (data: { agrees_with_analysis: boolean; comment?: string }) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, feedback, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        agrees_with_analysis: feedback?.agrees_with_analysis || false,
        comment: feedback?.comment || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Edit Feedback</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.agrees_with_analysis}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            agrees_with_analysis: e.target.checked,
                                        }))
                                    }
                                    color="primary"
                                />
                            }
                            label={formData.agrees_with_analysis ? 'Agree with Analysis' : 'Disagree with Analysis'}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Comment"
                            value={formData.comment}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    comment: e.target.value,
                                }))
                            }
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export const MyFeedback: React.FC = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [editFeedback, setEditFeedback] = useState<Feedback | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery(
        ['my-feedback', page, rowsPerPage],
        () => feedback.getUserFeedback(page + 1, rowsPerPage),
        {
            keepPreviousData: true,
        }
    );

    const updateMutation = useMutation(
        (params: { feedbackId: number; data: { agrees_with_analysis: boolean; comment?: string } }) =>
            feedback.updateFeedback(params.feedbackId, params.data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('my-feedback');
                setEditFeedback(null);
            },
        }
    );

    const deleteMutation = useMutation(
        (feedbackId: number) => feedback.deleteFeedback(feedbackId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('my-feedback');
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

    const handleEdit = (feedbackItem: Feedback) => {
        setEditFeedback(feedbackItem);
    };

    const handleDelete = (feedbackId: number) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            deleteMutation.mutate(feedbackId);
        }
    };

    const handleSaveEdit = (data: { agrees_with_analysis: boolean; comment?: string }) => {
        if (editFeedback) {
            updateMutation.mutate({
                feedbackId: editFeedback.id,
                data,
            });
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Typography>Loading feedback...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error">
                        Failed to load feedback: {(error as any).response?.data?.error || 'Unknown error'}
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        My Feedback
                    </Typography>

                    <Grid container spacing={3}>
                        {data?.feedback.map((feedbackItem: Feedback) => (
                            <Grid item xs={12} key={feedbackItem.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                    <Chip
                                                        icon={
                                                            feedbackItem.agrees_with_analysis ? (
                                                                <ThumbUpIcon />
                                                            ) : (
                                                                <ThumbDownIcon />
                                                            )
                                                        }
                                                        label={
                                                            feedbackItem.agrees_with_analysis
                                                                ? 'Agrees with Analysis'
                                                                : 'Disagrees with Analysis'
                                                        }
                                                        color={feedbackItem.agrees_with_analysis ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </Box>
                                                {feedbackItem.comment && (
                                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                                        {feedbackItem.comment}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" color="textSecondary" display="block">
                                                    Posted on: {new Date(feedbackItem.created_at).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(feedbackItem)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(feedbackItem.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <TablePagination
                        component="div"
                        count={data?.total || 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                        sx={{ mt: 2 }}
                    />
                </Paper>
            </Box>

            <EditDialog
                open={!!editFeedback}
                feedback={editFeedback}
                onClose={() => setEditFeedback(null)}
                onSave={handleSaveEdit}
            />
        </Container>
    );
}; 