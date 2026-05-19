'use client';

import { useState } from 'react';
import { toggleLike, toggleSave } from '@/lib/auth';
import AuthModal from './AuthModal';

interface LikeSaveBarProps {
  slug:      string;
  liked:     boolean;
  saved:     boolean;
  likes:     number;
  loggedIn:  boolean;
}

export default function LikeSaveBar({
  slug, liked: initLiked, saved: initSaved, likes: initLikes, loggedIn
}: LikeSaveBarProps) {
  const [liked,   setLiked]   = useState(initLiked);
  const [saved,   setSaved]   = useState(initSaved);
  const [likes,   setLikes]   = useState(initLikes);
  const [loading, setLoading] = useState<'like'|'save'|null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMsg,  setAuthMsg]  = useState('');

  async function handleLike() {
    if (!loggedIn) {
      setAuthMsg('로그인하면 좋아요를 누르고 인기 순위에 반영할 수 있어요.');
      setShowAuth(true); return;
    }
    setLoading('like');
    try {
      const res = await toggleLike(slug);
      setLiked(res.liked);
      setLikes(res.likes);
    } finally { setLoading(null); }
  }

  async function handleSave() {
    if (!loggedIn) {
      setAuthMsg('로그인하면 좋아하는 시트를 저장해 나중에 다시 볼 수 있어요.');
      setShowAuth(true); return;
    }
    setLoading('save');
    try {
      const res = await toggleSave(slug);
      setSaved(res.saved);
    } finally { setLoading(null); }
  }

  return (
    <>
      <div className="like-save-bar">
        <button
          className={`btn-like ${liked ? 'active' : ''}`}
          onClick={handleLike}
          disabled={loading === 'like'}
          aria-label={liked ? 'Unlike' : 'Like'}
          aria-pressed={liked}
        >
          <span className="like-icon">{liked ? '❤️' : '🤍'}</span>
          <span className="like-count">{likes > 0 ? likes : ''}</span>
        </button>

        <button
          className={`btn-save ${saved ? 'active' : ''}`}
          onClick={handleSave}
          disabled={loading === 'save'}
          aria-label={saved ? 'Unsave' : 'Save'}
          aria-pressed={saved}
        >
          <span>{saved ? '🔖 Saved' : '🔖 Save'}</span>
        </button>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          message={authMsg}
        />
      )}
    </>
  );
}
