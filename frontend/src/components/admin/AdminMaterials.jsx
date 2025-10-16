import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useTranslation } from '../../utils/i18n';
import { getStoredAuth } from '../../utils/auth';
import LoadingSpinner from '../LoadingSpinner';

const AdminMaterials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    category: '',
    thumbnailCID: '',
    fileCID: ''
  });
  const { get, post, put, del } = useApi();
  const { t } = useTranslation();
  const authHeader = getStoredAuth();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await get('/admin/materials', authHeader);
      setItems(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await put(`/admin/materials/${editing}`, formData, authHeader);
      } else {
        await post('/admin/materials', formData, authHeader);
      }

      setFormData({ title: '', description: '', author: '', category: '', thumbnailCID: '', fileCID: '' });
      setEditing(null);
      await loadItems();
    } catch (error) {
      console.error('Failed to save material:', error);
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      author: item.author || '',
      category: item.category || '',
      thumbnailCID: item.thumbnailCID || '',
      fileCID: item.fileCID || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirm'))) return;

    try {
      await del(`/admin/materials/${id}`, authHeader);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({ title: '', description: '', author: '', category: '', thumbnailCID: '', fileCID: '' });
  };

  const getIPFSUrl = (cid) => {
    return cid ? `https://dweb.link/ipfs/${cid}` : null;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('admin.materials')}
      </h2>

      <div className="card mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {editing ? t('admin.edit') : t('admin.add')}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {t('form.title')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {t('form.author')}
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              {t('form.description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px] resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {t('form.category')}
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                placeholder="Science, Math, etc."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {t('form.thumbnailCID')}
              </label>
              <input
                type="text"
                value={formData.thumbnailCID}
                onChange={(e) => setFormData({ ...formData, thumbnailCID: e.target.value })}
                className="input-field"
                placeholder="QmXxx..."
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              {t('form.fileCID')}
            </label>
            <input
              type="text"
              value={formData.fileCID}
              onChange={(e) => setFormData({ ...formData, fileCID: e.target.value })}
              className="input-field"
              placeholder="QmXxx..."
            />
          </div>

          <div className="flex space-x-4">
            <button type="submit" className="btn-primary">
              {t('admin.save')}
            </button>
            {editing && (
              <button type="button" onClick={handleCancel} className="btn-secondary">
                {t('admin.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="card">
            <div className="flex items-start space-x-4">
              {item.thumbnailCID && (
                <img
                  src={getIPFSUrl(item.thumbnailCID)}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                {item.author && (
                  <p className="text-gray-500 text-sm mb-2">
                    {t('materials.author')}: {item.author}
                  </p>
                )}
                {item.category && (
                  <span className="inline-block bg-accent-warm text-gray-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                    {item.category}
                  </span>
                )}
                <p className="text-gray-600 mb-4">{item.description}</p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-primary hover:text-blue-600 font-medium"
                  >
                    {t('admin.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    {t('admin.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMaterials;
