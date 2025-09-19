// src/app/contexts/AuthInfo.tsx
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  requireAuth: (action: string) => boolean;
  showAuthPrompt: (action: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('🔐 Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [mounted]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear any stored credentials
      if (typeof window !== 'undefined') {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const requireAuth = (action: string) => {
    // Actions that require authentication
    const authRequiredActions = [
      'create_sublease',
      'create_sale',
      'edit_listing',
      'contact_seller',
      'save_favorite',
      'write_review'
    ];
    
    return authRequiredActions.includes(action);
  };

  const showAuthPrompt = (action: string) => {
    // You can customize this to show different messages based on action
    const actionMessages: Record<string, string> = {
      'create_sublease': 'Please sign in to list your sublease',
      'create_sale': 'Please sign in to create a moving sale',
      'contact_seller': 'Please sign in to contact the seller',
      'save_favorite': 'Please sign in to save favorites',
      'write_review': 'Please sign in to write a review'
    };
    
    const message = actionMessages[action] || 'Please sign in to continue';
    alert(message); // You can replace this with a proper modal
  };

  const value = {
    user,
    loading,
    signOut,
    requireAuth,
    showAuthPrompt
  };

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  // Return a more robust fallback with actual auth state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔐 Fallback auth state:', user ? `${user.email}` : 'No user');
        setUser(user);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);
  
  if (context === undefined) {
    console.warn('⚠️ useAuth must be used within an AuthProvider. Creating fallback auth context.');


    return {
      user,
      loading,
      signOut: async () => {
        try {
          if (auth) {
            await firebaseSignOut(auth);
          }
        } catch (error) {
          console.error('Fallback sign out error:', error);
        }
      },
      requireAuth: (action: string) => {
        const authRequiredActions = [
          'create_sublease',
          'create_sale',
          'edit_listing',
          'contact_seller',
          'save_favorite',
          'write_review'
        ];
        return authRequiredActions.includes(action);
      },
      showAuthPrompt: (action: string) => {
        const actionMessages: Record<string, string> = {
          'create_sublease': 'Please sign in to list your sublease',
          'create_sale': 'Please sign in to create a moving sale',
          'contact_seller': 'Please sign in to contact the seller',
          'save_favorite': 'Please sign in to save favorites',
          'write_review': 'Please sign in to write a review'
        };
        const message = actionMessages[action] || 'Please sign in to continue';
        alert(message);
      }
    };
  }
  
  return context;
}