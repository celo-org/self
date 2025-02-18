import { useToastController } from '@tamagui/toast';
import { create } from 'zustand';

import { createSegmentClient } from '../Segment';

interface NavigationState {
  toast: ReturnType<typeof useToastController>;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
}

const segmentClient = createSegmentClient();

const useNavigationStore = create<NavigationState>(() => ({
  toast: null as unknown as ReturnType<typeof useToastController>,

  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (!segmentClient) {
      return segmentClient?.track(eventName);
    }

    for (const key of Object.keys(properties)) {
      if (typeof properties[key] === 'function') {
        delete properties[key];
      }
    }

    segmentClient.track(eventName, properties);
  },
}));

export default useNavigationStore;
