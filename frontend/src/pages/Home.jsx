import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/curricula')}
            className="btn-primary"
          >
            {t('hero.explore')}
          </button>
          <button
            onClick={() => navigate('/exams')}
            className="btn-secondary"
          >
            {t('hero.exams')}
          </button>
          <button
            onClick={() => navigate('/materials')}
            className="btn-secondary"
          >
            {t('hero.materials')}
          </button>
          <button
            onClick={() => navigate('/community')}
            className="btn-secondary"
          >
            {t('hero.community')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
        <div className="card text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('nav.curricula')}</h3>
          <p className="text-gray-600">{t('curricula.description')}</p>
        </div>

        <div className="card text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('nav.exams')}</h3>
          <p className="text-gray-600">{t('exams.description')}</p>
        </div>

        <div className="card text-center">
          <div className="text-5xl mb-4">🌍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('nav.materials')}</h3>
          <p className="text-gray-600">{t('materials.description')}</p>
        </div>
      </div>

      <div className="mt-20 text-center">
        <div className="card bg-gradient-to-r from-blue-50 to-accent/20 p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('nav.community')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('community.description')}
          </p>
          <button
            onClick={() => navigate('/community')}
            className="btn-primary"
          >
            {t('hero.community')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
