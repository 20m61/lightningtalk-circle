# Dependabot PR Merge Instructions

## Quick Commands for Phase 1 (Safe Merges)

Run these commands to merge the safe GitHub Actions updates:

```bash
# Merge PR #28: github/codeql-action
gh pr merge 28 --merge --admin

# Merge PR #27: chromaui/action
gh pr merge 27 --merge --admin

# Merge PR #25: codecov/codecov-action
gh pr merge 25 --merge --admin

# Merge PR #24: geekyeggo/delete-artifact
gh pr merge 24 --merge --admin
```

## Investigation Commands

### Check PR #23 test failure:

```bash
# View the failing test details
gh run view $(gh pr view 23 --json statusCheckRollup -q '.statusCheckRollup[] | select(.name == "test" and .conclusion == "FAILURE") | .detailsUrl' | sed 's/.*\/runs\///' | cut -d'/' -f1)

# Re-run the failed test
gh workflow run ci-cd.yml --ref dependabot/github_actions/nick-invision/retry-3
```

### Check Storybook v9 migration issues:

```bash
# View breaking changes for Storybook
gh pr view 21 --json body | jq -r '.body' | grep -A 10 "Breaking"

# Check specific test failures
gh run view $(gh pr view 21 --json statusCheckRollup -q '.statusCheckRollup[] | select(.conclusion == "FAILURE") | .detailsUrl' | head -1 | sed 's/.*\/runs\///' | cut -d'/' -f1)
```

### Check Node 24 compatibility:

```bash
# View Node 24 test failures
gh pr view 19 --json statusCheckRollup | jq '.statusCheckRollup[] | select(.conclusion == "FAILURE") | {name, detailsUrl}'

# Check package.json engine constraints
gh pr view 19 --json files -q '.files[].path' | grep package.json | xargs -I {} gh api repos/:owner/:repo/contents/{} --ref dependabot/docker/node-24-alpine | jq -r '.content' | base64 -d | jq '.engines'
```

## Bulk Operations

### Merge all safe PRs at once:

```bash
# Merge all Phase 1 PRs
for pr in 28 27 25 24; do
  echo "Merging PR #$pr..."
  gh pr merge $pr --merge --admin
  sleep 5  # Brief pause between merges
done
```

### Group Storybook PRs:

```bash
# Create a branch to test all Storybook updates together
git checkout -b storybook-v9-upgrade
for pr in 26 21 20; do
  gh pr checkout $pr
  git cherry-pick HEAD
done
npm install
npm test
```

## Monitoring

### Watch CI status:

```bash
# Monitor workflow runs
gh run list --limit 10

# Watch specific PR checks
gh pr checks 23 --watch
```

### Check merge queue:

```bash
# List all open Dependabot PRs
gh pr list --author "app/dependabot" --json number,title,mergeable,statusCheckRollup | jq '.[] | {number, title, mergeable, passing: (.statusCheckRollup | map(select(.conclusion == "SUCCESS")) | length), failing: (.statusCheckRollup | map(select(.conclusion == "FAILURE")) | length)}'
```

## Notes

- Use `--admin` flag to bypass branch protection if needed
- Always check that tests have completed before merging
- For major updates (Node, Storybook), consider creating a test branch first
- Monitor the main branch after each merge to ensure stability
