# @monte/content-builder – Content Pipeline (WIP)

This package will host CLI utilities for validating, compiling, and publishing lesson content. It relies on the shared schemas so authored JSON can be enforced before reaching the API/CDN.

## Intended Responsibilities

- Validate lessons and materials against `@monte/shared` Zod schemas.
- Run smoke tests (e.g., headless Pixi checks) before publishing.
- Emit versioned artifacts suitable for CDN hosting.

## Current State

The package currently exports scaffolding for future scripts. As we implement the pipeline, expect commands such as:

```bash
pnpm --filter @monte/content-builder build    # Validate & compile content
pnpm --filter @monte/content-builder publish  # Upload to CDN / manifest
```

## Boundaries

- Consumes `@monte/shared` for contracts and validation.
- Should not depend on application code—operates on JSON + schema logic only.
- Will be invoked by CI/CD and by authors during preview/publishing workflows.

Contributions welcome! Start by adding validation routines that mirror the API expectations so content issues are caught before deployment.
