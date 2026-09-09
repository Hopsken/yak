# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: Next.js App Router SSR pages, layouts, OAuth and publishing API routes.
- `src/components/`: reusable UI components (PascalCase files like `ThemeToggle.tsx`).
- `src/lib/`: Atcute OAuth, PDS access, publishing, and derived link graph services.
- `src/utils/`, `src/hooks/`, `src/consts.ts`, `src/type.ts`: shared helpers, hooks, constants, and types.
- `content/`: old content files; not used at runtime.
- `scripts/`: isolated test network and integration checks.
- `public/`: static assets (for example `favicon.ico`).

## Build, Test, and Development Commands

- `pnpm install`: install dependencies (project uses `pnpm`, lockfile is `pnpm-lock.yaml`).
- `pnpm run dev`: start local dev server at `http://localhost:3000`.
- `pnpm run build`: production build check.
- `pnpm run start`: run the production build locally.
- `pnpm run lint`: run Next.js ESLint rules.
- `pnpm test`: run Vitest unit checks.
- `pnpm dev:network`: start the disposable PDS/PLC network (see `docs/development-network.md`).
- `pnpm test:network` / `pnpm test:browser`: verify the running isolated app and PDS.

## Coding Style & Naming Conventions

- Language: TypeScript with `strict` mode enabled (`tsconfig.json`).
- Formatting: Prettier (`prettier.config.mjs`) with 2-space indentation, single quotes, no semicolons, 80-char line width.
- Linting: Next.js rules and Prettier compatibility via `eslint.config.mjs`.
- Naming:
  - Components: `PascalCase.tsx`
  - Hooks: `useXxx.ts`
  - Utilities/services: `kebab-case.ts` or descriptive lowercase filenames (match nearby files).

## Testing Guidelines

- Unit tests use Vitest. Network/browser checks use only disposable local accounts.
- Minimum pre-PR quality gate: run `pnpm run lint`, `pnpm test`, and `pnpm run build`.
- For behavior-heavy changes, include manual verification steps in the PR (pages touched, expected output, and edge cases).
- If adding tests, prefer colocated `*.test.ts`/`*.test.tsx` files near the code they validate.

## Commit & Pull Request Guidelines

- Follow conventional commit prefixes used in history: `feat:`, `fix:`, `chore:` (for example `feat: improve title and slug mapping`).
- Keep commits focused and logically grouped; avoid mixing refactors with feature work.
- PRs should include:
  - Clear summary and motivation.
  - Linked issue (if applicable).
  - UI screenshots/GIFs for visual changes.
  - Notes about lexicon, OAuth, and deployment configuration updates.

## Security & Configuration Tips

- Keep OAuth keys, session secrets, and local test passwords out of Git and logs.
- Review owner-DID enforcement and production/dev boundaries carefully. OAuth uses request-scoped encrypted cookie storage; do not refresh tokens in SSR components. Cookie size limits and occasional concurrent-refresh login failures are intentional single-author tradeoffs.
