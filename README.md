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

## Basic Examples

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

### Example 8: Gradual cleanup with interactive mode

```bash
$ depcheck-lite --interactive

Found 12 unused dependencies:

  1. lodash
  2. moment
  3. axios
  4. request
  5. bluebird
  6. q
  7. async
  8. underscore
  9. left-pad
  10. is-odd
  11. is-even
  12. pad-left

Select packages to remove: 1 2 4

Removing 3 package(s):
  - lodash
  - moment
  - request

Proceed? (y/N): y

✓ Successfully removed 3 package(s)

# Check again after testing
$ npm test
✓ All tests passed

$ depcheck-lite --interactive
# Repeat until all unused deps are removed
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

## Integration Guides

### CI/CD Integration

#### GitHub Actions

**Basic check:**

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

**With detailed reporting:**

```yaml
# .github/workflows/deps-report.yml
name: Dependency Report

on:
  pull_request:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Monday

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check dependencies
        id: depcheck
        run: |
          npx depcheck-lite --json > deps-report.json
          cat deps-report.json
        continue-on-error: true
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('deps-report.json', 'utf8'));
            
            if (report.count > 0) {
              const body = `## 📦 Unused Dependencies Report
            
            Found ${report.count} unused dependencies:
            
            ${report.unused.map(pkg => `- \`${pkg}\``).join('\n')}
            
            **Suggestion:** Run \`npm uninstall ${report.unused.join(' ')}\`
            `;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: body
              });
            }
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: deps-report
          path: deps-report.json
```

**With auto-fix PR:**

```yaml
name: Auto-fix Dependencies

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  autofix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Check for unused dependencies
        id: check
        run: |
          npx depcheck-lite --json > report.json
          UNUSED=$(cat report.json | jq -r '.unused[]' | tr '\n' ' ')
          echo "unused=$UNUSED" >> $GITHUB_OUTPUT
      
      - name: Remove unused dependencies
        if: steps.check.outputs.unused != ''
        run: npm uninstall ${{ steps.check.outputs.unused }}
      
      - name: Create Pull Request
        if: steps.check.outputs.unused != ''
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: "chore: remove unused dependencies"
          title: "chore: remove unused dependencies"
          body: |
            Automatically detected and removed unused dependencies:
            
            ${{ steps.check.outputs.unused }}
          branch: chore/remove-unused-deps
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
check-deps:
  stage: test
  script:
    - npx depcheck-lite --json | tee deps-report.json
    - |
      UNUSED_COUNT=$(jq '.count' deps-report.json)
      if [ "$UNUSED_COUNT" -gt 0 ]; then
        echo "⚠️ Found $UNUSED_COUNT unused dependencies"
        jq -r '.unused[]' deps-report.json
        exit 1
      fi
  artifacts:
    reports:
      junit: deps-report.json
  only:
    - merge_requests
    - main
```

#### CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  check-dependencies:
    docker:
      - image: node:18
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Check for unused dependencies
          command: |
            npx depcheck-lite --json > /tmp/deps-report.json
            if [ $(jq '.count' /tmp/deps-report.json) -gt 0 ]; then
              echo "Found unused dependencies:"
              jq '.unused' /tmp/deps-report.json
              exit 1
            fi
      - store_artifacts:
          path: /tmp/deps-report.json

workflows:
  test:
    jobs:
      - check-dependencies
```

#### Jenkins

```groovy
// Jenkinsfile
pipeline {
  agent any
  
  stages {
    stage('Check Dependencies') {
      steps {
        script {
          def report = sh(
            script: 'npx depcheck-lite --json',
            returnStdout: true
          ).trim()
          
          def json = readJSON text: report
          
          if (json.count > 0) {
            error("Found ${json.count} unused dependencies: ${json.unused}")
          }
        }
      }
    }
  }
}
```

### Pre-commit Hooks

#### Using Husky + lint-staged

