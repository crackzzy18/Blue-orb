import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from '../components/LoadingSpinner';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const { t } = useTranslation();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await get('/exams');
      setExams(data);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIPFSUrl = (cid) => {
    return cid ? `https://dweb.link/ipfs/${cid}` : null;
  };

  if (loading) {
    return <LoadingSpinner message={t('exams.loading')} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('exams.title')}
        </h1>
        <p className="text-xl text-gray-600">
          {t('exams.description')}
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">{t('exams.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {exam.title}
                </h3>
                {exam.year && (
                  <span className="bg-accent text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {exam.year}
                  </span>
                )}
              </div>

              {exam.subject && (
                <p className="text-primary font-medium mb-2">
                  {exam.subject}
                </p>
              )}

              <p className="text-gray-600 mb-4">
                {exam.description}
              </p>

              {exam.fileCID && (
                <a
                  href={getIPFSUrl(exam.fileCID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <span>📥</span>
                  <span>{t('exams.download')}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
