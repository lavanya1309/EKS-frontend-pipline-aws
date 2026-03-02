# Version and image tags from commits

The pipeline sets the image tag (e.g. `v1.0.0`, `v1.1.0`, `v2.0.0`) using **Conventional Commits** since the last git tag.

## Commit message format

| Commit message | Bump | Example version change |
|----------------|------|------------------------|
| `fix: fix login bug` | **patch** | 1.0.0 → 1.0.1 |
| `fix(api): handle timeout` | **patch** | 1.0.0 → 1.0.1 |
| `feat: add dashboard` | **minor** | 1.0.0 → 1.1.0 |
| `feat(auth): add SSO` | **minor** | 1.0.0 → 1.1.0 |
| `feat!: change API` or `fix!: breaking change` | **major** | 1.0.0 → 2.0.0 |
| `BREAKING CHANGE: ...` in body | **major** | 1.0.0 → 2.0.0 |
| `chore: ...` or `docs: ...` | **patch** | 1.0.0 → 1.0.1 |

## How it works

1. Pipeline finds the **latest git tag** (e.g. `v1.0.0`). If none, starts from `0.0.0`.
2. It looks at **commits since that tag**.
3. It picks the **highest** bump in those commits (major > minor > patch).
4. It builds the **new version** and tags the image as `v1.1.0` (etc.) and pushes to ECR.

## Creating a release tag (optional)

To “pin” a release in git so the next run uses it as the base:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Next push will use commits after `v1.0.0` to compute the next version (e.g. `v1.1.0`).

## Examples

- Only `fix:` commits since last tag → **v1.0.1** (patch).
- One `feat:` and one `fix:` → **v1.1.0** (minor wins).
- One `feat!:` or `BREAKING CHANGE` → **v2.0.0** (major).
