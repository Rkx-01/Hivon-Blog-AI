'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NavigationReset() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // FAANG Pattern: Defensive 'Fresh Start' logic
    const handleNavigationCheck = () => {
      if (typeof window === 'undefined') return;

      const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isReload = (navEntries.length > 0 && navEntries[0].type === 'reload') || 
                       (window.performance.navigation && window.performance.navigation.type === 1);

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      console.log('Hivon Fresh Start Check:', { currentPath, isReload });

      if (isReload) {
        // Requirement: "after refreshing ... take to landing page ... and no back button"
        if (currentPath !== '/' || currentSearch !== '') {
          console.log('Hivon: Reload detected at deep path. Redirecting to root for Fresh Start.');
          window.location.href = '/'; 
        } else {
          // Already on /, ensure we replace history to prevent back-stepping
          console.log('Hivon: Reload detected at root. Stabilizing history.');
          window.history.replaceState(null, '', '/');
        }
      }
    };

    // Execute immediately and then again after a short delay to be safe
    handleNavigationCheck();
    const timer = setTimeout(handleNavigationCheck, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}
