import { createSegmentClient } from '../Segment';

const segmentClient = createSegmentClient();

const analytics = () => ({
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    // log what we are tracking in development
    // this can help us to identitfy if we are tracking the right events or to many properties
    __DEV__ && console.log('Analytics event:', eventName, properties);
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
});

export default analytics;
