# Task 01 — Project Setup

## Goal

Scaffold the Next.js 15 project with all dependencies, TypeScript configuration, and developer tooling (ESLint, Prettier, Husky, lint-staged, commitlint).

---

## Files to Create / Modify

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `postcss.config.mjs`
- `.env.example`
- `.prettierrc`
- `.prettierignore`
- `eslint.config.mjs`
- `.commitlintrc.ts`
- `.lintstagedrc.mjs`
- `.husky/pre-commit`
- `.husky/commit-msg`
- `.gitignore`

---

## Step-by-Step Tasks

### 1. Initialise Next.js project

```bash
npx create-next-app@latest nfx-policies \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
cd nfx-policies
```

### 2. Install runtime dependencies

```bash
npm install \
  next-auth@beta \
  @auth/core \
  @microsoft/microsoft-graph-client \
  @supabase/supabase-js \
  @supabase/ssr \
  @react-pdf-viewer/core \
  @react-pdf-viewer/toolbar \
  pdfjs-dist \
  mammoth \
  dompurify \
  zustand \
  @tanstack/react-query \
  react-hook-form \
  @hookform/resolvers \
  zod
```

### 3. Install dev dependencies

```bash
npm install -D \
  @types/dompurify \
  @types/node \
  @types/react \
  @types/react-dom \
  prettier \
  prettier-plugin-tailwindcss \
  husky \
  lint-staged \
  @commitlint/cli \
  @commitlint/config-conventional \
  @commitlint/types
```

### 4. Configure TypeScript — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. Configure Prettier — `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 6. Configure `.prettierignore`

```
.next
node_modules
public
*.lock
```

### 7. Configure lint-staged — `.lintstagedrc.mjs`

```js
export default {
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,css}': ['prettier --write'],
};
```

### 8. Configure commitlint — `.commitlintrc.ts`

```typescript
import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'ci'],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'header-max-length': [2, 'always', 100],
  },
};

export default config;
```

### 9. Set up Husky

```bash
npx husky init
```

`.husky/pre-commit`:
```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

`.husky/commit-msg`:
```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

### 10. Add `prepare` script to `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prepare": "husky"
  }
}
```

### 11. Create `.env.example`

```bash
# ── NextAuth ──────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# ── Azure AD / Microsoft Entra ID ────────────────────
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# ── Microsoft Graph / SharePoint ─────────────────────
SHAREPOINT_SITE_ID=
SHAREPOINT_DRIVE_ID=
SHAREPOINT_FOLDER_ID=

# ── Supabase ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── Organization ──────────────────────────────────────
ORG_DOMAIN=nickelfox.com
DEFAULT_ORG_ID=
```

### 12. Copy PDF.js worker to public/

After installing `pdfjs-dist`, copy the worker file:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```

Add to `package.json` postinstall script so it runs on every install:

```json
"postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js"
```

---

## Acceptance Criteria

- [ ] `npm run dev` starts the dev server without errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` compiles successfully
- [ ] Making a commit with an invalid message (e.g. `bad commit`) is rejected by commitlint
- [ ] Staging a file with a lint error and committing is rejected by lint-staged
- [ ] `.env.example` is committed; `.env.local` is in `.gitignore`
- [ ] `public/pdf.worker.min.js` exists
