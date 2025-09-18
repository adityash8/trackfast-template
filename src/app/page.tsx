'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { analytics } from '@/lib/analytics';

export default function Home() {
  const [trackingStatus, setTrackingStatus] = useState<string>('Not tested');

  useEffect(() => {
    // Track pageview on mount
    analytics.pageView('/').then(() => {
      setTrackingStatus('Pageview tracked ✅');
    }).catch(() => {
      setTrackingStatus('Pageview failed ❌');
    });
  }, []);

  const testTracking = async () => {
    try {
      setTrackingStatus('Testing...');

      // Test a feature usage event
      await analytics.featureUsed('test-button', 'homepage');

      setTrackingStatus('Test event tracked ✅');
    } catch (error) {
      setTrackingStatus('Test event failed ❌');
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Trackfa.st
          </div>
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Schema-Safe Analytics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Trust your numbers from day one. Analytics setup in under 5 minutes.
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg w-full max-w-md">
          <h3 className="font-semibold mb-2">Analytics Status</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Current: {trackingStatus}
          </p>
          <button
            onClick={testTracking}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Test Analytics
          </button>
        </div>

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Clone the template and configure your API keys in{' '}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              .env.local
            </code>
          </li>
          <li className="mb-2 tracking-[-.01em]">
            Run{' '}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              npm run doctor
            </code>
            {' '}to verify your setup
          </li>
          <li className="tracking-[-.01em]">
            Start tracking events with schema validation built-in
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            onClick={() => analytics.signUp('demo@trackfast.dev', 'starter', 'homepage')}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Test Signup Event
          </button>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/api/track"
            target="_blank"
            rel="noopener noreferrer"
          >
            API Health Check
          </a>
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/trackfast/template"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/trackfast/template"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          GitHub
        </a>
        <span className="text-sm text-gray-500">
          Built with Trackfa.st v0.1.0
        </span>
      </footer>
    </div>
  );
}