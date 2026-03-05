# Contributing to AI Fantasy Coach

Thank you for your interest in contributing to AI Fantasy Coach! This guide will help you get started.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Style and Conventions](#code-style-and-conventions)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Reporting Bugs](#reporting-bugs)

---

## Development Environment Setup

### Prerequisites

- **Node.js** >= 18 (LTS recommended)
- **pnpm** — this project uses pnpm as its package manager

### Getting Started

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/<your-username>/ai-fantasy-coach.git
   cd ai-fantasy-coach
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   Copy the example env file (if one exists) or create a `.env.local` file in the project root. At a minimum you will need an OpenAI API key:

   ```
   OPENAI_API_KEY=your-key-here
   ```

   Environment files (`.env*`) are gitignored and should never be committed.

4. **Start the development server:**

   ```bash
   pnpm dev
   ```

   This starts Next.js with Turbopack. Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server with Turbopack |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint across the project |

---

## Code Style and Conventions

### Language and Framework

- **TypeScript** is required for all source files (`.ts` / `.tsx`). Strict mode is enabled.
- **Next.js 15** App Router — pages and layouts live in `app/`, API routes live in `app/api/`.
- **React 19** with React Server Components (RSC) by default.

### Project Structure

```
├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── api/          # API route handlers
│   └── components/   # Page-specific components
├── components/       # Shared components
│   └── ui/           # shadcn/ui primitives (do not edit directly)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and business logic
│   ├── coach/        # AI coaching logic
│   └── espn/         # ESPN API helpers
├── types/            # Shared TypeScript type definitions
└── public/           # Static assets
```

### Path Aliases

Use the `@/` alias to import from the project root:

```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
```

### Styling

- **Tailwind CSS v4** with PostCSS. Theme tokens are defined in `app/globals.css` via `@theme inline`.
- Use the `cn()` utility from `@/lib/utils` to merge class names conditionally.
- **shadcn/ui** (New York style) provides base UI components in `components/ui/`. Add new shadcn components via the CLI (`pnpm dlx shadcn@latest add <component>`) rather than writing them by hand.
- Dark mode is supported via `next-themes` with a `class` strategy.

### Linting

ESLint is configured in `eslint.config.mjs` (flat config) and extends `next/core-web-vitals` and `next/typescript`. Key rules:

- `@typescript-eslint/no-explicit-any` is set to **error** — avoid `any` types entirely.

Run the linter before committing:

```bash
pnpm lint
```

### General Conventions

- Use **named exports** for components and utilities.
- Define types in the `types/` directory when they are shared across multiple files.
- Use **Zod** for runtime validation of external data (API responses, form inputs).
- Keep components small and composable. Place page-specific components in `app/components/` and shared ones in the top-level `components/` directory.
- Prefer `async`/`await` over raw Promises.

---

## Submitting Pull Requests

### Branch Naming

Create a branch from `main` using one of these prefixes:

| Prefix | Purpose |
|--------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behavior change |
| `chore/` | Tooling, dependencies, CI configuration |

Example: `feature/affc-42-add-trade-analyzer`

### Workflow

1. **Create a branch** from the latest `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in small, focused commits. Write clear commit messages that reference a ticket when applicable (e.g., `AFFC-42: Add trade analyzer component`).

3. **Lint your code:**

   ```bash
   pnpm lint
   ```

4. **Build successfully** before opening a PR:

   ```bash
   pnpm build
   ```

5. **Push your branch** and open a pull request against `main`.

### Pull Request Guidelines

- Give the PR a descriptive title and a summary of what changed and why.
- Keep PRs focused — one logical change per PR.
- If the change is visual, include screenshots or a brief recording.
- Link any related issues or tickets in the PR description.
- Be responsive to review feedback.

---

## Reporting Bugs

If you find a bug, please [open an issue](https://github.com/jakekaminski/ai-fantasy-coach/issues/new) with the following information:

1. **Summary** — a clear, concise description of the bug.
2. **Steps to reproduce** — the exact steps to trigger the issue.
3. **Expected behavior** — what you expected to happen.
4. **Actual behavior** — what actually happened, including any error messages or console output.
5. **Environment** — your OS, browser, Node.js version, and pnpm version.
6. **Screenshots** — attach them if the bug is visual.

Please search existing issues before filing a duplicate. If you are able to fix the bug yourself, feel free to open a PR directly — just reference the issue number in your commit message.
