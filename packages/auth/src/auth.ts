import { betterAuth } from 'better-auth';
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

export const auth = betterAuth({
  appName: 'Payload + Better Auth SaaS',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  database: {
    dialect: new PostgresDialect({ pool: new Pool({ connectionString: databaseUrl }) }),
    type: 'postgres',
    schemaName: 'auth',
  },
});
