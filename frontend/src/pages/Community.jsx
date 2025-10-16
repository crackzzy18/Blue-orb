import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateKeypair, saveKeysSecurely, loadProfile, loadSecret, clearKeys, maskNsec, SUBJECT_OPTIONS, GRADE_OPTIONS, updateProfile, getUnreadSince, setUnreadSince, derivePublicKey } from '../utils/nostr';

const POLL_INTERVAL_MS = 8000;

const Community = () => {
  const [questions, setQuestions] = useState([]);
  const [repliesByParent, setRepliesByParent] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [roleTab, setRoleTab] = useState('student');
  const [authMode, setAuthMode] = useState('');
  const [loginSecret, setLoginSecret] = useState('');
  const [profile, setProfile] = useState(loadProfile());
  const [askForm, setAskForm] = useState({ content: '', subject: '', grade: '' });
  const [replyDrafts, setReplyDrafts] = useState({});
  const [hasUnread, setHasUnread] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileSetup, setProfileSetup] = useState({ username: '', bio: '' });
  const [settingsDraft, setSettingsDraft] = useState({ username: profile?.username || '', bio: profile?.bio || '' });
  const lastSeenTsRef = useRef(getUnreadSince());
  const { get, post } = useApi();
  const { t } = useTranslation();

  // Only load feed when both filters are set or both are empty
  const shouldLoadFeed = () => {
    return (subjectFilter && gradeFilter) || (!subjectFilter && !gradeFilter);
  };

  useEffect(() => {
    if (shouldLoadFeed()) {
      loadFeed();
    }
  }, [subjectFilter, gradeFilter]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (!shouldLoadFeed()) return;
      try {
        const params = new URLSearchParams();
        if (subjectFilter) params.set('subject', subjectFilter);
        if (gradeFilter) params.set('grade', gradeFilter);
        const q = await get(`/community/questions${params.toString() ? `?${params.toString()}` : ''}`);
        // Sort by most recent first
        const sorted = (q || []).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        setQuestions(sorted);
        const repliesEntries = await Promise.all(
          (sorted || []).map(async (ev) => {
            const res = await get(`/community/replies?parentId=${ev.id}`);
            return [ev.id, res];
          })
        );
        const map = Object.fromEntries(repliesEntries);
        setRepliesByParent(map);
        const latest = sorted.reduce((max, ev) => Math.max(max, (ev.created_at||0)), 0);
        if (latest && latest > (lastSeenTsRef.current || 0)) {
          setHasUnread(true);
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [subjectFilter, gradeFilter]);

  const markAllRead = () => {
    const latest = (questions || []).reduce((max, ev) => Math.max(max, (ev.created_at||0)), 0);
    lastSeenTsRef.current = latest || Math.floor(Date.now()/1000);
    setUnreadSince(lastSeenTsRef.current);
    setHasUnread(false);
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subjectFilter) params.set('subject', subjectFilter);
      if (gradeFilter) params.set('grade', gradeFilter);
      const q = await get(`/community/questions${params.toString() ? `?${params.toString()}` : ''}`);
      // Sort by most recent first
      const sorted = (q || []).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      setQuestions(sorted);
      const repliesEntries = await Promise.all(
        (sorted || []).map(async (ev) => {
          const res = await get(`/community/replies?parentId=${ev.id}`);
          return [ev.id, res];
        })
      );
      const map = Object.fromEntries(repliesEntries);
      setRepliesByParent(map);
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const { nsec, npub } = await generateKeypair();
      const role = roleTab === 'teacher' ? 'teacher' : 'student';
      saveKeysSecurely({ nsec, npub, role, username: '', bio: '' });
      const next = loadProfile();
      setProfile(next);
      setProfileSetup({ username: '', bio: '' });
      setShowProfileSetup(true);
      setAuthMode('');
    } catch (error) {
      console.error('Failed to generate keys:', error);
      alert('Failed to generate keys. Please try again.');
    }
  };

  const handleProfileSetup = () => {
    if (!profileSetup.username.trim()) {
      alert('Please enter a username');
      return;
    }
    const updated = updateProfile({ username: profileSetup.username, bio: profileSetup.bio });
    setProfile(updated);
    setSettingsDraft({ username: updated.username, bio: updated.bio });
    setShowProfileSetup(false);
  };

  const handleLogin = async () => {
    if (!loginSecret || loginSecret.length < 10) return;
    try {
      const npub = await derivePublicKey(loginSecret);
      if (!npub) {
        alert('Invalid private key. Please check and try again.');
        return;
      }
      sessionStorage.setItem('nostr_nsec', loginSecret);
      const existingProfile = loadProfile();
      if (existingProfile) {
        // Update existing profile with derived npub
        const updated = updateProfile({ npub });
        setProfile(updated);
      } else {
        // Create new profile with derived npub
        sessionStorage.setItem('nostr_profile', JSON.stringify({ npub, role: roleTab, username: '', bio: '' }));
        const next = loadProfile();
        setProfile(next);
      }
      setSettingsDraft({ username: profile?.username || '', bio: profile?.bio || '' });
      setAuthMode('');
      setLoginSecret('');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to login. Please check your private key.');
    }
  };

  const handleLogout = () => {
    clearKeys();
    setProfile(null);
    setShowSettings(false);
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!askForm.content.trim()) {
      alert('Please enter your question.');
      return;
    }
    if (!askForm.subject || !askForm.grade) {
      alert('Please select both subject and grade.');
      return;
    }
    const nsec = loadSecret();
    if (!nsec) { 
      setAuthMode('login'); 
      return; 
    }
    try {
      setSubmitting(true);
      await post('/community/questions', { 
        nsec, 
        content: askForm.content, 
        subject: askForm.subject, 
        grade: askForm.grade 
      });
      setAskForm({ content: '', subject: '', grade: '' });
      await loadFeed();
      alert('Question submitted successfully!');
    } catch (error) {
      console.error('Failed to submit question:', error);
      alert('Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId) => {
    const content = replyDrafts[parentId];
    if (!content.trim()) {
      alert('Please enter your reply.');
      return;
    }
    const nsec = loadSecret();
    if (!nsec) { 
      setAuthMode('login'); 
      return; 
    }
    try {
      setSubmitting(true);
      await post('/community/replies', { nsec, content, parentId });
      setReplyDrafts({ ...replyDrafts, [parentId]: '' });
      await loadFeed();
      alert('Reply submitted successfully!');
    } catch (e) { 
      console.error('Failed to post reply:', e);
      alert('Failed to submit reply. Please try again.');
    }
    finally { 
      setSubmitting(false); 
    }
  };

  const saveSettings = () => {
    const next = updateProfile({ username: settingsDraft.username || '', bio: settingsDraft.bio || '' });
    setProfile(next);
    setShowSettings(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Show profile setup screen after account creation
  if (showProfileSetup) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Complete Your Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Username *</label>
                <input 
                  value={profileSetup.username} 
                  onChange={e=>setProfileSetup({...profileSetup, username:e.target.value})} 
                  className="input-field" 
                  placeholder="Enter your username" 
                  required 
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Bio</label>
                <textarea 
                  value={profileSetup.bio} 
                  onChange={e=>setProfileSetup({...profileSetup, bio:e.target.value})} 
                  className="input-field min-h-[80px]" 
                  placeholder="Tell us about yourself" 
                />
              </div>
              <button onClick={handleProfileSetup} className="btn-primary w-full">
                Complete Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('community.title')}</h1>
          <p className="text-xl text-gray-600">{t('community.description')}</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Join the Community
            </h2>
            
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button onClick={()=>setRoleTab('student')} className={`px-6 py-3 rounded-lg font-medium transition-colors ${roleTab==='student'?'bg-primary text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Student
              </button>
              <button onClick={()=>setRoleTab('teacher')} className={`px-6 py-3 rounded-lg font-medium transition-colors ${roleTab==='teacher'?'bg-primary text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Teacher
              </button>
            </div>

            {authMode === 'create' ? (
              <div className="space-y-4">
                <p className="text-gray-700 text-center">
                  Generate a new Nostr keypair for your {roleTab} profile. Keep your private key safe.
                </p>
                <button onClick={handleCreateAccount} className="btn-primary w-full">
                  Generate Keys & Create Account
                </button>
                <button onClick={()=>setAuthMode('')} className="btn-secondary w-full">
                  Back
                </button>
              </div>
            ) : authMode === 'login' ? (
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={loginSecret} 
                  onChange={(e)=>setLoginSecret(e.target.value)} 
                  className="input-field" 
                  placeholder="Paste your nsec (private key)" 
                />
                <button onClick={handleLogin} className="btn-primary w-full">Log in</button>
                <button onClick={()=>setAuthMode('')} className="btn-secondary w-full">Back</button>
              </div>
            ) : (
              <div className="space-y-4">
                <button onClick={()=>setAuthMode('create')} className="btn-primary w-full">
                  Create Account
                </button>
                <button onClick={()=>setAuthMode('login')} className="btn-secondary w-full">
                  Log in with existing key
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message={t('community.loading')} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{t('community.title')}</h1>
          <p className="text-xl text-gray-600">{t('community.description')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button onClick={()=>setShowSettings(true)} className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <button onClick={markAllRead} className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
            </button>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 inline-block w-3 h-3 bg-red-500 rounded-full" />
            )}
          </div>
          <span className="text-sm text-gray-600 hidden md:inline">{profile.role?.toUpperCase()} · {profile.npub ? profile.npub.slice(0,10)+'…' : 'npub not set'}</span>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Settings</h3>
              <button onClick={()=>setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Username</label>
                <input value={settingsDraft.username} onChange={e=>setSettingsDraft({...settingsDraft, username:e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Bio</label>
                <textarea value={settingsDraft.bio} onChange={e=>setSettingsDraft({...settingsDraft, bio:e.target.value})} className="input-field min-h-[80px]" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Public Key (npub)</label>
                <div className="flex items-center space-x-2">
                  <input value={profile.npub || 'n/a'} readOnly className="input-field flex-1" />
                  <button onClick={()=>copyToClipboard(profile.npub || '')} className="btn-secondary">Copy</button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Private Key (nsec) - Keep Secret!</label>
                <div className="flex items-center space-x-2">
                  <input value={maskNsec(loadSecret()) || 'n/a'} readOnly className="input-field flex-1" />
                  <button onClick={()=>copyToClipboard(loadSecret() || '')} className="btn-secondary">Copy</button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={saveSettings} className="btn-primary flex-1">Save</button>
                <button onClick={()=>setShowSettings(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
              <div className="pt-4 border-t">
                <button onClick={()=>setAuthMode('login')} className="btn-secondary w-full mb-2">Switch Account</button>
                <button onClick={handleLogout} className="btn-secondary w-full">Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)} className="input-field">
            <option value="">All subjects</option>
            {SUBJECT_OPTIONS.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)} className="input-field">
            <option value="">All grades</option>
            {GRADE_OPTIONS.map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {!shouldLoadFeed() && (
          <div className="mt-2 text-sm text-gray-600">
            Please select both subject and grade filters to load content.
          </div>
        )}
      </div>

      {profile.role === 'student' && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ask a Question</h2>
          <form onSubmit={handleAsk}>
            <div className="mb-4">
              <textarea value={askForm.content} onChange={e=>setAskForm({...askForm, content:e.target.value})} className="input-field min-h-[120px] resize-y" placeholder="Your question" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select value={askForm.subject} onChange={e=>setAskForm({...askForm, subject:e.target.value})} className="input-field" required>
                <option value="">Select Subject *</option>
                {SUBJECT_OPTIONS.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={askForm.grade} onChange={e=>setAskForm({...askForm, grade:e.target.value})} className="input-field" required>
                <option value="">Select Grade *</option>
                {GRADE_OPTIONS.map(g=> <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Question'}</button>
          </form>
        </div>
      )}

      {profile.role === 'teacher' && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Teacher Dashboard</h2>
          <p className="text-gray-600 mb-4">Filter questions by subject and grade to help students with their questions.</p>
        </div>
      )}

      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {!shouldLoadFeed() ? 'Please select both subject and grade filters to load content.' : 'No questions yet'}
            </p>
          </div>
        ) : (
          questions.map((question) => {
            const replies = repliesByParent[question.id] || [];
            return (
              <div key={question.id} className="card">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">Question</h3>
                      <span className="text-sm text-gray-500">{new Date((question.created_at||Date.now())*1000).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.content}</p>

                    {replies.length > 0 && (
                      <div className="pl-4 border-l-2 border-accent space-y-3">
                        {replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">Reply</span>
                              <span className="text-xs text-gray-500">{new Date((reply.created_at||Date.now())*1000).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {profile.role === 'teacher' && (
                      <div className="mt-4">
                        <textarea value={replyDrafts[question.id]||''} onChange={e=>setReplyDrafts({...replyDrafts, [question.id]: e.target.value})} className="input-field min-h-[80px]" placeholder="Write a reply" />
                        <div className="mt-2">
                          <button onClick={()=>handleReply(question.id)} disabled={submitting} className="btn-secondary disabled:opacity-50">{submitting?'Submitting...':'Reply'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Community;