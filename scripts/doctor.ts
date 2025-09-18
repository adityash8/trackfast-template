#!/usr/bin/env tsx
import puppeteer from 'puppeteer';
import chalk from 'chalk';
import Table from 'cli-table3';

interface DoctorResult {
  test: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

interface TestEvent {
  name: string;
  properties: Record<string, any>;
  description: string;
}

class TrackfastDoctor {
  private results: DoctorResult[] = [];
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warn: chalk.yellow,
    };
    console.log(colors[type](message));
  }

  private addResult(test: string, status: 'pass' | 'fail' | 'warn', message: string, details?: any) {
    this.results.push({ test, status, message, details });
  }

  async checkEnvironment(): Promise<void> {
    this.log('\n🔍 Checking environment configuration...', 'info');

    // Check for required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_POSTHOG_KEY',
    ];

    const optionalEnvVars = [
      'NEXT_PUBLIC_GA4_ID',
      'GA4_API_SECRET',
      'NEXT_PUBLIC_POSTHOG_HOST',
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult(
          `Environment: ${envVar}`,
          'pass',
          `✅ ${envVar} is configured`
        );
      } else {
        this.addResult(
          `Environment: ${envVar}`,
          'fail',
          `❌ ${envVar} is missing - PostHog tracking will not work`
        );
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.addResult(
          `Environment: ${envVar}`,
          'pass',
          `✅ ${envVar} is configured`
        );
      } else {
        this.addResult(
          `Environment: ${envVar}`,
          'warn',
          `⚠️  ${envVar} is not configured - this provider will be skipped`
        );
      }
    }
  }

  async checkAPIHealth(): Promise<boolean> {
    this.log('\n🏥 Checking API health...', 'info');

    try {
      const response = await fetch(`${this.baseUrl}/api/track`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'API Health',
          'pass',
          `✅ API is responding (${data.status})`,
          data
        );
        return true;
      } else {
        this.addResult(
          'API Health',
          'fail',
          `❌ API returned ${response.status}: ${response.statusText}`
        );
        return false;
      }
    } catch (error) {
      this.addResult(
        'API Health',
        'fail',
        `❌ Failed to connect to API: ${error.message}`
      );
      return false;
    }
  }

  async checkSchemaValidation(): Promise<boolean> {
    this.log('\n📋 Testing schema validation...', 'info');

    const testCases = [
      {
        name: 'Valid event',
        payload: {
          event: 'user_signed_up',
          properties: {
            email: 'test@example.com',
            plan: 'starter',
            source: 'test'
          }
        },
        shouldPass: true
      },
      {
        name: 'Invalid event name',
        payload: {
          event: 'unknown_event',
          properties: {}
        },
        shouldPass: false
      },
      {
        name: 'Missing required field',
        payload: {
          event: 'user_signed_up',
          properties: {
            plan: 'starter'
            // missing email
          }
        },
        shouldPass: false
      },
      {
        name: 'Invalid enum value',
        payload: {
          event: 'user_signed_up',
          properties: {
            email: 'test@example.com',
            plan: 'invalid_plan'
          }
        },
        shouldPass: false
      }
    ];

    let validationPassed = true;

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${this.baseUrl}/api/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.payload),
        });

        const isSuccess = response.ok;
        const data = await response.json();

        if (isSuccess === testCase.shouldPass) {
          this.addResult(
            `Schema: ${testCase.name}`,
            'pass',
            `✅ ${testCase.name} behaved as expected`,
            { status: response.status, response: data }
          );
        } else {
          this.addResult(
            `Schema: ${testCase.name}`,
            'fail',
            `❌ ${testCase.name} failed - expected ${testCase.shouldPass ? 'success' : 'failure'}, got ${isSuccess ? 'success' : 'failure'}`,
            { status: response.status, response: data }
          );
          validationPassed = false;
        }
      } catch (error) {
        this.addResult(
          `Schema: ${testCase.name}`,
          'fail',
          `❌ ${testCase.name} threw error: ${error.message}`
        );
        validationPassed = false;
      }
    }

    return validationPassed;
  }

  async checkBrowserTracking(): Promise<boolean> {
    this.log('\n🌐 Testing browser tracking...', 'info');

    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Set up network monitoring
      const requests: any[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/track') || request.url().includes('posthog.com')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData(),
          });
        }
      });

      // Navigate to the app
      try {
        await page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });
        this.addResult(
          'Browser: Page Load',
          'pass',
          '✅ Successfully loaded the application'
        );
      } catch (error) {
        this.addResult(
          'Browser: Page Load',
          'fail',
          `❌ Failed to load application: ${error.message}`
        );
        return false;
      }

      // Test client-side tracking
      await page.evaluate(() => {
        // Simulate importing and using analytics
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'pageview',
            properties: {
              path: '/test',
              referrer: 'doctor-test'
            }
          })
        });
      });

      // Wait for requests to complete
      await page.waitForTimeout(2000);

      if (requests.length > 0) {
        this.addResult(
          'Browser: Tracking Requests',
          'pass',
          `✅ Captured ${requests.length} tracking request(s)`,
          requests
        );
        return true;
      } else {
        this.addResult(
          'Browser: Tracking Requests',
          'warn',
          '⚠️  No tracking requests detected - this may be normal in development'
        );
        return true;
      }

    } catch (error) {
      this.addResult(
        'Browser: General',
        'fail',
        `❌ Browser testing failed: ${error.message}`
      );
      return false;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async testEventFlow(): Promise<boolean> {
    this.log('\n🎯 Testing complete event flow...', 'info');

    const testEvents: TestEvent[] = [
      {
        name: 'pageview',
        properties: { path: '/doctor-test', referrer: 'cli-doctor' },
        description: 'Basic pageview tracking'
      },
      {
        name: 'user_signed_up',
        properties: { email: 'doctor@trackfast.dev', plan: 'starter', source: 'cli-test' },
        description: 'User registration event'
      },
      {
        name: 'feature_used',
        properties: { feature: 'doctor-test', location: 'cli' },
        description: 'Feature usage tracking'
      }
    ];

    let flowPassed = true;

    for (const testEvent of testEvents) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}/api/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: testEvent.name,
            properties: testEvent.properties
          }),
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        if (response.ok) {
          const data = await response.json();
          this.addResult(
            `Event: ${testEvent.name}`,
            'pass',
            `✅ ${testEvent.description} (${duration}ms)`,
            { duration, response: data }
          );
        } else {
          this.addResult(
            `Event: ${testEvent.name}`,
            'fail',
            `❌ ${testEvent.description} failed with ${response.status}`
          );
          flowPassed = false;
        }
      } catch (error) {
        this.addResult(
          `Event: ${testEvent.name}`,
          'fail',
          `❌ ${testEvent.description} threw error: ${error.message}`
        );
        flowPassed = false;
      }
    }

    return flowPassed;
  }

  printResults(): void {
    this.log('\n📊 Doctor Results Summary', 'info');

    const table = new Table({
      head: ['Test', 'Status', 'Message'],
      colWidths: [30, 10, 60],
      wordWrap: true,
    });

    const statusColors = {
      pass: chalk.green,
      fail: chalk.red,
      warn: chalk.yellow,
    };

    for (const result of this.results) {
      table.push([
        result.test,
        statusColors[result.status](result.status.toUpperCase()),
        result.message
      ]);
    }

    console.log(table.toString());

    // Summary
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warned = this.results.filter(r => r.status === 'warn').length;

    this.log(`\n📈 Summary: ${chalk.green(passed)} passed, ${chalk.red(failed)} failed, ${chalk.yellow(warned)} warnings`, 'info');

    if (failed === 0) {
      this.log('\n🎉 All critical tests passed! Your analytics setup is working correctly.', 'success');
    } else {
      this.log('\n❌ Some tests failed. Please check your configuration and try again.', 'error');
    }
  }

  async run(): Promise<boolean> {
    this.log('🔬 Trackfast Doctor - Analytics Health Check', 'info');
    this.log('='.repeat(50), 'info');

    try {
      await this.checkEnvironment();

      const apiHealthy = await this.checkAPIHealth();
      if (!apiHealthy) {
        this.log('\n❌ API is not responding. Make sure your development server is running.', 'error');
        this.printResults();
        return false;
      }

      await this.checkSchemaValidation();
      await this.checkBrowserTracking();
      await this.testEventFlow();

      this.printResults();

      const criticalFailures = this.results.filter(r => r.status === 'fail').length;
      return criticalFailures === 0;

    } catch (error) {
      this.log(`\n💥 Doctor run failed: ${error.message}`, 'error');
      return false;
    }
  }
}

// CLI execution
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';

  const doctor = new TrackfastDoctor(baseUrl);
  const success = await doctor.run();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Doctor failed:', error);
    process.exit(1);
  });
}