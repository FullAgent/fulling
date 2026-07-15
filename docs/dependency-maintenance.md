# Dependency Maintenance

Fulling uses Dependabot to surface npm and GitHub Actions updates. Dependabot
opens reviewable pull requests; it must not auto-merge dependency changes.

## Cadence

- Apply security updates as soon as validation is complete.
- Review grouped patch and minor updates every week.
- Review major updates quarterly and migrate them separately.
- Coordinate Node.js changes across `package.json`, CI, Docker, Vercel, and
  contributor documentation instead of allowing a single-file runtime bump.

## Update boundaries

- Keep one coherent dependency batch per commit. A pull request may contain
  multiple independently reviewable batch commits.
- Update coupled packages together, including Next.js with
  `eslint-config-next`, React with React DOM, Prisma with `@prisma/client` and
  its driver adapter, and Tailwind CSS with `@tailwindcss/postcss`.
- Keep major migrations separate from unrelated dependency changes.
- Never use `npm audit fix --force` as a substitute for compatibility review.

## Lockfile review

- Change dependency requirements in `package.json` and regenerate
  `package-lock.json` with npm; never edit the lockfile by hand.
- Use `npm ci` to verify that a clean checkout installs reproducibly.
- Confirm that lockfile churn is attributable to the intended dependency
  batch and review new lifecycle scripts, native binaries, and overrides.
- Commit `package.json` and `package-lock.json` together.

## Required validation

Run both production-only and complete vulnerability reviews:

```bash
npm run audit:prod
npm run audit
```

Every dependency batch must also pass the checks relevant to its scope:

```bash
npm ci
npm run lint
npm test
npm run prisma:validate
npm run prisma:migrate
npm run test:e2e
npm run build
```

Runtime, database, framework, or deployment changes also require a Docker image
build, startup smoke test, and the relevant authentication, PostgreSQL, and
user-specific Kubernetes checks.

## Dependabot policy

- Patch and minor npm updates are grouped by framework, data/auth, frontend,
  test/quality, and remaining dependencies.
- Major updates remain individual review items. TypeScript 7, ESLint 10, and
  `eslint-plugin-simple-import-sort` 13 are explicitly deferred until their
  ecosystem compatibility is reviewed.
- GitHub Actions updates are grouped separately.
- Docker updates are intentionally excluded so the Node.js baseline cannot
  drift away from CI, package engines, Vercel, and documentation.
- Dependabot alerts and security updates must be enabled in the repository's
  GitHub security settings after this configuration reaches the default branch.
