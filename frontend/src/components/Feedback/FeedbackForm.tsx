import React, { useState } from 'react';
import {
    Box,
    FormControlLabel,
    Switch,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { feedback } from '../../services/api';

interface FeedbackFormProps {
    newsId: number;
    onSuccess?: () => void;
    initialData?: {
        agrees_with_analysis: boolean;
        comment?: string;
    };
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ newsId, onSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        agrees_with_analysis: initialData?.agrees_with_analysis || false,
        comment: initialData?.comment || '',
    });
    const queryClient = useQueryClient();

    const { mutate, isLoading, error } = useMutation(
        (data: { agrees_with_analysis: boolean; comment?: string }) =>
            feedback.submit(newsId, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['news-history']);
                queryClient.invalidateQueries(['news-details', newsId]);
                if (onSuccess) {
                    onSuccess();
                }
                setFormData({
                    agrees_with_analysis: false,
                    comment: '',
                });
            },
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {(error as any).response?.data?.error || 'Failed to submit feedback'}
                </Alert>
            )}

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
                        disabled={isLoading}
                    />
                }
                label={formData.agrees_with_analysis ? 'I Agree with the Analysis' : 'I Disagree with the Analysis'}
            />

            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add your comment (optional)"
                value={formData.comment}
                onChange={(e) =>
                    setFormData((prev) => ({
                        ...prev,
                        comment: e.target.value,
                    }))
                }
                disabled={isLoading}
                sx={{ mt: 2 }}
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{ mt: 2 }}
            >
                {isLoading ? (
                    <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Submitting...
                    </>
                ) : (
                    'Submit Feedback'
                )}
            </Button>
        </Box>
    );
}; 