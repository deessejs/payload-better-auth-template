# packages/ui

This source-only workspace owns the shadcn primitives, theme tokens, and shared stylesheet used by the app.

## Structure

- `src/components/`: shadcn primitives, one file per component.
- `src/styles/globals.css`: Tailwind v4 imports, tokens, theme mapping, and source scanning.
- `src/lib/utils.ts`: `cn` class-name utility.
- `components.json`: shadcn CLI install targets and aliases.
- `postcss.config.mjs`: shared Tailwind PostCSS plugin config.

The app imports components through `@template/ui/components/*` and the stylesheet through `@template/ui/globals.css`. The package resolves as source and has no separate build step.

## Conventions

- Use semantic tokens such as `bg-background`, `text-foreground`, and `border-border` in primitives.
- Keep the light and dark theme token names in sync.
- Add only primitives the template uses; app-specific forms and pages stay in `apps/app`.
- Keep Tailwind class scanning configured for both this package and `apps/app` in the shared stylesheet.
