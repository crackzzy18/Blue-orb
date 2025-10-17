import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';

const Navbar = () => {
  const { t, lang, toggleLang } = useTranslation();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">B</span>
            </div>
            <span className="text-2xl font-bold text-primary">Blue Orb</span>
          </Link>

          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/curricula"
              className={`font-medium transition-colors ${
                isActive('/curricula') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t('nav.curricula')}
            </Link>
            <Link
              to="/exams"
              className={`font-medium transition-colors ${
                isActive('/exams') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t('nav.exams')}
            </Link>
            <Link
              to="/materials"
              className={`font-medium transition-colors ${
                isActive('/materials') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t('nav.materials')}
            </Link>
            <Link
              to="/community"
              className={`font-medium transition-colors ${
                isActive('/community') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t('nav.community')}
            </Link>
            <Link
              to="/community/my-questions"
              className={`font-medium transition-colors ${
                isActive('/community/my-questions') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              My Questions
            </Link>
            <Link
              to="/community/my-replies"
              className={`font-medium transition-colors ${
                isActive('/community/my-replies') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              My Replies
            </Link>
            <Link
              to="/admin"
              className={`font-medium transition-colors ${
                isActive('/admin') ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t('nav.admin')}
            </Link>
          </div>

          <button
            onClick={toggleLang}
            className="px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <span className="text-lg">🌐</span>
            <span className="font-medium">{lang.toUpperCase()}</span>
          </button>
        </div>
      </div>
      <div className="md:hidden border-t">
        <div className="container mx-auto px-4 py-3 flex flex-wrap gap-4">
          <Link to="/" className={`text-sm ${isActive('/')?'text-primary':'text-gray-700'}`}>{t('nav.home')}</Link>
          <Link to="/curricula" className={`text-sm ${isActive('/curricula')?'text-primary':'text-gray-700'}`}>{t('nav.curricula')}</Link>
          <Link to="/exams" className={`text-sm ${isActive('/exams')?'text-primary':'text-gray-700'}`}>{t('nav.exams')}</Link>
          <Link to="/materials" className={`text-sm ${isActive('/materials')?'text-primary':'text-gray-700'}`}>{t('nav.materials')}</Link>
          <Link to="/community" className={`text-sm ${isActive('/community')?'text-primary':'text-gray-700'}`}>{t('nav.community')}</Link>
          <Link to="/community/my-questions" className={`text-sm ${isActive('/community/my-questions')?'text-primary':'text-gray-700'}`}>My Questions</Link>
          <Link to="/community/my-replies" className={`text-sm ${isActive('/community/my-replies')?'text-primary':'text-gray-700'}`}>My Replies</Link>
          <Link to="/admin" className={`text-sm ${isActive('/admin')?'text-primary':'text-gray-700'}`}>{t('nav.admin')}</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
