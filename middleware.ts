import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only intercept /api/track requests for validation
  if (request.nextUrl.pathname === '/api/track') {
    return validateTrackingRequest(request);
  }

  return NextResponse.next();
}

async function validateTrackingRequest(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.text();
    let payload;

    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON payload',
          details: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    // Validate basic structure
    if (!payload.event || typeof payload.event !== 'string') {
      return NextResponse.json(
        {
          error: 'Missing or invalid event name',
          details: 'Event must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // Import schemas dynamically to avoid circular dependencies
    const { eventSchemas, validateEvent } = await import('./src/lib/event-schemas');

    // Check if event exists in schema
    if (!(payload.event in eventSchemas)) {
      return NextResponse.json(
        {
          error: `Unknown event: ${payload.event}`,
          details: `Available events: ${Object.keys(eventSchemas).join(', ')}`,
          availableEvents: Object.keys(eventSchemas)
        },
        { status: 400 }
      );
    }

    // Validate event properties against schema
    try {
      validateEvent(payload.event, payload.properties || {});
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: 'Event validation failed',
          details: validationError.message,
          event: payload.event,
          properties: payload.properties
        },
        { status: 400 }
      );
    }

    // Add validation metadata to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-trackfast-validated', 'true');
    requestHeaders.set('x-trackfast-event', payload.event);
    requestHeaders.set('x-trackfast-timestamp', new Date().toISOString());

    // Create new request with validation headers and original body
    const validatedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: body,
    });

    // Continue to the API route with validated request
    return NextResponse.next({
      request: validatedRequest,
    });

  } catch (error) {
    console.error('Middleware validation error:', error);

    return NextResponse.json(
      {
        error: 'Internal validation error',
        details: 'Event validation system error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add rate limiting and other security measures
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

export const config = {
  matcher: [
    '/api/track',
    // Add other protected routes here
  ],
};