```bash
# Install
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "package.json": [
      "depcheck-lite"
    ]
  }
}
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Check dependencies on every commit
npm run depcheck || {
  echo ""
  echo "❌ Unused dependencies detected!"
  echo "Run: npm run depcheck:fix"
  exit 1
}
```

#### Simple Git Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Checking for unused dependencies..."

npx depcheck-lite

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Unused dependencies found. Please clean up before committing."
  echo ""
  echo "Options:"
  echo "  1. Run: npx depcheck-lite --interactive"
  echo "  2. Ignore false positives: Add to .depcheckrc.json"
  echo "  3. Skip this check: git commit --no-verify"
  exit 1
fi

echo "✅ No unused dependencies"
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### Package.json Scripts

```json
{
  "scripts": {
    "deps:check": "depcheck-lite",
    "deps:check:json": "depcheck-lite --json",
    "deps:clean": "depcheck-lite --interactive",
    "deps:autofix": "depcheck-lite --json | jq -r '.unused[]' | xargs -r npm uninstall",
    "pretest": "npm run deps:check",
    "prepublishOnly": "npm run deps:check",
    "preinstall": "npm run deps:check || true"
  }
}
```

**Usage:**

```bash
# Check for unused dependencies
npm run deps:check

# Interactive cleanup
npm run deps:clean

# Auto-remove all unused (careful!)
npm run deps:autofix

# Check will run automatically before tests
npm test
```

### Monorepo Integration

**Lerna:**

```json
// lerna.json
{
  "command": {
    "run": {
      "stream": true
    }
  },
  "scripts": {
    "deps:check": "lerna run deps:check"
  }
}
```

```bash
# Check all packages
lerna run deps:check

# Check specific package
lerna run deps:check --scope=@myapp/api
```

**Nx:**

```json
// workspace.json
{
  "projects": {
    "api": {
      "targets": {
        "depcheck": {
          "executor": "@nrwl/workspace:run-commands",
          "options": {
            "command": "depcheck-lite",
            "cwd": "packages/api"
          }
        }
      }
    }
  }
}
```

```bash
# Check all projects
nx run-many --target=depcheck --all

# Check specific project
nx run api:depcheck
```

**pnpm workspaces:**

```bash
# Check all packages
pnpm -r exec depcheck-lite

# Check specific package
pnpm --filter api exec depcheck-lite

# Parallel execution
pnpm -r --parallel exec depcheck-lite
```

## Framework-Specific Examples

### React / Next.js

```bash
# Common false positives in React projects
$ depcheck-lite

Found unused dependencies:
  - react
  - react-dom
  - next

# These are used! React is imported via JSX transform
# Create .depcheckrc.json:
{
  "ignore": [
    "react",
    "react-dom",
    "next",
    "@next/font",
    "eslint-config-next"
  ],
  "dirs": ["src", "pages", "components", "app"]
}

$ depcheck-lite
✓ All dependencies are being used!
```

**Next.js specific config:**

```json
{
  "ignore": [
    "next",
    "@next/*",
    "eslint-config-next",
    "typescript",
    "@types/node",
    "@types/react",
    "@types/react-dom"
  ],
  "dirs": ["src", "pages", "components", "app", "lib"]
}
```

### Vue / Nuxt

```json
{
  "ignore": [
    "vue",
    "nuxt",
    "@nuxt/*",
    "vite",
    "@vitejs/*"
  ],
  "dirs": ["src", "components", "pages", "layouts", "composables"]
}
```

### Angular

```json
{
  "ignore": [
    "@angular/*",
    "rxjs",
    "tslib",
    "zone.js",
    "typescript",
    "@types/*"
  ],
  "dirs": ["src/app", "src/lib"]
}
```

### Node.js / Express

```bash
# Backend projects often have runtime-only dependencies
$ cat .depcheckrc.json
{
  "ignore": [
    "dotenv",
    "express",
    "helmet",
    "cors",
    "compression"
  ],
  "dirs": ["src", "lib", "routes", "controllers", "middleware"]
}
```

### TypeScript Libraries

