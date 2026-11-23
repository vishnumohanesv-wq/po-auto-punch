# ADR 0001: Target architecture

**Decision:** PostgreSQL (RLS by company/plant) + **TypeScript** everywhere: NestJS API, React + TanStack web, BullMQ jobs on Redis, Prisma migrations, S3-compatible object storage.
**Why TS over Python:** the parsers already run in the browser today; one language lets `packages/parsers` run unchanged in the API, the web preview and tests. Trade-off: Python has stronger PDF/Excel tooling, so heavy PDF work runs in a worker that may use a Python sidecar if needed.
**Status:** proposed, pending Q1 in OPEN_QUESTIONS.md.
