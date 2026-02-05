import * as assert from 'assert';
import * as path from 'path';
import { test } from 'node:test';
import { DependencyAnalyzer } from '../analyzer';

// Fixtures are in src/test/fixtures, need to reference from dist
const fixturesPath = path.join(__dirname, '../../src/test/fixtures');

test('detects unused dependencies in simple project', () => {
  const analyzer = new DependencyAnalyzer({
    cwd: path.join(fixturesPath, 'simple')
  });
  
  const result = analyzer.analyze();
  
  assert.strictEqual(result.unused.includes('lodash'), true, 'lodash should be unused');
  assert.strictEqual(result.unused.includes('jest'), true, 'jest should be unused');
  assert.strictEqual(result.unused.includes('typescript'), true, 'typescript should be unused');
  assert.strictEqual(result.used.includes('express'), true, 'express should be used');
  assert.strictEqual(result.total, 4);
});

test('handles scoped packages correctly', () => {
  const analyzer = new DependencyAnalyzer({
    cwd: path.join(fixturesPath, 'scoped')
  });
  
  const result = analyzer.analyze();
  
  assert.strictEqual(result.used.includes('@types/node'), true, '@types/node should be used');
  assert.strictEqual(result.unused.includes('react'), true, 'react should be unused');
});

test('detects require() statements', () => {
  const analyzer = new DependencyAnalyzer({
    cwd: path.join(fixturesPath, 'require')
  });
  
  const result = analyzer.analyze();
  
  assert.strictEqual(result.used.includes('fs-extra'), true, 'fs-extra should be used');
  assert.strictEqual(result.unused.includes('axios'), true, 'axios should be unused');
});

test('handles subpath imports correctly', () => {
  const analyzer = new DependencyAnalyzer({
    cwd: path.join(fixturesPath, 'subpath')
  });
  
  const result = analyzer.analyze();
  
  assert.strictEqual(result.used.includes('lodash'), true, 'lodash should be detected from subpath import');
});

test('handles empty dependencies', () => {
  const analyzer = new DependencyAnalyzer({
    cwd: path.join(fixturesPath, 'empty')
  });
  
  const result = analyzer.analyze();
  
  assert.strictEqual(result.unused.length, 0);
  assert.strictEqual(result.used.length, 0);
  assert.strictEqual(result.total, 0);
});

test('respects ignore option', () => {
  const analyzer = new DependencyAnalyzer({
    cwd: path.join(fixturesPath, 'simple'),
    ignore: ['lodash', 'jest']
  });
  
  const result = analyzer.analyze();
  
  assert.strictEqual(result.unused.includes('lodash'), false, 'lodash should be ignored');
  assert.strictEqual(result.unused.includes('jest'), false, 'jest should be ignored');
  assert.strictEqual(result.total, 2); // Only express and typescript counted
});