```json
{
  "ignore": [
    "typescript",
    "@types/*",
    "tsup",
    "tsconfig-paths",
    "ts-node"
  ],
  "dirs": ["src", "lib"]
}
```

### Electron

```json
{
  "ignore": [
    "electron",
    "electron-builder",
    "electron-updater",
    "@electron/*"
  ],
  "dirs": ["src/main", "src/renderer", "src/preload"]
}
```

### React Native

```json
{
  "ignore": [
    "react-native",
    "react",
    "react-dom",
    "@react-native/*",
    "metro-react-native-babel-preset"
  ],
  "dirs": ["src", "app", "screens", "components"]
}
```

### Monorepo (Turborepo)

```json
{
  "ignore": [
    "turbo",
    "typescript",
    "@types/*",
    "eslint-config-custom",
    "tsconfig"
  ],
  "dirs": ["packages/*/src", "apps/*/src"]
}
```

## Troubleshooting

### Issue 1: False positives with JSX/TSX

**Problem:** React/Vue reported as unused even though it's used in JSX/TSX.

**Cause:** JSX transform doesn't require explicit `import React`.

**Solution:**

```json
// .depcheckrc.json
{
  "ignore": [
    "react",
    "react-dom",
    "vue"
  ]
}
```

Or check manually:

```bash
# Verify React is actually used in JSX
grep -r "React\." src/
grep -r "<.*>" src/*.tsx

# If JSX exists, React is needed
depcheck-lite --ignore react --ignore react-dom
```

### Issue 2: devDependencies reported as unused

**Problem:** Build tools (webpack, vite) reported as unused.

**Cause:** They're used in config files, not source code.

**Solution:**

```bash
# Only check production dependencies
depcheck-lite --production

# Or ignore dev tools
depcheck-lite --ignore webpack --ignore vite --ignore eslint
```

Better: Separate dev dependencies properly:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "axios": "^1.0.0"
  },
  "devDependencies": {
    "webpack": "^5.0.0",
    "eslint": "^8.0.0",
    "vitest": "^0.34.0"
  }
}
```

### Issue 3: Dynamic imports not detected

**Problem:** Package imported dynamically not detected.

```javascript
// This might not be detected
const moduleName = 'lodash';
const module = require(moduleName);

// Or
const plugin = await import(`./plugins/${name}`);
```

**Solution:**

```json
// .depcheckrc.json
{
  "ignore": [
    "lodash",
    "plugin-*"
  ]
}
```

Or add explicit imports:

```javascript
// Even if not used, helps depcheck-lite detect it
import 'lodash';

// Then use dynamically
const module = require('lodash');
```

### Issue 4: Monorepo dependencies

**Problem:** Package used in one workspace but reported as unused in another.

**Cause:** Scanning wrong directory or workspace hoisting.

**Solution:**

```bash
# Scan all workspaces
depcheck-lite --dirs packages/*/src,apps/*/src

# Or per-package
cd packages/api
depcheck-lite

cd ../web
depcheck-lite
```

Configure each package:

```json
// packages/api/.depcheckrc.json
{
  "dirs": ["src", "lib"]
}

// packages/web/.depcheckrc.json
{
  "dirs": ["src", "components", "pages"]
}
```

### Issue 5: Peer dependencies reported as unused

**Problem:** Peer dependencies like `react` in library reported as unused.

**Cause:** Not directly imported in library code.

**Solution:**

```json
{
  "ignore": [
    "react",
    "react-dom"
  ]
}
```

Or check package.json:

```json
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

Ignore all peer dependencies:

```bash
# Extract peer deps and ignore them
jq -r '.peerDependencies | keys[]' package.json | \
  xargs -I {} depcheck-lite --ignore {}
```

### Issue 6: Types packages (@types/*) reported as unused

**Problem:** @types packages reported as unused in TypeScript projects.

**Cause:** Type definitions don't show up in imports.

**Solution:**

```bash
# Ignore all @types packages
depcheck-lite --ignore "@types/*"
```

Or in config:

```json
{
  "ignore": [
    "@types/*"
  ]
}
```

