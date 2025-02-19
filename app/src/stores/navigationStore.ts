import { create } from 'zustand';

import { createSegmentClient } from '../Segment';

interface NavigationState {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
}

const segmentClient = createSegmentClient();

const useNavigationStore = create<NavigationState>(() => ({

  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (!segmentClient) {
      return;
    }

    if (!properties) {
      return segmentClient.track(eventName);
    }

    if (properties.params) {
      const newParams = {};
      for (const key of Object.keys(properties.params)) {
        if (typeof properties.params[key] !== 'function') {
          (newParams as Record<string, any>)[key] = properties.params[key];
        }
      }
      properties.params = newParams;
    }

    segmentClient.track(eventName, properties);
  },
}));

export default useNavigationStore;
