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
          window.location.assign(currentUrl.toString());
        }
      } catch (error) {
        console.error('Failed to parse deep link URL:', error);
      }
    });
  }, []);

  return null;
};
