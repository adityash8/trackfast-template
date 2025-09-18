import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { event, properties } = payload;

    // Check if request was validated by middleware
    const isValidated = request.headers.get('x-trackfast-validated') === 'true';
    const validatedEvent = request.headers.get('x-trackfast-event');
    const validationTimestamp = request.headers.get('x-trackfast-timestamp');

    // Log validation info for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Tracking request:', {
        event,
        validated: isValidated,
        validatedEvent,
        timestamp: validationTimestamp,
      });
    }

    // Basic fallback validation if middleware didn't catch it
    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Enhanced payload with metadata
    const enhancedPayload = {
      event,
      properties: {
        ...properties,
        $lib: 'trackfast-server',
        $lib_version: '0.1.0',
        $validated: isValidated,
        timestamp: new Date().toISOString(),
      },
    };

    // Track to multiple providers in parallel
    const trackingPromises = [];

    // PostHog tracking
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const posthogPromise = fetch('https://us.i.posthog.com/capture/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
          event,
          properties: enhancedPayload.properties,
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.error('PostHog tracking failed:', error);
        return { ok: false, provider: 'posthog', error };
      });

      trackingPromises.push(posthogPromise);
    }

    // GA4 tracking (if configured)
    if (process.env.NEXT_PUBLIC_GA4_ID && process.env.GA4_API_SECRET) {
      const ga4Promise = fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.NEXT_PUBLIC_GA4_ID}&api_secret=${process.env.GA4_API_SECRET}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: properties?.userId || 'anonymous',
            events: [
              {
                name: event.replace(/[^a-zA-Z0-9_]/g, '_'), // GA4 sanitization
                parameters: enhancedPayload.properties,
              },
            ],
          }),
        }
      ).catch(error => {
        console.error('GA4 tracking failed:', error);
        return { ok: false, provider: 'ga4', error };
      });

      trackingPromises.push(ga4Promise);
    }

    // Wait for all tracking attempts
    const results = await Promise.allSettled(trackingPromises);

    // Count successes and failures
    const successes = results.filter(
      result => result.status === 'fulfilled' && result.value.ok
    ).length;

    const failures = results.filter(
      result => result.status === 'rejected' || !result.value.ok
    );

    // Log failures in development
    if (process.env.NODE_ENV === 'development' && failures.length > 0) {
      console.warn('Some tracking providers failed:', failures);
    }

    // Store failure info for replay queue (if needed)
    if (failures.length > 0 && process.env.VERCEL_KV_URL) {
      try {
        // Queue failed events for retry (implement this later with Vercel KV)
        console.log('Queueing failed events for retry...');
      } catch (queueError) {
        console.error('Failed to queue event for retry:', queueError);
      }
    }

    // Return success response with tracking details
    return NextResponse.json({
      success: true,
      event,
      validated: isValidated,
      providers: {
        attempted: trackingPromises.length,
        successful: successes,
        failed: failures.length,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Tracking API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'trackfast-api',
    version: '0.1.0',
    providers: {
      posthog: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      ga4: !!(process.env.NEXT_PUBLIC_GA4_ID && process.env.GA4_API_SECRET),
    },
    timestamp: new Date().toISOString(),
  });
}