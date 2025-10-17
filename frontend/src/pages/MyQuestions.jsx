import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { loadProfile } from '../utils/nostr';

const MyQuestions = () => {
  const { get } = useApi();
  const [items, setItems] = useState([]);
  const profile = loadProfile();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams();
      if (profile?.npub) params.set('author', profile.npub);
      const q = await get(`/community/questions${params.toString() ? `?${params.toString()}` : ''}`);
      setItems(q || []);
    })();
  }, [profile?.npub]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Questions</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">You haven't asked any questions yet.</p>
      ) : (
        <div className="space-y-6">
          {items.map(q => (
            <div key={q.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Question</h3>
                <span className="text-sm text-gray-500">{new Date((q.created_at||Date.now())*1000).toLocaleString()}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{q.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuestions;


