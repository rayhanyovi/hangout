# Workflow Contract

## Canonical Files

- `docs/overview.md` is the technical and product map of the project.
- `docs/to_dos.md` is the main progress tracker.
- `docs/workflow_contract.md` is the canonical workflow contract for AI agents and developers.

## Core Agreement

- We are building the real application in the root Next.js project.
- `/my-idea-app` is reference material from Lovable, not the production app.
- `npm` is the canonical package manager for the root app and `package-lock.json` is the lockfile of record.
- New product work should be implemented in the root app unless a task explicitly says otherwise.
- `/my-idea-app` can be read, compared, and mined for logic or UI ideas, but it should not become the place where production readiness work accumulates.

## Working Order Per Task

For any non-trivial task, follow this order:

1. Read the relevant parts of `docs/overview.md`.
2. Check `docs/to_dos.md` and pick the matching task line.
3. Inspect `/my-idea-app` only if reference behavior or UI parity is needed.
4. Implement in the root Next.js app.
5. Verify with the smallest meaningful validation step.
6. Update `docs/to_dos.md` if the task is truly finished.
7. Create a separate commit for a completed task.

## Repo Boundary Rules

- Do not add new product features only inside `/my-idea-app`.
- Do not treat root build or lint results as trustworthy if tooling still scans `/my-idea-app`.
- If logic is copied from the Lovable export, normalize it to Next.js App Router, server/client boundaries, and production constraints.
- Keep browser-only code isolated behind explicit client components.
- Move provider calls that need control, caching, or protection behind server boundaries where appropriate.

## Documentation Rules

- Update `docs/overview.md` when understanding of architecture, scope, or system boundaries materially changes.
- Update `docs/to_dos.md` when a task is started, finished, split, or deprioritized.
- Keep task names concrete enough that another developer can resume work without re-auditing the repo.
- If a discovered blocker changes the migration strategy, record it in `docs/overview.md` or this contract before continuing.

## Definition Of Done

A task is done only if all relevant conditions are true:

- The implementation exists in the root app, not only in the reference app.
- The task has been validated with an appropriate check.
- `docs/to_dos.md` is updated.
- The result does not quietly regress the migration boundary or workflow assumptions.

## Commit Convention

Commit message format:

`<tag>: <task name>`

Allowed examples:

- `feat: Add room shell route`
- `fix: Exclude reference app from root TypeScript scope`
- `docs: Define project overview and workflow contract`

Use simple top-level tags such as:

- `feat`
- `fix`
- `refactor`
- `docs`
- `chore`
- `ui`
- `style`

## Operating Principles

- Prefer shipping complete vertical slices over scattering partial migrations across many files.
- Stabilize route structure, data contracts, and service boundaries early.
- Keep fairness explainable and privacy constraints visible in implementation decisions.
- Treat Vercel deployment readiness as a first-class goal, not an afterthought.