**When @types ARE unused:**

```bash
# Check which @types are actually needed
ls node_modules/@types/

# Remove unused ones
npm uninstall @types/jquery @types/underscore
```

### Issue 7: Polyfills reported as unused

**Problem:** Polyfills (core-js, regenerator-runtime) reported as unused.

**Cause:** Imported by build tools, not source code.

**Solution:**

```json
{
  "ignore": [
    "core-js",
    "regenerator-runtime",
    "@babel/runtime",
    "tslib"
  ]
}
```

Check if they're actually needed:

```bash
# Check if babel uses them
cat babel.config.js

# If using modern targets, might not need
# "targets": "> 0.5%, last 2 versions, not dead"
```

### Issue 8: Config-only dependencies

**Problem:** Dependencies used only in config files reported as unused.

```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
```

**Cause:** Config files often not in scan directories.

**Solution:**

```bash
# Include config files in scan
depcheck-lite --dirs src,config,scripts

# Or ignore known config-only deps
depcheck-lite --ignore "html-webpack-plugin" --ignore "*-plugin"
```

Move to devDependencies:

```json
{
  "devDependencies": {
    "html-webpack-plugin": "^5.0.0",
    "webpack": "^5.0.0"
  }
}
```

### Issue 9: Exit code 1 blocking CI

**Problem:** CI fails on unused dependencies, but you want warnings not errors.

**Solution:**

```bash
# Allow non-zero exit code
depcheck-lite || echo "⚠️ Unused dependencies found"

# Or check count and set threshold
UNUSED=$(depcheck-lite --json | jq '.count')
if [ "$UNUSED" -gt 5 ]; then
  echo "❌ Too many unused dependencies: $UNUSED"
  exit 1
else
  echo "⚠️ Found $UNUSED unused dependencies (acceptable)"
fi
```

GitHub Actions:

```yaml
- name: Check dependencies
  run: npx depcheck-lite
  continue-on-error: true
```

### Issue 10: Performance issues in large projects

**Problem:** depcheck-lite takes too long in huge codebases.

**Solution:**

```bash
# Scan only essential directories
depcheck-lite --dirs src/core,src/lib

# Exclude tests and stories
depcheck-lite --dirs "src,lib" --exclude "**/*.test.js,**/*.stories.js"

# Run in parallel for monorepos
find packages -name package.json -execdir sh -c 'depcheck-lite &' \;
wait
```

Use caching in CI:

```yaml
- name: Cache depcheck results
  uses: actions/cache@v3
  with:
    path: .depcheck-cache
    key: depcheck-${{ hashFiles('package.json') }}

- name: Check dependencies
  run: |
    if [ -f .depcheck-cache ]; then
      echo "Using cached result"
      cat .depcheck-cache
    else
      depcheck-lite | tee .depcheck-cache
    fi
```

## Best Practices

### 1. Run regularly, not just on commits

**Don't wait for problems to accumulate:**

```bash
# Weekly scheduled check (GitHub Actions)
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday

# Or local cron
0 9 * * 1 cd ~/projects/myapp && depcheck-lite
```

Dependencies become unused gradually as code evolves. Regular checks catch them early.

### 2. Use interactive mode for gradual cleanup

**Don't remove everything at once:**

```bash
# ❌ RISKY - Remove all at once
depcheck-lite --json | jq -r '.unused[]' | xargs npm uninstall

# ✅ SAFE - Review and remove gradually
depcheck-lite --interactive
# Select a few, test, repeat
```

Test after each removal:

```bash
npm uninstall lodash moment
npm test
npm run build
# If green, continue
```

### 3. Configure .depcheckrc.json per project

**Every project has unique false positives:**

```json
{
  "ignore": [
    // Framework core (false positive)
    "react",
    "vue",
    
    // Build tools (used in config)
    "vite",
    "webpack",
    
    // Types (no explicit imports)
    "@types/*",
    
    // Polyfills (injected by babel)
    "core-js",
    "@babel/runtime",
    
    // Your project-specific cases
    "dotenv"  // Loaded in index.js
  ],
  "dirs": ["src", "lib", "components"]
}
```

