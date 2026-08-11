/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

const namespace = process.env.K8S_NAMESPACE ?? 'default';
const frontendServiceName = process.env.K8S_FRONTEND_SERVICE_NAME ?? 'frontend-svc';
const backendServiceName = process.env.K8S_BACKEND_SERVICE_NAME ?? 'backend-svc';
const backendServicePort = process.env.K8S_BACKEND_SERVICE_PORT ?? '8080';
const mongoServiceName = process.env.MONGODB_SERVICE_NAME ?? 'mongo-svc';
const mongoServicePort = process.env.MONGODB_SERVICE_PORT ?? '27017';
const frontendClusterBaseURL = `http://${frontendServiceName}.${namespace}.svc.cluster.local`;
const backendClusterBaseURL = `http://${backendServiceName}.${namespace}.svc.cluster.local:${backendServicePort}`;
const isInCluster = Boolean(process.env.KUBERNETES_SERVICE_HOST);
const baseURL =
  process.env.UI_BASE_URL ??
  (isInCluster ? frontendClusterBaseURL : 'http://127.0.0.1:8080');
export const apiBaseURL: string =
  process.env.API_BASE_URL ?? (isInCluster ? backendClusterBaseURL : 'http://127.0.0.1:8080');

const localWebServers = !isInCluster
  ? [
      !process.env.UI_BASE_URL
        ? {
            command: `kubectl port-forward -n ${namespace} svc/${frontendServiceName} 8080:80`,
            url: 'http://127.0.0.1:8080',
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
          }
        : undefined,
      !process.env.MONGODB_URI
        ? {
            command: `kubectl port-forward -n ${namespace} svc/${mongoServiceName} ${mongoServicePort}:${mongoServicePort}`,
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
          }
        : undefined,
    ].filter((server): server is NonNullable<typeof server> => Boolean(server))
  : undefined;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Start local port-forwards only when running outside Kubernetes and endpoints are not explicitly provided. */
  webServer: localWebServers,
});
