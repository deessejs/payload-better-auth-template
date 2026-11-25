import type { CollectionConfig } from 'payload';

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    // Payload's first-user bootstrap is handled by Payload. Later provisioning is admin-only.
    create: ({ req }) => Boolean(req.user),
  },
  fields: [],
};
