import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { queryClient } from '@/lib/queryClient';

export function useAuthSync() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User signed in, invalidate all queries to refresh data
        queryClient.invalidateQueries();
      } else {
        // User signed out, remove all queries
        queryClient.removeQueries();
      }
    });

    return unsubscribe;
  }, []);
}