# @template/ui

Shared shadcn/ui primitives and Tailwind CSS v4 theme for the app.

## Usage

Import the shared stylesheet once in the frontend root layout:

```tsx
import '@template/ui/globals.css';
```

Import shared primitives and utilities by their package exports:

```tsx
import { Button } from '@template/ui/components/button';
import { cn } from '@template/ui/lib/utils';
```

The package is consumed as source through workspace exports and `transpilePackages`; it has no build step. Tailwind source scanning includes this package's components and the app's TS/TSX files.
