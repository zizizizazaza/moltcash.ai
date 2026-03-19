import { useEffect } from 'react';
import { App } from '@capacitor/app';

export const AppUrlListener = () => {
  useEffect(() => {
    App.addListener('appUrlOpen', (event) => {
      try {
        const deepLinkUrl = new URL(event.url);
        // Extract search params from deep link
        if (
          deepLinkUrl.search &&
          deepLinkUrl.searchParams.has('privy_oauth_code') &&
          deepLinkUrl.searchParams.has('privy_oauth_state') &&
          deepLinkUrl.searchParams.has('privy_oauth_provider')
        ) {
          const currentUrl = new URL(window.location.href);
          currentUrl.search = deepLinkUrl.search;
          const targetUrl = currentUrl.toString();

          // Try in-place URL update first (preserves Privy SDK state)
          // This avoids a full reload which kills OAuth session on release builds
          window.history.replaceState({}, '', targetUrl);
          window.dispatchEvent(new PopStateEvent('popstate'));

          // Fallback: if SDK doesn't pick it up, do a soft reload after a short delay
          // to give the SDK time to initialize before processing the params
          setTimeout(() => {
            // Only reload if still not authenticated (SDK didn't handle it in-place)
            if (window.location.search.includes('privy_oauth_code')) {
              window.location.replace(targetUrl);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Failed to parse deep link URL:', error);
      }
    });
  }, []);

  return null;
};
