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
    Chip,
    IconButton,
    Collapse,
    TextField,
    InputAdornment,
    Alert,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Search as SearchIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { news } from '../../services/api';
import { NewsRequest } from '../../types';

export const History: React.FC = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data, isLoading, error } = useQuery(
        ['news-history', page, rowsPerPage],
        () => news.getHistory(page + 1, rowsPerPage),
        {
            keepPreviousData: true,
        }
    );

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleExpandClick = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    const filteredRequests = data?.items.filter((request) =>
        searchTerm
            ? request.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
              request.analysis_result.toLowerCase().includes(searchTerm.toLowerCase())
            : true
    );

    if (isLoading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Typography>Loading history...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error">
                        Failed to load history: {(error as any).response?.data?.error || 'Unknown error'}
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">Analysis History</Typography>
                        <TextField
                            size="small"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Grid container spacing={3}>
                        {filteredRequests?.map((request: NewsRequest) => (
                            <Grid item xs={12} key={request.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        mb: 2,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: expandedId === request.id ? 'unset' : 3,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}
                                                >
                                                    {request.content}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                    <Chip
                                                        label={request.analysis_result.toUpperCase()}
                                                        color={request.analysis_result === 'reliable' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                    <Chip
                                                        label={`${Math.round(request.confidence_score)}% Confidence`}
                                                        color={getConfidenceColor(request.confidence_score)}
                                                        size="small"
                                                    />
                                                    {request.is_url && (
                                                        <Chip label="URL" color="primary" size="small" />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="textSecondary">
                                                    Analyzed on: {new Date(request.created_at).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                onClick={() => handleExpandClick(request.id)}
                                                sx={{ ml: 2 }}
                                            >
                                                {expandedId === request.id ? (
                                                    <ExpandLessIcon />
                                                ) : (
                                                    <ExpandMoreIcon />
                                                )}
                                            </IconButton>
                                        </Box>

                                        <Collapse in={expandedId === request.id}>
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    Feedback
                                                </Typography>
                                                {request.feedback.length > 0 ? (
                                                    request.feedback.map((feedback) => (
                                                        <Card
                                                            key={feedback.id}
                                                            variant="outlined"
                                                            sx={{ mb: 1 }}
                                                        >
                                                            <CardContent>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                    {feedback.agrees_with_analysis ? (
                                                                        <ThumbUpIcon color="success" sx={{ mr: 1 }} />
                                                                    ) : (
                                                                        <ThumbDownIcon color="error" sx={{ mr: 1 }} />
                                                                    )}
                                                                    <Typography variant="subtitle2">
                                                                        {feedback.user.username}
                                                                    </Typography>
                                                                </Box>
                                                                {feedback.comment && (
                                                                    <Typography variant="body2">
                                                                        {feedback.comment}
                                                                    </Typography>
                                                                )}
                                                                <Typography variant="caption" color="textSecondary">
                                                                    Posted on: {new Date(feedback.created_at).toLocaleString()}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <Typography color="textSecondary">
                                                        No feedback yet
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Collapse>
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
        </Container>
    );
}; 