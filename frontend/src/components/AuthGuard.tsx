// components/AuthGuard.tsx
"use client"

import { useAuth } from '../app/contexts/AuthInfo';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = false, 
  fallback = null,
  redirectTo = '/auth'
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          setShowFallback(true);
        }
      } else {
        setShowFallback(false);
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    return null; // Will redirect or show fallback
  }

  return <>{children}</>;
}