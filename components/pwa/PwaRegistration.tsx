'use client';

import { useEffect } from 'react';

export function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    let active = true;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        if (active) {
          await registration.update();
        }
      } catch (error) {
        console.error('TeachAlike service worker registration failed.', error);
      }
    };

    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', register, { once: true });
    }

    return () => {
      active = false;
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
