'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import AuthModal from './AuthModal';
import type { UserProfile } from '@/lib/auth';

interface UserMenuProps {
  user: UserProfile | null;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [showModal,   setShowModal]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const router  = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.refresh();
    setShowDropdown(false);
    setSigningOut(false);
  }

  if (!user) {
    return (
      <>
        <button
          className="btn-signin"
          onClick={() => setShowModal(true)}
          aria-label="Sign in"
        >
          Sign in
        </button>
        {showModal && (
          <AuthModal onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  const initials = (user.display_name ?? user.email ?? '?')
    .slice(0, 2).toUpperCase();

  return (
    <div className="user-menu" ref={dropRef}>
      <button
        className="user-avatar"
        onClick={() => setShowDropdown(v => !v)}
        aria-label="Account menu"
      >
        {initials}
      </button>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="dropdown-name">
            {user.display_name ?? user.email}
          </div>
          <a href="/saved"       className="dropdown-item" onClick={() => setShowDropdown(false)}>🔖 Saved sheets</a>
          <a href="/account/conversions" className="dropdown-item" onClick={() => setShowDropdown(false)}>📋 Conversion history</a>
          <hr className="dropdown-sep" />
          <button
            className="dropdown-item dropdown-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
