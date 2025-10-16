import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useTranslation } from '../../utils/i18n';
import LoadingSpinner from '../LoadingSpinner';

const AdminStats = () => {
  const [stats, setStats] = useState({ curricula: 0, exams: 0, materials: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const { t } = useTranslation();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [curricula, exams, materials, questions] = await Promise.all([
        get('/curricula'),
        get('/exams'),
        get('/materials'),
        get('/community/questions')
      ]);

      setStats({
        curricula: curricula.length,
        exams: exams.length,
        materials: materials.length,
        questions: questions.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('admin.stats')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-3xl font-bold text-gray-900">{stats.curricula}</div>
          <div className="text-gray-600 font-medium">{t('nav.curricula')}</div>
        </div>

        <div className="card bg-gradient-to-br from-accent to-green-100">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-3xl font-bold text-gray-900">{stats.exams}</div>
          <div className="text-gray-600 font-medium">{t('nav.exams')}</div>
        </div>

        <div className="card bg-gradient-to-br from-accent-warm to-orange-100">
          <div className="text-4xl mb-2">📖</div>
          <div className="text-3xl font-bold text-gray-900">{stats.materials}</div>
          <div className="text-gray-600 font-medium">{t('nav.materials')}</div>
        </div>

        <div className="card bg-gradient-to-br from-accent-coral to-red-100">
          <div className="text-4xl mb-2">💬</div>
          <div className="text-3xl font-bold text-gray-900">{stats.questions}</div>
          <div className="text-gray-600 font-medium">{t('nav.community')}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
