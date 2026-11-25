import { postgresAdapter } from '@payloadcms/db-postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { Admins } from './collections/Admins';
import { Example } from './collections/Example';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseURL = process.env.DATABASE_URL;
const secret = process.env.PAYLOAD_SECRET;
if (!databaseURL) throw new Error('DATABASE_URL is required');
if (!secret) throw new Error('PAYLOAD_SECRET is required');

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: { baseDir: path.resolve(dirname, 'app/(payload)') },
  },
  collections: [Admins, Example],
  graphQL: { disable: true },
  secret,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: databaseURL },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
});
