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
