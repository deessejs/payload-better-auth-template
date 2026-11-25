import type { CollectionConfig } from 'payload';

export const Example: CollectionConfig = {
  slug: 'examples',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'ownerId', 'updatedAt'] },
  access: {
    // The collection is available to trusted Payload admins only over REST/Admin APIs.
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ({ req }) => req.user?.collection === 'admins',
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'ownerId', type: 'text', required: true, index: true },
  ],
};
