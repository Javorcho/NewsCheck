import React, { useState } from 'react';
import api from '../../services/api';

interface FeedbackFormProps {
  verificationId: number;
  onFeedbackSubmitted: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ verificationId, onFeedbackSubmitted }) => {
  const [agreesWithAnalysis, setAgreesWithAnalysis] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agreesWithAnalysis === null) {
      setError('Please indicate whether you agree with the analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/verify/feedback', {
        verification_id: verificationId,
        agrees_with_analysis: agreesWithAnalysis,
        comment
      });
      onFeedbackSubmitted();
      setComment('');
      setAgreesWithAnalysis(null);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Provide Feedback</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Do you agree with this analysis?
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setAgreesWithAnalysis(true)}
              className={`px-4 py-2 rounded-md ${
                agreesWithAnalysis === true
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setAgreesWithAnalysis(false)}
              className={`px-4 py-2 rounded-md ${
                agreesWithAnalysis === false
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              No
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your thoughts about this verification..."
          />
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm; 