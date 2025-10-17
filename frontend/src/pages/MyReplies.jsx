import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { loadProfile } from '../utils/nostr';

const MyReplies = () => {
  const { get } = useApi();
  const [items, setItems] = useState([]);
  const profile = loadProfile();

  useEffect(() => {
    (async () => {
      if (!profile?.npub) return;
      const q = await get(`/community/replies-by-author?author=${profile.npub}`);
      setItems(q || []);
    })();
  }, [profile?.npub]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Replies</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">You haven't posted any replies yet.</p>
      ) : (
        <div className="space-y-6">
          {items.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Reply</h3>
                <span className="text-sm text-gray-500">{new Date((r.created_at||Date.now())*1000).toLocaleString()}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReplies;


