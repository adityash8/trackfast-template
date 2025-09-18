# 🚀 Trackfa.st - Schema-Safe Analytics Boilerplate

> Trust your numbers from day one. Analytics setup in under 5 minutes.

Trackfa.st is a deployable Next.js boilerplate that automates analytics setup for indie developers and small teams. It provides schema-driven event validation, multi-provider tracking, and real-time health monitoring—eliminating broken tracking and ensuring data quality from the first event.

## ✨ What You Get

- **🔒 Schema-Safe Events** - YAML schema → TypeScript types + Zod validation
- **🛡️ Edge Validation** - Reject invalid events at runtime with detailed errors
- **📊 Multi-Provider Support** - PostHog, GA4, Plausible with one API
- **🩺 CLI Doctor** - Automated health checks and smoke tests
- **⚡ Zero Setup** - Clone, configure keys, deploy to Vercel
- **🔄 Type-Safe Helpers** - Auto-generated tracking functions

## 🎯 Quick Start

### 1. Clone and Install

```bash
# Use this template or clone
git clone https://github.com/trackfast/template my-analytics
cd my-analytics
npm install
```

### 2. Configure Environment

Copy `.env.local` and add your API keys:

```bash
# Required - Get from PostHog project settings
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional - Google Analytics 4
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_measurement_protocol_secret

# Optional - Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

### 3. Generate Schemas and Test

```bash
# Generate TypeScript types from schema
npm run gen:schema

# Start development server
npm run dev

# Test your setup (in another terminal)
npm run doctor
```

### 4. Start Tracking

```typescript
import { analytics } from '@/lib/analytics';

// Type-safe event tracking
await analytics.signUp('user@example.com', 'starter', 'homepage');
await analytics.pageView('/dashboard');
await analytics.featureUsed('export-data', 'settings-page');

// Business events with validation
await analytics.subscriptionCreated('growth', 2900, 'USD');
await analytics.paymentCompleted(2900, 'USD', 'growth');
```

## 📋 Schema Configuration

Edit `insight.yml` to define your events:

```yaml
events:
  user_signed_up:
    description: "User completed registration"
    properties:
      email:
        type: string
        required: true
        description: "User email address"
      plan:
        type: enum
        enum: ["free", "starter", "growth"]
        required: true
      source:
        type: string
        required: false
    guards:
      - email_valid: "email must be valid format"

  payment_completed:
    description: "Payment successfully processed"
    properties:
      amount:
        type: number
        required: true
        description: "Amount in cents"
      currency:
        type: string
        required: true
        default: "USD"
    guards:
      - amount_positive: "amount must be greater than 0"
```

Run `npm run gen:schema` to regenerate TypeScript types and validation.

## 🩺 Health Monitoring

The CLI doctor performs comprehensive health checks:

```bash
npm run doctor

# Test against production
npm run doctor https://yourdomain.com
```

**What it checks:**
- ✅ Environment configuration
- ✅ API endpoint health
- ✅ Schema validation (valid/invalid payloads)
- ✅ Browser tracking simulation
- ✅ End-to-end event flow

## 🏗️ Architecture

### Request Flow

```
Client Event → Middleware Validation → API Route → Multi-Provider Tracking
     ↓              ↓                     ↓              ↓
