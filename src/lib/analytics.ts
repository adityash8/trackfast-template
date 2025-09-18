import posthog from 'posthog-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize PostHog on client-side only
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') console.log('PostHog loaded');
    },
  });
}

// Analytics interface for server-side and client-side tracking
export interface TrackingEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

// Core tracking function with fallback to server-side proxy
export const track = async (event: string, properties?: Record<string, any>) => {
  const payload: TrackingEvent = {
    event,
    properties: {
      ...properties,
      $lib_version: '0.1.0',
      timestamp: new Date().toISOString(),
    },
  };

  // Client-side tracking via PostHog
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(event, payload.properties);
    return { success: true, method: 'client' };
  }

  // Server-side fallback via API route (bypasses ad-blockers)
  try {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Tracking failed: ${response.statusText}`);
    }

    return { success: true, method: 'server' };
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    return { success: false, error: error.message };
  }
};

// Convenient pageview helper
export const pageview = (path?: string) => {
  const url = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return track('pageview', { path: url, referrer: document?.referrer });
};

// User identification
export const identify = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, traits);
  }
  return track('user_identified', { userId, ...traits });
};

// Reset user (for logout)
export const reset = () => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
  return track('user_reset');
};

// Type-safe event helpers using generated schemas
export const analytics = {
  // Authentication events
  signUp: async (email: string, plan: 'free' | 'starter' | 'growth', source?: string) => {
    const { trackEvent } = await import('./event-schemas');
    return trackEvent('user_signed_up', { email, plan, source });
  },

  signIn: async (email: string, method: 'password' | 'google' | 'github') => {
    const { trackEvent } = await import('./event-schemas');
    return trackEvent('user_signed_in', { email, method });
  },

  // Product events
  pageView: async (path: string, referrer?: string) => {
    const { trackEvent } = await import('./event-schemas');
    return trackEvent('pageview', { path, referrer });
  },

  featureUsed: async (feature: string, location?: string) => {
    const { trackEvent } = await import('./event-schemas');
    return trackEvent('feature_used', { feature, location });
  },

  // Business events
  subscriptionCreated: async (plan: 'starter' | 'growth' | 'agency', amount: number, currency = 'USD') => {
    const { trackEvent } = await import('./event-schemas');
    return trackEvent('subscription_created', { plan, amount, currency });
  },

  paymentCompleted: async (amount: number, currency = 'USD', plan?: string) => {
    const { trackEvent } = await import('./event-schemas');
    return trackEvent('payment_completed', { amount, currency, plan });
  },

  // Legacy functions for backward compatibility
  track,
  pageview,
  identify,
  reset,
};

// Development helpers
export const debugAnalytics = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('PostHog initialized:', !!posthog);
    console.log('Environment keys:', {
      posthog: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      ga4: !!process.env.NEXT_PUBLIC_GA4_ID,
    });
  }
};

export default analytics;