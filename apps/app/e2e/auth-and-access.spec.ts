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

async function createExample(page: Page, title: string) {
  await page.getByLabel('New record title').fill(title);
  await page.getByRole('button', { name: /add example/i }).click();
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
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
});

test('the shared header reflects signed-out and Better Auth session state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);

  await loginSaaSUser(page, userEmail, userPassword);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Login' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Sign up' })).toHaveCount(0);

  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  );
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

test('each Better Auth user is capped at 10 records, including concurrent creates', async ({
  page,
}) => {
  await loginSaaSUser(page, userEmail, userPassword);

  for (let index = 1; index <= 9; index += 1) {
    const title = `agent-limit-${index}`;
    await createExample(page, title);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }

  const secondPage = await page.context().newPage();
  await secondPage.goto('/dashboard');
  const concurrentTitles = ['agent-concurrent-a', 'agent-concurrent-b'];
  await Promise.all([
    createExample(page, concurrentTitles[0]),
    createExample(secondPage, concurrentTitles[1]),
  ]);

  const limitMessage = 'You have reached the limit of 10 records for your account.';
  await expect
    .poll(async () => {
      const alerts = await Promise.all([
        page.getByRole('alert').filter({ hasText: limitMessage }).isVisible(),
        secondPage.getByRole('alert').filter({ hasText: limitMessage }).isVisible(),
      ]);
      return alerts.filter(Boolean).length;
    })
    .toBe(1);
  await expect(page.getByRole('list', { name: 'Your example records' }).locator('li')).toHaveCount(
    10,
  );

  await createExample(page, 'agent-limit-11');
  await expect(page.getByText(limitMessage, { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Your example records' }).locator('li')).toHaveCount(
    10,
  );

  const sessionResponse = await page.request.get('/api/auth/get-session');
  const session = await sessionResponse.json();
  const ownerId = session?.user?.id;
  expect(ownerId).toBeTruthy();

  const adminPage = await page.context().newPage();
  await loginPayloadAdmin(adminPage);
  const adminCreateResponse = await adminPage.request.post('/api/examples', {
    data: { title: 'payload-admin-over-limit', ownerId },
  });
  expect(adminCreateResponse.status()).toBe(409);
  expect(await adminCreateResponse.text()).toContain(limitMessage);
  await adminPage.close();
  await secondPage.close();
});

test('Better Auth users cannot use Payload REST or Admin authentication', async ({ page }) => {
  await loginSaaSUser(page, userEmail, userPassword);
  const response = await page.request.get('/api/examples');
  expect([401, 403]).toContain(response.status());
  const createResponse = await page.request.post('/api/examples', {
    data: { title: 'unauthorized-direct-create', ownerId: 'forged-owner' },
  });
  expect([401, 403]).toContain(createResponse.status());

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
