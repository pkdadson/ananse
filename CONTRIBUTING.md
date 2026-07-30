# Contributing to Ananse

Thanks for your interest — bug reports, ideas, and PRs are welcome.

Everyone participating agrees to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting help

- **Question, help, idea** — open a [GitHub Discussion](https://github.com/pkdadson/ananse/discussions) (once enabled) or start with a Draft PR.
- **Bug** — open an [issue](https://github.com/pkdadson/ananse/issues/new/choose) using the bug template.
- **Security vulnerability** — see [SECURITY.md](./SECURITY.md) (please do not open a public issue).

## Development setup

```bash
git clone https://github.com/pkdadson/ananse.git
cd ananse
pnpm install
pnpm build          # build all packages
pnpm dev:demo       # open http://localhost:5173/
pnpm test           # vitest
pnpm lint           # biome
```

- Node **≥ 20**
- pnpm **9.12+** (this repo pins `packageManager` — Corepack picks it up automatically)

## Repository layout

| Path | Purpose |
|------|---------|
| `packages/core` | Framework-agnostic types, layout, schemas, mutations |
| `packages/react` | React components (`OrgChart`, `MindMap`, `FlowBuilder`) and hooks |
| `packages/tokens` | CSS variables + Tailwind preset |
| `apps/demo` | Interactive demo app (Vite) |
| `docs/recipes` | Task-oriented how-tos |
| `docs/assets` | README screenshots |

## Making a change

1. **Branch** off `main`: `git checkout -b feat/short-description`.
2. **Follow the existing style.** Biome enforces formatting and lint (`pnpm lint`). TypeScript is strict.
3. **Write tests.** New behavior in `packages/core` or `packages/react` should ship with a Vitest case in the matching `tests/` directory.
4. **Verify locally:**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```
5. **Commit** with a short, imperative summary. Conventional Commits are welcome but not required (`feat(react): …`, `fix(core): …`, `docs: …`).
6. **Open a PR** using the template. Link related issues.

## PR checklist

- [ ] Tests added or updated
- [ ] `pnpm test` and `pnpm lint` pass locally
- [ ] Public API changes reflected in the relevant README / recipe
- [ ] CHANGELOG entry under `## Unreleased` if the change is user-facing

## API stability

- Pre-1.0 (`0.x`): minor bumps may include breaking changes; we'll call them out in `CHANGELOG.md`.
- Post-1.0: SemVer strictly.

## Release process (maintainers)

1. Land all changes on `main`; ensure `pnpm publish:check` is green.
2. Bump versions via `pnpm -r --filter='./packages/*' exec npm version <ver> --no-git-tag-version`.
3. Move `CHANGELOG.md` `## Unreleased` entries under the new version heading.
4. Commit `chore: release vX.Y.Z`, tag `vX.Y.Z`, push tags.
5. Publish in dependency order: `tokens` → `core` → `react`.
6. `gh release create vX.Y.Z --generate-notes`.

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
