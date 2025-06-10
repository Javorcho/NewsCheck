import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface VerificationHistory {
  id: number;
  url: string;
  isFake: boolean;
  confidence: number;
  reasons: string[];
  timestamp: string;
}

const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'fake' | 'real'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/verify/history');
      setHistory(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load verification history');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return filter === 'fake' ? item.isFake : !item.isFake;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return sortOrder === 'asc'
        ? a.confidence - b.confidence
        : b.confidence - a.confidence;
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verification History</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and analyze your past news verifications
        </p>
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'fake' | 'real')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Results</option>
            <option value="fake">Fake News</option>
            <option value="real">Real News</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'confidence')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>

        <button
          onClick={toggleSortOrder}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </button>
      </div>

      {/* Results */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {sortedHistory.map((item) => (
            <li key={item.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-600 truncate">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.url}
                    </a>
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.isFake
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.isFake ? 'Likely Fake' : 'Likely Real'}
                    </span>
                    <span className="ml-4">
                      Confidence: {item.confidence}%
                    </span>
                    <span className="ml-4">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {item.reasons.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Reasons:</p>
                      <ul className="mt-1 list-disc list-inside text-sm text-gray-500">
                        {item.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {sortedHistory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No verification history found</p>
        </div>
      )}
    </div>
  );
};

export default History; 