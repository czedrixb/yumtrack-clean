// hooks/use-auth.ts
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email, 'Verified:', user?.emailVerified);
      
      if (user) {
        try {
          // For new users or when we suspect verification status might be stale
          const shouldReload = !user.emailVerified || 
                              user.metadata.creationTime === user.metadata.lastSignInTime;
          
          if (shouldReload) {
            await user.reload();
            const updatedUser = auth.currentUser;
            console.log('After reload - Verified:', updatedUser?.emailVerified);
            setEmailVerified(updatedUser?.emailVerified || false);
            setUser(updatedUser);
          } else {
            setEmailVerified(user.emailVerified || false);
            setUser(user);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setEmailVerified(user.emailVerified || false);
          setUser(user);
        }
      } else {
        setEmailVerified(false);
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshAuthState = async () => {
    if (user) {
      try {
        await user.reload();
        const updatedUser = auth.currentUser;
        setEmailVerified(updatedUser?.emailVerified || false);
        setUser(updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('Error refreshing auth state:', error);
      }
    }
    return user;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: emailVerified,
    refreshAuthState
  };
}