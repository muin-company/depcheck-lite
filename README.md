# depcheck-lite

[![npm version](https://img.shields.io/npm/v/depcheck-lite.svg)](https://www.npmjs.com/package/depcheck-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/muin-company/depcheck-lite/workflows/tests/badge.svg)](https://github.com/muin-company/depcheck-lite/actions)

Lightning-fast unused dependency checker. Zero config, regex-based.

## Why depcheck-lite?

Most dependency checkers parse your entire codebase with AST tools. That's slow and heavy.

depcheck-lite uses simple regex patterns to scan for imports. It's:
- **Fast** - No AST parsing overhead
- **Light** - Zero dependencies
- **Simple** - Works out of the box

Perfect for CI pipelines and quick local checks.

## Install

```bash
npm install -g depcheck-lite
```

Or use with npx:

```bash
npx depcheck-lite
```

## Usage

Run in your project directory:

```bash
depcheck-lite
```

Check a specific path:

```bash
depcheck-lite ./my-project
```

Get JSON output:

```bash
depcheck-lite --json
```

Ignore specific packages:

```bash
depcheck-lite --ignore react --ignore lodash
```

Scan custom directories:

```bash
depcheck-lite --dirs src,lib,components
```

## What it checks

By default, scans these directories:
- src/
- lib/
- app/
- components/
- pages/
- utils/

Supports these file types:
- .js, .jsx
- .ts, .tsx
- .mjs, .cjs

Detects:
- `import foo from 'package'`
- `import { bar } from 'package'`
- `const baz = require('package')`
- `import('package')` (dynamic imports)
- Scoped packages (@org/package)
- Subpath imports (package/submodule)

## Exit codes

- `0` - No unused dependencies found
- `1` - Unused dependencies found or error occurred

Great for CI:

```bash
depcheck-lite || echo "Clean up your dependencies!"
```

## Before/After

Before depcheck-lite:
```bash
$ depcheck
...parsing AST...
...analyzing...
(30 seconds later)
Unused dependencies: lodash, moment
```

After depcheck-lite:
```bash
$ depcheck-lite
Found 2 unused dependencies:

  - lodash
  - moment

Total: 2/47
(0.3 seconds)
```

## API Usage

```typescript
import { DependencyAnalyzer } from 'depcheck-lite';

const analyzer = new DependencyAnalyzer({
  cwd: './my-project',
  ignore: ['@types/*'],
  dirs: ['src', 'lib']
});

const result = analyzer.analyze();
console.log(result.unused); // ['lodash', 'moment']
```

## Limitations

- Regex-based, so won't catch everything (dynamic requires with variables)
- Doesn't check package.json scripts or config files
- May miss dependencies used only in comments or strings

If you need 100% accuracy, use the original depcheck. If you want fast and good enough, use this.

## Real-World Examples

### 1. CI/CD Integration

**GitHub Actions:**

```yaml
# .github/workflows/deps.yml
name: Check Dependencies

on: [push, pull_request]

jobs:
  deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Check for unused dependencies
        run: npx depcheck-lite
      
      - name: Fail if unused deps found
        if: failure()
        run: echo "❌ Please remove unused dependencies"
```

**GitLab CI:**

```yaml
# .gitlab-ci.yml
check-deps:
  stage: test
  script:
    - npx depcheck-lite
  only:
    - merge_requests
    - main
```

### 2. Monorepo Scanning

Check all packages in a monorepo:

```bash
# Scan each package
for pkg in packages/*/; do
  echo "Checking $pkg"
  depcheck-lite "$pkg"
done

# Or parallel execution with GNU parallel
find packages -maxdepth 1 -type d | parallel depcheck-lite {}

# JSON output for aggregation
for pkg in packages/*/; do
  depcheck-lite "$pkg" --json >> results.jsonl
done
```

### 3. Pre-commit Hook

Prevent commits with unused dependencies:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Checking for unused dependencies..."
depcheck-lite

if [ $? -ne 0 ]; then
  echo "❌ Unused dependencies found. Please clean up before committing."
  exit 1
fi
```

With husky + lint-staged:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "depcheck-lite"
    }
  }
}
```

### 4. Exclude Dev Dependencies

Focus only on production dependencies:

```bash
# Get unused prod dependencies
depcheck-lite --json | jq '.unused[] | select(.type == "dependencies")'

# Script to clean them up automatically
depcheck-lite --json | \
  jq -r '.unused[]' | \
  xargs -I {} npm uninstall {}
```

### 5. Custom Scan Patterns

For non-standard project structures:

```bash
# Scan only specific directories
depcheck-lite --dirs "src,server,client"

# Ignore test utilities and types
depcheck-lite --ignore "@types/*" --ignore "jest" --ignore "vitest"

# Ignore all dev-related packages
depcheck-lite --ignore "@types/*" --ignore "*-loader" --ignore "*-plugin"
```

### 6. Integration with npm scripts

```json
{
  "scripts": {
    "deps:check": "depcheck-lite",
    "deps:clean": "depcheck-lite --json | jq -r '.unused[]' | xargs npm uninstall",
    "pretest": "npm run deps:check",
    "prepublishOnly": "npm run deps:check"
  }
}
```

Now `npm test` will always check dependencies first.

### 7. Combine with Other Tools

**With npm-check-updates:**

```bash
# Update dependencies
ncu -u
npm install

# Then check for unused
depcheck-lite

# Clean up if any found
depcheck-lite --json | jq -r '.unused[]' | xargs npm uninstall
```

**With size-limit:**

```bash
# Remove unused deps to reduce bundle size
depcheck-lite --json | jq -r '.unused[]' | xargs npm uninstall
npm run build
size-limit
```

### 8. Periodic Audits

Run weekly dependency audits:

```bash
# crontab -e
0 9 * * 1 cd /path/to/project && depcheck-lite --json > deps-report-$(date +\%Y\%m\%d).json

# Or with GitHub Actions scheduled workflow
# on:
#   schedule:
#     - cron: '0 9 * * 1'  # Every Monday at 9 AM
```

## Contributing

PRs welcome! 

```bash
git clone https://github.com/muin-company/depcheck-lite.git
cd depcheck-lite
npm install
npm run build
npm test
```

## License

MIT
