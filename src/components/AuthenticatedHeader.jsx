import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LoginModal } from './LoginModal';
import { EventManagementModal } from './EventManagementModal';
import { authService } from '../lib/auth';

export const AuthenticatedHeader = ({ onUserChange }) => {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Check for existing user
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    onUserChange?.(currentUser);
  }, [onUserChange]);

  const handleLoginSuccess = userData => {
    setUser(userData);
    onUserChange?.(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    authService.signOut();
    setUser(null);
    onUserChange?.(null);
    setShowUserMenu(false);
  };

  const handleCreateEvent = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowEventModal(true);
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Create Event Button */}
            <Button variant="secondary" size="sm" onClick={handleCreateEvent} icon="✨">
              イベント作成
            </Button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-sm bg-white rounded-full p-2 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
                <span className="hidden md:block font-medium text-gray-700">
                  {user.name || user.email}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowEventModal(true);
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    ✨ イベント作成
                  </button>

                  <button
                    onClick={() => {
                      window.location.href = '/speaker-dashboard.html';
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    📊 ダッシュボード
                  </button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setShowLoginModal(true)} icon="🔑">
            ログイン
          </Button>
        )}
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <EventManagementModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />

      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
};
