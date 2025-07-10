"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, User, UserPlus } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string;
  title?: string;
  message?: string;
}

export default function AuthPromptModal({ 
  isOpen, 
  onClose, 
  action, 
  title,
  message 
}: AuthPromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const actionMessages: Record<string, { title: string; message: string }> = {
    'create_sublease': {
      title: 'Ready to List Your Sublease?',
      message: 'Join thousands of students finding their perfect sublet match.'
    },
    'create_sale': {
      title: 'Start Your Moving Sale',
      message: 'Turn your unused items into cash while helping other students.'
    },
    'contact_seller': {
      title: 'Interested in This Item?',
      message: 'Sign in to contact the seller and get more details.'
    },
    'save_favorite': {
      title: 'Save Your Favorites',
      message: 'Create an account to save listings and get notified of new matches.'
    }
  };

  const currentAction = actionMessages[action] || {
    title: title || 'Join Subox Today',
    message: message || 'Sign in to unlock all features and connect with the community.'
  };

  const handleSignIn = () => {
    router.push('/auth?mode=login');
    onClose();
  };

  const handleSignUp = () => {
    router.push('/auth?mode=signup');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none">
                <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
              </svg>
              <svg className="w-10 h-10 -ml-2" viewBox="0 0 40 40" fill="none">
                <path d="M5 10L20 5L35 10L30 35L15 40L5 35L5 10Z" fill="#E97451" />
                <circle cx="15" cy="15" r="3" fill="white" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {currentAction.title}
            </h3>
            
            <p className="text-gray-600 mb-8">
              {currentAction.message}
            </p>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02]"
              >
                <UserPlus size={20} className="mr-2" />
                Create Account
              </button>
              
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <User size={20} className="mr-2" />
                Sign In
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">✨ Why join Subox?</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div>🏠 List unlimited sublets</div>
                <div>💰 Create moving sales</div>
                <div>❤️ Save favorite listings</div>
                <div>📱 Get instant notifications</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}