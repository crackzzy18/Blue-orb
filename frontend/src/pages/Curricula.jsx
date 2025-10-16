import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from '../components/LoadingSpinner';

const Curricula = () => {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const { get } = useApi();
  const { t } = useTranslation();

  useEffect(() => {
    loadCurricula();
  }, []);

  const loadCurricula = async () => {
    try {
      setLoading(true);
      const data = await get('/curricula');
      setCurricula(data);
    } catch (error) {
      console.error('Failed to load curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIPFSUrl = (cid) => {
    return cid ? `https://dweb.link/ipfs/${cid}` : null;
  };

  if (loading) {
    return <LoadingSpinner message={t('curricula.loading')} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('curricula.title')}
        </h1>
        <p className="text-xl text-gray-600">
          {t('curricula.description')}
        </p>
      </div>

      {curricula.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">{t('curricula.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {curricula.map((item) => (
            <div
              key={item.id}
              className="card cursor-pointer hover:scale-105"
              onClick={() => setSelectedItem(item)}
            >
              {item.thumbnailCID && (
                <img
                  src={getIPFSUrl(item.thumbnailCID)}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {item.description}
              </p>
              {item.subject && (
                <span className="inline-block bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {item.subject}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.thumbnailCID && (
              <img
                src={getIPFSUrl(selectedItem.thumbnailCID)}
                alt={selectedItem.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedItem.title}
            </h2>
            {selectedItem.subject && (
              <p className="text-primary font-medium mb-4">
                {t('form.subject')}: {selectedItem.subject}
              </p>
            )}
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">
              {selectedItem.description}
            </p>
            {selectedItem.fileCID && (
              <a
                href={getIPFSUrl(selectedItem.fileCID)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                {t('materials.view')}
              </a>
            )}
            <button
              onClick={() => setSelectedItem(null)}
              className="btn-secondary ml-4"
            >
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curricula;
