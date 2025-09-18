# Changelog

All notable changes to Trackfa.st will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-18

### Added
- **Schema-driven event validation** - Define events in `insight.yml`, auto-generate TypeScript types and Zod schemas
- **Edge middleware validation** - Validate events at the edge with detailed error responses
- **Multi-provider tracking** - Support for PostHog, Google Analytics 4, and Plausible Analytics
- **Type-safe analytics SDK** - Auto-generated tracking functions with full type safety
- **CLI Doctor tool** - Comprehensive health checks for environment, API, schema validation, and browser tracking
- **Next.js 14 foundation** - Modern React setup with TypeScript, Tailwind CSS, and App Router
- **Server-side tracking** - Ad-blocker bypass via API routes
- **Development experience** - Hot reload, error handling, and debugging tools

### Core Features
- ✅ Schema validation at build time and runtime
- ✅ Type-safe event tracking with auto-completion
- ✅ Multi-provider analytics in one API call
- ✅ Comprehensive testing and health monitoring
- ✅ Production-ready deployment to Vercel
- ✅ Developer-friendly error messages and debugging

### Documentation
- Complete setup guide and API documentation
- Troubleshooting guide for common issues
- Architecture overview and customization examples
- GitHub issue templates and CI/CD workflows

### Supported Analytics Providers
- **PostHog** - Primary provider with full feature support
- **Google Analytics 4** - Web analytics and conversion tracking
- **Plausible Analytics** - Privacy-first analytics (EU compliance)

### Technical Architecture
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Edge Middleware
- **Validation**: Zod schemas, TypeScript types
- **Testing**: Puppeteer-based browser testing
- **Deployment**: Vercel-optimized with environment management

## [Unreleased]

### Planned for v0.2
- [ ] Auto-dashboard seeder (PostHog API integration)
- [ ] Nightly AI insights via n8n + Claude
- [ ] VS Code extension for schema editing
- [ ] Trust Score dashboard (0-100 health metric)
- [ ] Growth Audit CLI (scan public repos)
- [ ] Event replay queue for offline scenarios

### Planned for v0.3
- [ ] Advanced event guards and custom validation rules
- [ ] Multi-workspace support for agencies
- [ ] Vercel Marketplace integration
- [ ] Custom dashboard templates
- [ ] Real-time analytics streaming