import { useEffect, useState } from 'react';
import { useAuthStore } from './authStore';

/** True once the persisted auth state has been read from AsyncStorage — used to
 *  hold the initial render until we know whether the user is logged in. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
