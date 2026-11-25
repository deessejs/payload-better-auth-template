import { expect, test, type Page } from '@playwright/test';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Local agent fixture variable ${name} is missing.`);
  return value;
}

const userEmail = requiredEnv('AGENT_TEST_USER_EMAIL');
const userPassword = requiredEnv('AGENT_TEST_USER_PASSWORD');
const signUpEmail = requiredEnv('AGENT_TEST_SIGNUP_EMAIL');
const signUpPassword = requiredEnv('AGENT_TEST_SIGNUP_PASSWORD');
const adminEmail = requiredEnv('AGENT_TEST_ADMIN_EMAIL');
const adminPassword = requiredEnv('AGENT_TEST_ADMIN_PASSWORD');

async function loginSaaSUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function loginPayloadAdmin(page: Page) {
  await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/admins/login') && response.request().method() === 'POST',
    { timeout: 60_000 },
  );
  await page.getByRole('button', { name: /log in|login/i }).click();
  const response = await loginResponse;
  expect(response.status()).toBe(200);
  await expect(page.getByLabel('Email')).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/admin\/login$/);
}

test('an anonymous dashboard request redirects to Better Auth login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Welcome back')).toBeVisible();
});

test('sign-up, login, protected writes, and record persistence work', async ({ page }) => {
  await page.goto('/sign-up');
  await page.getByLabel('Name').fill('Agent Signup');
  await page.getByLabel('Email').fill(signUpEmail);
  await page.getByLabel('Password').fill(signUpPassword);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await loginSaaSUser(page, signUpEmail, signUpPassword);

  const title = `agent-persist-${process.env.AGENT_TEST_RUN_ID}`;
  await page.getByLabel('New record title').fill(title);
  await page.getByRole('button', { name: 'Add example' }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test('Better Auth users cannot use Payload REST or Admin authentication', async ({ page }) => {
  await loginSaaSUser(page, userEmail, userPassword);
  const response = await page.request.get('/api/examples');
  expect([401, 403]).toContain(response.status());

  await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test('Payload admin authentication is independent of Better Auth', async ({ page }) => {
  await loginPayloadAdmin(page);
  const response = await page.request.get('/api/examples');
  expect(response.status()).toBe(200);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
