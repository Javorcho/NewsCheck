import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface VerificationResult {
  url: string;
  isFake: boolean;
  confidence: number;
  reasons: string[];
  timestamp: string;
}

const NewsVerification: React.FC = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/verify', { url });
      setResult(response.data);
    } catch (err) {
      setError('Failed to verify news article. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">News Verification</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter news article URL"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Verification Result</h2>
            <span className={`px-4 py-2 rounded-full ${
              result.isFake ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {result.isFake ? 'Likely Fake' : 'Likely Real'}
            </span>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">URL: {result.url}</p>
            <p className="text-gray-600">Confidence: {result.confidence}%</p>
            <p className="text-gray-600">Verified on: {new Date(result.timestamp).toLocaleString()}</p>
          </div>

          {result.reasons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Analysis Details:</h3>
              <ul className="list-disc list-inside space-y-2">
                {result.reasons.map((reason, index) => (
                  <li key={index} className="text-gray-700">{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsVerification; 