Commit this file so the team shares the configuration.

### 4. Separate production and dev dependencies

**Properly categorize dependencies:**

```json
{
  "dependencies": {
    // Runtime dependencies only
    "express": "^4.18.0",
    "axios": "^1.4.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    // Build tools
    "vite": "^4.3.0",
    "webpack": "^5.88.0",
    
    // Testing
    "vitest": "^0.34.0",
    "jest": "^29.5.0",
    
    // Linting
    "eslint": "^8.44.0",
    "prettier": "^3.0.0",
    
    // Types
    "@types/react": "^18.2.0",
    "@types/node": "^20.4.0"
  }
}
```

Then check separately:

```bash
# Production only (strict)
depcheck-lite --production

# Dev dependencies (can be lenient)
depcheck-lite --dev
```

### 5. Ignore framework-injected dependencies

**Some dependencies are used implicitly:**

```javascript
// React 17+ JSX transform
// You don't import React, but it's still needed
export default function App() {
  return <div>Hello</div>;  // React is used here!
}
```

Always ignore:
- JSX runtime (react, vue)
- Polyfills (core-js, regenerator-runtime)
- TypeScript runtime (tslib)
- Framework cores that inject themselves

### 6. Use --production in CI/CD

**Focus on what users will download:**

```yaml
# GitHub Actions
- name: Check production dependencies
  run: npx depcheck-lite --production

# This catches bloated production deps
# Don't ship webpack to production!
```

Separate checks for dev:

```yaml
- name: Check dev dependencies
  run: npx depcheck-lite --dev-only
  continue-on-error: true  # Warning only
```

### 7. Document why dependencies are ignored

**Future you will thank present you:**

```json
{
  "ignore": [
    // React: Used via JSX transform (no explicit import)
    "react",
    
    // dotenv: Loaded in server entry point
    // Used: server/index.js line 3
    "dotenv",
    
    // @types/node: Required by TypeScript
    // even though not directly imported
    "@types/node",
    
    // webpack: Used in webpack.config.js
    // TODO: Move to webpack.config.js imports
    "webpack"
  ]
}
```

### 8. Check before npm install, not after

**Prevent installing unused deps in the first place:**

```json
{
  "scripts": {
    "preinstall": "depcheck-lite || true",
    "postinstall": "depcheck-lite"
  }
}
```

Or use a pre-install hook:

```bash
# .git/hooks/pre-push
#!/bin/bash
if [ $(git diff origin/main package.json | wc -l) -gt 0 ]; then
  echo "📦 package.json changed, checking dependencies..."
  depcheck-lite
fi
```

### 9. Combine with bundle analyzers

**Unused deps might still bloat your bundle:**

```bash
# Check for unused
depcheck-lite

# Analyze bundle size
npm run build
npx vite-bundle-visualizer  # or webpack-bundle-analyzer

# Compare
du -sh node_modules/  # Total installed
du -sh dist/          # Actual bundle
```

Even "used" dependencies might be too big:

```bash
# lodash: 70KB (but you only use 3 functions!)
npm uninstall lodash
npm install lodash-es
# Import only what you need:
import { debounce, throttle } from 'lodash-es';
```

### 10. Create a dependencies.md document

**Track why each major dependency exists:**

```markdown
# Dependencies

## Production

- **express** (4.18.0) - Web server framework
  - Required for: API routes, middleware
  - Replacement candidate: Fastify (2x faster)
  
- **axios** (1.4.0) - HTTP client
  - Required for: External API calls
  - Alternative considered: fetch (native, but less features)

## Development

- **vite** (4.3.0) - Build tool
  - Required for: Fast dev server, HMR
  - 10x faster than webpack
  
- **vitest** (0.34.0) - Testing framework
  - Required for: Unit tests
  - Chosen over Jest for Vite integration
```

Review quarterly and update.

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
