'use client';

import { useState } from 'react';
import { signInWithEmail } from '@/lib/auth';

interface AuthModalProps {
  onClose: () => void;
  message?: string; // optional prompt e.g. "로그인하면 좋아요를 저장할 수 있어요"
}

export default function AuthModal({ onClose, message }: AuthModalProps) {
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState<'idle'|'loading'|'sent'|'error'>('idle');
  const [errMsg, setErrMsg]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    const err = await signInWithEmail(email.trim());
    if (err) { setErrMsg(err); setStatus('error'); }
    else      { setStatus('sent'); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} role="dialog" aria-modal>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-icon">✉️</div>
        <h2 className="modal-title">Sign in to LittleSeed</h2>
        <p className="modal-sub">
          {message ?? 'No password needed — we\'ll email you a magic link.'}
        </p>

        {status === 'sent' ? (
          <div className="modal-sent">
            <div className="sent-icon">📬</div>
            <p><strong>Check your inbox!</strong></p>
            <p>We sent a link to <strong>{email}</strong>.<br/>Click it to sign in — the link expires in 1 hour.</p>
            <button className="btn-modal-secondary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <label htmlFor="auth-email" className="modal-label">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="modal-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            {status === 'error' && (
              <p className="modal-error">{errMsg || 'Something went wrong. Please try again.'}</p>
            )}
            <button
              type="submit"
              className="btn-modal-primary"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending…' : 'Send magic link'}
            </button>
            <p className="modal-note">
              Free to use without an account. Sign in only to save sheets &amp; likes.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
