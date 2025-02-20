import { createSegmentClient } from '../Segment';

const segmentClient = createSegmentClient();

function cleanParams(params: Record<string, any>) {
  const newParams = {};
  for (const key of Object.keys(params)) {
    if (typeof params[key] !== 'function') {
      (newParams as Record<string, any>)[key] = params[key];
    }
  }
  return newParams;
}

/*
  Recoreds analytics events and screen views
 */
const analytics = () => {
  function _track(
    type: 'event' | 'screen',
    eventName: string,
    properties?: Record<string, any>,
  ) {
    if (!segmentClient) {
      return;
    }
    const trackMethod = (e: string, p?: Record<string, any>) =>
      type === 'screen'
        ? segmentClient.screen(e, p)
        : segmentClient.track(e, p);

    if (!properties) {
      // you may need to remove the catch when debugging
      return trackMethod(eventName).catch(console.error);
    }

    if (properties.params) {
      const newParams = cleanParams(properties.params);
      properties.params = newParams;
    }
    // you may need to remove the catch when debugging
    trackMethod(eventName, properties).catch(console.error);
  }

  return {
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      _track('event', eventName, properties);
    },
    trackScreenView: (screenName: string, properties?: Record<string, any>) => {
      _track('screen', screenName, properties);
    },
  };
};

export default analytics;
