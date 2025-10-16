import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from '../components/LoadingSpinner';

const Community = () => {
  const [questions, setQuestions] = useState([]);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ content: '', name: '' });
  const [submitting, setSubmitting] = useState(false);
  const { get, post } = useApi();
  const { t } = useTranslation();

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [questionsData, repliesData] = await Promise.all([
        get('/community/questions'),
        get('/community/replies')
      ]);
      setQuestions(questionsData);
      setReplies(repliesData);
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content || !formData.name) return;

    try {
      setSubmitting(true);
      await post('/community/questions', formData);
      setFormData({ content: '', name: '' });
      await loadCommunityData();
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRepliesForQuestion = (questionId) => {
    return replies.filter(reply => reply.questionId === questionId);
  };

  if (loading) {
    return <LoadingSpinner message={t('community.loading')} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('community.title')}
        </h1>
        <p className="text-xl text-gray-600">
          {t('community.description')}
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('community.askQuestion')}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={t('community.yourQuestion')}
                className="input-field min-h-[120px] resize-y"
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('community.yourName')}
                className="input-field"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t('community.submit')}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('community.title')}
        </h2>

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">{t('community.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => {
              const questionReplies = getRepliesForQuestion(question.id);
              return (
                <div key={question.id} className="card">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {question.author?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">
                          {question.author || 'Anonymous'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                        {question.content}
                      </p>
                      {questionReplies.length > 0 && (
                        <div className="pl-4 border-l-2 border-accent space-y-3">
                          {questionReplies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {reply.author || 'Anonymous'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 text-sm text-gray-500">
                        {questionReplies.length} {t('community.replies')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
