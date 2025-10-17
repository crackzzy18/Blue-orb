import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateKeypair, saveKeysSecurely, loadProfile, loadSecret, clearKeys, maskNsec, SUBJECT_OPTIONS, GRADE_OPTIONS, updateProfile, getUnreadSince, setUnreadSince, derivePublicKey, normalizePrivateKey, getStoredRoleForPubkey, setStoredRoleForPubkey } from '../utils/nostr';

const POLL_INTERVAL_MS = 8000;

const Community = () => {
  const [questions, setQuestions] = useState([]);
  const [repliesByParent, setRepliesByParent] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [viewTab, setViewTab] = useState('feed'); // 'feed' | 'mine' | 'replies'
  const [roleTab, setRoleTab] = useState('student');
  const [authMode, setAuthMode] = useState('');
  const [loginSecret, setLoginSecret] = useState('');
  const [profile, setProfile] = useState(loadProfile());
  const [askForm, setAskForm] = useState({ content: '', subject: '', grade: '', allow: 'both' });
  const [replyDrafts, setReplyDrafts] = useState({});
  const [hasUnread, setHasUnread] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileSetup, setProfileSetup] = useState({ username: '', bio: '' });
  const [settingsDraft, setSettingsDraft] = useState({ username: profile?.username || '', bio: profile?.bio || '' });
  const lastSeenTsRef = useRef(getUnreadSince());
  const { get, post } = useApi();
  const { t } = useTranslation();

  // Only load feed when both filters are set (teacher) or always for students
  const shouldLoadFeed = () => {
    if (profile?.role === 'student') return true;
    return (subjectFilter && gradeFilter) || (!subjectFilter && !gradeFilter);
  };

  useEffect(() => {
    if (shouldLoadFeed()) {
      loadFeed();
    }
  }, [subjectFilter, gradeFilter, viewTab, profile?.npub]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (!shouldLoadFeed()) return;
      try {
        const params = new URLSearchParams();
        if (viewTab === 'mine' && profile?.npub) params.set('author', profile.npub);
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
    // Notification feature disabled
    setHasUnread(false);
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (viewTab === 'mine' && profile?.npub) params.set('author', profile.npub);
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
      setStoredRoleForPubkey(npub, role);
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
      const normalized = await normalizePrivateKey(loginSecret);
      const npub = await derivePublicKey(normalized);
      if (!npub) {
        alert('Invalid private key. Please check and try again.');
        return;
      }
      // Enforce role binding for this pubkey
      const storedRole = getStoredRoleForPubkey(npub);
      const requestedRole = roleTab === 'teacher' ? 'teacher' : 'student';
      if (storedRole && storedRole !== requestedRole) {
        alert(`This key is registered as a ${storedRole}. Please select the ${storedRole} tab to log in.`);
        return;
      }
      sessionStorage.setItem('nostr_nsec', normalized);
      const existingProfile = loadProfile();
      if (existingProfile) {
        // Update existing profile with derived npub
        const updated = updateProfile({ npub, role: storedRole || requestedRole });
        setProfile(updated);
      } else {
        // Create new profile with derived npub
        sessionStorage.setItem('nostr_profile', JSON.stringify({ npub, role: (storedRole || requestedRole), username: '', bio: '' }));
        if (!storedRole) setStoredRoleForPubkey(npub, requestedRole);
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
    let nsec = loadSecret();
    if (!nsec) { 
      setAuthMode('login'); 
      return; 
    }
    nsec = await normalizePrivateKey(nsec);
    try {
      setSubmitting(true);
      await post('/community/questions', { 
        nsec, 
        content: askForm.content, 
        subject: askForm.subject, 
        grade: askForm.grade,
        role: profile.role || 'student',
        allow: askForm.allow
      });
      setAskForm({ content: '', subject: '', grade: '', allow: 'both' });
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
      // Check reply permission from parent question
      const parent = questions.find(q=>q.id===parentId);
      const permTag = (parent?.tags||[]).find(t=>t[0]==='perm');
      const allow = permTag ? permTag[1] : 'both';
      const userRole = profile.role || 'teacher';
      if (allow==='teachers' && userRole==='student') { alert('Only teachers can reply to this question.'); setSubmitting(false); return; }
      if (allow==='students' && userRole==='teacher') { alert('Only students can reply to this question.'); setSubmitting(false); return; }
      await post('/community/replies', { nsec, content, parentId, role: userRole });
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

  // Delete/Edit helpers
  const confirmDelete = async (eventId) => {
    if (!window.confirm('Delete this item? This action cannot be undone.')) return;
    try {
      const nsec = loadSecret();
      if (!nsec) { setAuthMode('login'); return; }
      await post('/community/delete', { nsec, eventId });
      await loadFeed();
      alert('Deleted. It may take a moment to disappear across relays.');
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete. Please try again.');
    }
  };

  const [editTarget, setEditTarget] = useState(null); // {id, content}
  const [editDraft, setEditDraft] = useState('');
  const startEdit = (event) => {
    setEditTarget({ id: event.id, isReply: (event.tags||[]).some(t=>t[0]==='e') });
    setEditDraft(event.content || '');
  };
  const cancelEdit = ()=>{ setEditTarget(null); setEditDraft(''); };
  const submitEdit = async () => {
    try {
      const nsec = loadSecret();
      if (!nsec) { setAuthMode('login'); return; }
      // Post a new event as an edit with tag edit-of
      const isReply = editTarget?.isReply;
      const baseTags = [['t','blueorb'], ['edit-of', editTarget.id]];
      if (isReply) baseTags.push(['e', editTarget.id]);
      await post('/community/replies', { nsec, content: editDraft, parentId: isReply ? editTarget.id : undefined, role: profile.role||'student', tags: baseTags });
      cancelEdit();
      await loadFeed();
      alert('Edited. Latest version now visible with an edited badge.');
    } catch (e) {
      console.error('Edit failed', e);
      alert('Failed to edit. Please try again.');
    }
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
            
            <div className="flex items-center justify-center space-x-3 mb-6">
              <button
                type="button"
                aria-pressed={roleTab==='student'}
                onClick={()=>setRoleTab('student')}
                className={`px-6 py-3 rounded-full font-medium transition-all focus:outline-none
                  ${roleTab==='student' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Student
              </button>
              <button
                type="button"
                aria-pressed={roleTab==='teacher'}
                onClick={()=>setRoleTab('teacher')}
                className={`px-6 py-3 rounded-full font-medium transition-all focus:outline-none
                  ${roleTab==='teacher' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
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
          {/* Notification button removed */}
          <span className="text-sm text-gray-600 hidden md:inline">{profile.role?.toUpperCase()} · {profile.npub ? profile.npub.slice(0,10)+'…' : 'npub not set'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={()=>setViewTab('feed')} className={`px-4 py-2 rounded ${viewTab==='feed'?'bg-blue-600 text-white':'bg-gray-100'}`}>Questions Feed</button>
        {profile.role==='student' && (
          <button onClick={()=>setViewTab('mine')} className={`px-4 py-2 rounded ${viewTab==='mine'?'bg-blue-600 text-white':'bg-gray-100'}`}>My Questions</button>
        )}
        {profile.role==='teacher' && (
          <button onClick={()=>setViewTab('replies')} className={`px-4 py-2 rounded ${viewTab==='replies'?'bg-blue-600 text-white':'bg-gray-100'}`}>My Replies</button>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                <div className="flex items-center space-x-2 overflow-x-auto">
                  <input value={profile.npub || 'n/a'} readOnly className="input-field flex-1 text-sm" />
                  <button onClick={()=>copyToClipboard(profile.npub || '')} className="btn-secondary">Copy</button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Private Key (nsec) - Keep Secret!</label>
                <div className="flex items-center space-x-2 overflow-x-auto">
                  <input value={maskNsec(loadSecret()) || 'n/a'} readOnly className="input-field flex-1 text-sm" />
                  <button onClick={()=>copyToClipboard(loadSecret() || '')} className="btn-secondary">Copy</button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={saveSettings} className="btn-primary flex-1">Save</button>
                <button onClick={()=>setShowSettings(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
              <div className="pt-4 border-t">
                <button onClick={handleLogout} className="btn-secondary w-full">Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(profile.role === 'teacher' || (profile.role==='student' && viewTab==='feed')) && (
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
      )}

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
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Who can reply?</label>
              <div className="grid grid-cols-3 gap-2">
                {['both','teachers','students'].map(opt => (
                  <button type="button" key={opt} onClick={()=>setAskForm({...askForm, allow: opt})} className={`px-3 py-2 rounded border ${askForm.allow===opt?'bg-blue-600 text-white':'bg-white'}`}>
                    {opt==='both' ? 'Teachers & Students' : opt.charAt(0).toUpperCase()+opt.slice(1)}
                  </button>
                ))}
              </div>
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

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit {editTarget.isReply ? 'Reply' : 'Question'}</h3>
            <textarea value={editDraft} onChange={e=>setEditDraft(e.target.value)} className="input-field min-h-[140px]" />
            <div className="mt-4 flex gap-2">
              <button className="btn-primary flex-1" onClick={submitEdit}>Save</button>
              <button className="btn-secondary flex-1" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
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
            const subj = (question.tags||[]).find(t=>t[0]==='t' && t[1]!== 'blueorb');
            const grade = (question.tags||[]).find(t=>t[0]==='g');
            const allow = (question.tags||[]).find(t=>t[0]==='perm');
            const edited = (question.tags||[]).some(t=>t[0]==='edit-of');
            return (
              <div key={question.id} className="card">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900">Question {edited ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">edited</span> : null}</h3>
                        {/* Author controls (Edit/Delete) only if current user authored */}
                        {profile.npub && (question.tags||[]).some(t=>t[0]==='p' && t[1]===profile.npub) && (
                          <div className="flex items-center gap-2">
                            <button onClick={()=>startEdit(question)} className="text-xs px-2 py-1 rounded border">Edit</button>
                            <button onClick={()=>confirmDelete(question.id)} className="text-xs px-2 py-1 rounded border border-red-300 text-red-600">Delete</button>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{new Date((question.created_at||Date.now())*1000).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {subj && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{subj[1]}</span>}
                      {grade && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{grade[1]}</span>}
                      {allow && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">Replies: {allow[1]}</span>}
                    </div>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.content}</p>

                    {replies.length > 0 && (
                      <div className="pl-4 border-l-2 border-accent space-y-3">
                        {replies.map((reply) => {
                          const roleTag = (reply.tags||[]).find(t=>t[0]==='role');
                          const roleLabel = roleTag ? (roleTag[1]||'') : '';
                          const isEdited = (reply.tags||[]).some(t=>t[0]==='edit-of');
                          return (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  Reply {roleLabel ? (<span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200">{roleLabel}</span>) : null}
                                  {isEdited ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">edited</span> : null}
                                </span>
                                <span className="text-xs text-gray-500">{new Date((reply.created_at||Date.now())*1000).toLocaleString()}</span>
                              </div>
                              <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                              {profile.npub && (reply.tags||[]).some(t=>t[0]==='p' && t[1]===profile.npub) && (
                                <div className="mt-2 flex items-center gap-2">
                                  <button onClick={()=>startEdit(reply)} className="text-xs px-2 py-1 rounded border">Edit</button>
                                  <button onClick={()=>confirmDelete(reply.id)} className="text-xs px-2 py-1 rounded border border-red-300 text-red-600">Delete</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(profile.role === 'teacher' || (profile.role==='student' && viewTab!=='mine')) && (
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