Schema Types → Zod Validation → Enhanced Payload → PostHog/GA4/Plausible
```

### Key Components

- **`/middleware.ts`** - Edge validation using generated schemas
- **`/src/lib/analytics.ts`** - Type-safe tracking SDK
- **`/src/lib/event-schemas.ts`** - Generated from `insight.yml`
- **`/src/app/api/track/route.ts`** - Multi-provider tracking endpoint
- **`/scripts/doctor.ts`** - Health check and testing tool

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

```bash
# Vercel CLI
vercel env add NEXT_PUBLIC_POSTHOG_KEY
vercel env add NEXT_PUBLIC_GA4_ID
vercel deploy --prod
```

### Manual Environment Setup

Required variables:
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL

Optional variables:
- `NEXT_PUBLIC_GA4_ID` - Google Analytics 4 Measurement ID
- `GA4_API_SECRET` - GA4 Measurement Protocol API secret
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Your domain for Plausible

## 📊 Analytics Providers

### PostHog (Primary)

- **Setup**: Create project at [posthog.com](https://posthog.com)
- **Features**: Events, user tracking, session replay, feature flags
- **Privacy**: EU hosting available, GDPR compliant

### Google Analytics 4 (Optional)

- **Setup**: Create GA4 property, enable Measurement Protocol
- **Features**: Web analytics, conversion tracking, attribution
- **Privacy**: Google's standard data practices

### Plausible (Optional)

- **Setup**: Add domain at [plausible.io](https://plausible.io)
- **Features**: Privacy-first analytics, no cookies
- **Privacy**: EU-hosted, fully GDPR compliant

## 🔧 Customization

### Adding Custom Events

1. Edit `insight.yml`:
```yaml
events:
  custom_action:
    description: "User performed custom action"
    properties:
      action_type:
        type: enum
        enum: ["click", "scroll", "hover"]
        required: true
```

2. Regenerate schemas:
```bash
npm run gen:schema
```

3. Use in code:
```typescript
import { trackEvent } from '@/lib/event-schemas';

await trackEvent('custom_action', {
  action_type: 'click'
});
```

### Adding New Providers

Extend `/src/app/api/track/route.ts`:

```typescript
// Mixpanel example
if (process.env.MIXPANEL_TOKEN) {
  const mixpanelPromise = fetch('https://api.mixpanel.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      properties: {
        ...enhancedPayload.properties,
        token: process.env.MIXPANEL_TOKEN,
      },
    }),
  });

  trackingPromises.push(mixpanelPromise);
}
```

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run gen:schema` - Generate types from schema
- `npm run doctor` - Run health checks
- `npm run lint` - Run ESLint

### Project Structure

```
trackfast/
├── insight.yml              # Event schema definition
├── middleware.ts             # Edge validation
├── src/
│   ├── lib/
│   │   ├── analytics.ts      # Main tracking SDK
│   │   └── event-schemas.ts  # Generated schemas (don't edit)
│   └── app/
│       ├── api/track/        # Tracking API endpoint
│       └── page.tsx          # Demo page
└── scripts/
    ├── gen-schema.ts         # Schema code generator
    └── doctor.ts             # Health check tool
```

## 🐛 Troubleshooting

### Common Issues

**Events not appearing in PostHog:**
1. Check API key in environment variables
2. Verify network requests in browser dev tools
3. Run `npm run doctor` for diagnostics

**Schema validation errors:**
1. Check event name matches `insight.yml`
2. Verify all required properties are provided
3. Run `npm run gen:schema` after schema changes

**Middleware errors:**
1. Ensure `insight.yml` is valid YAML
2. Check middleware.ts imports are correct
3. Verify Zod validation rules

### Debug Mode

Set environment for detailed logging:

```bash
NODE_ENV=development npm run dev
```

## 📈 Roadmap

### v0.2 (Coming Soon)
- [ ] Auto-dashboard seeder (PostHog API)
- [ ] Nightly AI insights via n8n + Claude
- [ ] VS Code extension for schema editing
- [ ] Trust Score dashboard (0-100 health metric)
- [ ] Growth Audit CLI (scan public repos)

### v0.3 (Future)
- [ ] Replay queue for offline events
- [ ] Advanced event guards and validation
- [ ] Multi-workspace support
- [ ] Vercel Marketplace integration

## 📄 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 💬 Support

- [GitHub Issues](https://github.com/trackfast/template/issues)
- [Discord Community](https://discord.gg/trackfast)
- [Documentation](https://docs.trackfast.dev)

---

**Built with ❤️ for indie developers who want to trust their data**