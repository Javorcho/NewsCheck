import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    Grid,
    Chip,
} from '@mui/material';
import { useMutation } from 'react-query';
import { news } from '../../services/api';
import { NewsRequest } from '../../types';

export const Home: React.FC = () => {
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    const analyzeMutation = useMutation(
        (content: string) => news.analyze(content),
        {
            onError: (err: any) => {
                setError(err.response?.data?.error || 'Failed to analyze news');
            },
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError('Please enter a URL or text to analyze');
            return;
        }
        analyzeMutation.mutate(content);
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    const renderAnalysisResult = (result: NewsRequest) => (
        <Card sx={{ mt: 4 }}>
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Analysis Result
                        </Typography>
                        <Chip
                            label={result.analysis_result.toUpperCase()}
                            color={result.analysis_result === 'reliable' ? 'success' : 'error'}
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            label={`${Math.round(result.confidence_score)}% Confidence`}
                            color={getConfidenceColor(result.confidence_score)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Analyzed Content:
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {result.content}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="textSecondary">
                            Analysis Details:
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            {Object.entries(result).map(([key, value]) => {
                                if (key === 'content' || key === 'id' || key === 'created_at' || key === 'feedback') {
                                    return null;
                                }
                                return (
                                    <Typography key={key} variant="body2">
                                        {key.replace(/_/g, ' ').toUpperCase()}: {value.toString()}
                                    </Typography>
                                );
                            })}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom align="center">
                        News Verification
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="textSecondary" sx={{ mb: 4 }}>
                        Enter a news article URL or paste the text content to analyze its reliability
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            placeholder="Enter URL or paste news content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={analyzeMutation.isLoading}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={analyzeMutation.isLoading}
                        >
                            {analyzeMutation.isLoading ? (
                                <>
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze News'
                            )}
                        </Button>
                    </Box>

                    {analyzeMutation.data?.data && renderAnalysisResult(analyzeMutation.data.data)}
                </Paper>
            </Box>
        </Container>
    );
}; 