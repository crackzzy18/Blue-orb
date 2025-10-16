import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from '../components/LoadingSpinner';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const { t } = useTranslation();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await get('/materials');
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIPFSUrl = (cid) => {
    return cid ? `https://dweb.link/ipfs/${cid}` : null;
  };

  if (loading) {
    return <LoadingSpinner message={t('materials.loading')} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('materials.title')}
        </h1>
        <p className="text-xl text-gray-600">
          {t('materials.description')}
        </p>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">{t('materials.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div key={material.id} className="card">
              {material.thumbnailCID && (
                <img
                  src={getIPFSUrl(material.thumbnailCID)}
                  alt={material.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {material.title}
              </h3>

              {material.author && (
                <p className="text-gray-500 text-sm mb-2">
                  {t('materials.author')}: {material.author}
                </p>
              )}

              <p className="text-gray-600 mb-4 line-clamp-3">
                {material.description}
              </p>

              <div className="flex items-center justify-between">
                {material.category && (
                  <span className="bg-accent-warm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {material.category}
                  </span>
                )}

                {material.fileCID && (
                  <a
                    href={getIPFSUrl(material.fileCID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-blue-600 font-medium transition-colors"
                  >
                    {t('materials.view')} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Materials;
