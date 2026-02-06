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

### Basic Usage

Run in your project directory:

```bash
depcheck-lite
```

Check a specific path:

```bash
depcheck-lite ./my-project
```

### Interactive Mode (NEW!)

Interactively choose which unused dependencies to remove:

```bash
depcheck-lite --interactive
```

Example session:
```
Found 5 unused dependencies:

  1. lodash
  2. moment
  3. axios
  4. chalk
  5. commander

Select packages to remove:
  - Enter numbers separated by spaces (e.g., "1 3 5")
  - Enter "all" to remove all unused packages
  - Press Enter to cancel

Your choice: 1 3 5

Removing 3 package(s):
  - lodash
  - axios
  - commander

Proceed? (y/N): y

Running: npm uninstall --save lodash axios commander

removed 3 packages

✓ Successfully removed 3 package(s)
```

**Features:**
- Select specific packages by number
- Remove all at once with "all"
- Automatic package manager detection (npm/yarn/pnpm)
- Confirmation before removal
- Safe cancellation at any step

### Other Options

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

## Examples

### Example 1: Clean project (no unused deps)

```bash
$ cd my-react-app
$ depcheck-lite

Scanning dependencies in package.json...
Checking 47 dependencies across src/, lib/

✓ All dependencies are being used!

Dependencies checked: 47
Unused: 0
```

Exit code: 0 (perfect for CI)

### Example 2: Finding unused dependencies

```bash
$ cd legacy-project
$ depcheck-lite

Scanning dependencies in package.json...
Checking 52 dependencies across src/, lib/

Found 4 unused dependencies:

  - moment         (last used 2 years ago, replaced with date-fns)
  - request        (replaced with axios)
  - underscore     (not imported anywhere)
  - bluebird       (native promises now)

Total: 4/52 dependencies unused

Run 'npm uninstall moment request underscore bluebird' to clean up
```

Exit code: 1

### Example 3: TypeScript project with @types

```bash
$ depcheck-lite

Found 8 unused dependencies:

  - @types/express     (dev dependency)
  - @types/node        (dev dependency)
  - @types/react       (dev dependency)
  - chalk
  - ora
  - boxen
  - commander
  - figlet

# @types packages are often needed even if not directly imported
$ depcheck-lite --ignore "@types/*"

Found 5 unused dependencies:

  - chalk
  - ora
  - boxen
  - commander
  - figlet

Total: 5/52 dependencies unused
```

TypeScript types often don't show up in imports but are still needed!

### Example 4: JSON output for CI pipelines

```bash
$ depcheck-lite --json

{
  "total": 47,
  "unused": [
    "lodash",
    "moment",
    "request"
  ],
  "count": 3,
  "duration": 287
}
```

Use in CI to fail builds or post to Slack:

```bash
#!/bin/bash
RESULT=$(depcheck-lite --json)
UNUSED_COUNT=$(echo $RESULT | jq '.count')

if [ $UNUSED_COUNT -gt 0 ]; then
  echo "⚠️ Found $UNUSED_COUNT unused dependencies!"
  echo $RESULT | jq '.unused'
  exit 1
fi
```

### Example 5: Ignoring specific packages

```bash
# Some packages are used in ways regex can't detect
$ depcheck-lite

Found 3 unused dependencies:

  - dotenv           (loaded via require in config)
  - @babel/runtime   (injected by babel)
  - core-js          (polyfills)

# These are actually needed, ignore them
$ depcheck-lite --ignore dotenv --ignore "@babel/*" --ignore core-js

✓ All dependencies are being used!

# Or create .depcheckrc.json:
{
  "ignore": [
    "dotenv",
    "@babel/runtime",
    "core-js"
  ]
}

$ depcheck-lite
✓ All dependencies are being used!
```

### Example 6: Monorepo / custom directories

```bash
$ depcheck-lite --dirs packages/api/src,packages/web/src,shared

Scanning dependencies in package.json...
Checking 83 dependencies across packages/api/src, packages/web/src, shared/

Found 6 unused dependencies:

  - express-rate-limit
  - helmet
  - compression
  - morgan
  - cookie-parser
  - passport-local

Total: 6/83 dependencies unused
```

Scans only the directories you specify.

### Example 7: False positives and edge cases

```bash
$ depcheck-lite

Found 2 unused dependencies:

  - webpack         (used in webpack.config.js, not in src/)
  - eslint          (used in .eslintrc, not imported)

# These are tooling deps, typically in devDependencies
# depcheck-lite focuses on runtime code, not config files

# Solution 1: Ignore build tools
$ depcheck-lite --ignore webpack --ignore eslint

# Solution 2: Only check production dependencies
$ depcheck-lite --production
# (checks only "dependencies", skips "devDependencies")

✓ All runtime dependencies are being used!
```

Common false positives:
- Build tools (webpack, vite, esbuild)
- Linters and formatters (eslint, prettier)
- Test frameworks (jest, vitest, mocha)
- Types packages (@types/*)

These should be in `devDependencies` anyway!

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
