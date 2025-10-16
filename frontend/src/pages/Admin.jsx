import { useState, useEffect } from 'react';
import { useTranslation } from '../utils/i18n';
import { validateAuth, createAuthHeader, getStoredAuth, setStoredAuth, clearStoredAuth } from '../utils/auth';
import AdminCurricula from '../components/admin/AdminCurricula';
import AdminExams from '../components/admin/AdminExams';
import AdminMaterials from '../components/admin/AdminMaterials';
import AdminStats from '../components/admin/AdminStats';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('curricula');
  const { t } = useTranslation();

  useEffect(() => {
    const storedAuth = getStoredAuth();
    if (storedAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (validateAuth(username, password)) {
      const authHeader = createAuthHeader(username, password);
      setStoredAuth(authHeader);
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {t('admin.login')}
            </h1>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  {t('admin.username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  {t('admin.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                {t('admin.loginButton')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {t('admin.title')}
        </h1>
        <button onClick={handleLogout} className="btn-secondary">
          {t('admin.logout')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="card space-y-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t('admin.stats')}
            </button>
            <button
              onClick={() => setActiveTab('curricula')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'curricula'
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t('admin.curricula')}
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'exams'
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t('admin.exams')}
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'materials'
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t('admin.materials')}
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'curricula' && <AdminCurricula />}
          {activeTab === 'exams' && <AdminExams />}
          {activeTab === 'materials' && <AdminMaterials />}
        </div>
      </div>
    </div>
  );
};

export default Admin;
