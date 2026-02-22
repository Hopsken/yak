# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages, layouts, API routes, and route groups (`(main)`, `(keystatic)`).
- `src/components/`: reusable UI components (PascalCase files like `ThemeToggle.tsx`).
- `src/lib/`: domain services and integrations (for example `note-service.ts`, Keystatic readers).
- `src/utils/`, `src/hooks/`, `src/consts.ts`, `src/type.ts`: shared helpers, hooks, constants, and types.
- `content/notes/`: Markdoc note files (`*.mdoc`); `content/references.json`: backlink/reference metadata.
- `cli/loader.js`: content generation utility wired to `pnpm run generate`.
- `public/`: static assets (for example `favicon.ico`).

## Build, Test, and Development Commands
- `pnpm install`: install dependencies (project uses `pnpm`, lockfile is `pnpm-lock.yaml`).
- `pnpm run dev`: start local dev server at `http://localhost:3000`.
- `pnpm run build`: production build check.
- `pnpm run start`: run the production build locally.
- `pnpm run lint`: run Next.js ESLint rules.
- `pnpm run generate`: run `cli/loader.js` to refresh generated reference/link data.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled (`tsconfig.json`).
- Formatting: Prettier (`prettier.config.mjs`) with 2-space indentation, single quotes, no semicolons, 80-char line width.
- Linting: `next/core-web-vitals` + `prettier` via `.eslintrc.json`.
- Naming:
  - Components: `PascalCase.tsx`
  - Hooks: `useXxx.ts`
  - Utilities/services: `kebab-case.ts` or descriptive lowercase filenames (match nearby files).

## Testing Guidelines
- No dedicated automated test framework is configured yet.
- Minimum pre-PR quality gate: run `pnpm run lint` and `pnpm run build`.
- For behavior-heavy changes, include manual verification steps in the PR (pages touched, expected output, and edge cases).
- If adding tests, prefer colocated `*.test.ts`/`*.test.tsx` files near the code they validate.

## Commit & Pull Request Guidelines
- Follow conventional commit prefixes used in history: `feat:`, `fix:`, `chore:` (for example `feat: improve title and slug mapping`).
- Keep commits focused and logically grouped; avoid mixing refactors with feature work.
- PRs should include:
  - Clear summary and motivation.
  - Linked issue (if applicable).
  - UI screenshots/GIFs for visual changes.
  - Notes about content/schema/config updates (especially `content/*`, `yak.config.ts`, or Keystatic settings).

## Security & Configuration Tips
- Keep secrets in environment files (for example GitHub tokens and Keystatic-related variables); never commit credentials.
- Review changes to `yak.config.ts` and `keystatic.config.ts` carefully, since they affect storage repo and content schema behavior.
