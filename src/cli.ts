#!/usr/bin/env node

import * as path from 'path';
import { DependencyAnalyzer } from './analyzer';

interface CliOptions {
  json?: boolean;
  ignore?: string[];
  dirs?: string[];
  cwd: string;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    cwd: process.cwd(),
    ignore: [],
    dirs: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--ignore') {
      const nextArg = args[++i];
      if (!nextArg) {
        console.error('--ignore requires a package name');
        process.exit(1);
      }
      options.ignore!.push(nextArg);
    } else if (arg === '--dirs') {
      const nextArg = args[++i];
      if (!nextArg) {
        console.error('--dirs requires directory names');
        process.exit(1);
      }
      options.dirs = nextArg.split(',');
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      options.cwd = path.resolve(arg);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
depcheck-lite - Find unused dependencies fast

Usage:
  depcheck-lite [path] [options]

Options:
  --json              Output results as JSON
  --ignore <package>  Ignore specific package (repeatable)
  --dirs <dirs>       Comma-separated list of directories to scan
  -h, --help          Show this help

Examples:
  depcheck-lite
  depcheck-lite ./my-project
  depcheck-lite --json
  depcheck-lite --ignore react --ignore lodash
  depcheck-lite --dirs src,lib,components
`);
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  try {
    const analyzer = new DependencyAnalyzer({
      cwd: options.cwd,
      ignore: options.ignore,
      dirs: options.dirs?.length ? options.dirs : undefined
    });

    const result = analyzer.analyze();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.unused.length === 0) {
        console.log('✓ No unused dependencies found!');
      } else {
        console.log(`Found ${result.unused.length} unused dependencies:\n`);
        result.unused.forEach(dep => {
          console.log(`  - ${dep}`);
        });
        console.log(`\nTotal: ${result.unused.length}/${result.total}`);
      }
    }

    // Exit with code 1 if unused dependencies found (CI-friendly)
    process.exit(result.unused.length > 0 ? 1 : 0);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

main();
