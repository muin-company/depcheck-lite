/**
 * Interactive mode for removing unused dependencies
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { spawn } from 'child_process';

export interface InteractiveOptions {
  unused: string[];
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

/**
 * Run interactive dependency removal
 */
export async function runInteractiveRemoval(options: InteractiveOptions): Promise<void> {
  const { unused, packageManager = 'npm' } = options;

  if (unused.length === 0) {
    console.log('✓ No unused dependencies to remove!');
    return;
  }

  console.log(`\nFound ${unused.length} unused dependencies:\n`);

  // Show list with indices
  unused.forEach((dep, index) => {
    console.log(`  ${index + 1}. ${dep}`);
  });

  console.log('\nSelect packages to remove:');
  console.log('  - Enter numbers separated by spaces (e.g., "1 3 5")');
  console.log('  - Enter "all" to remove all unused packages');
  console.log('  - Press Enter to cancel\n');

  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question('Your choice: ');
    rl.close();

    const selected = parseSelection(answer.trim(), unused.length);

    if (selected.length === 0) {
      console.log('\nCancelled. No packages removed.');
      return;
    }

    const packagesToRemove = selected.map(i => unused[i]);

    console.log(`\nRemoving ${packagesToRemove.length} package(s):`);
    packagesToRemove.forEach(pkg => console.log(`  - ${pkg}`));
    console.log('');

    // Confirm before removal
    const rl2 = readline.createInterface({ input, output });
    const confirm = await rl2.question('Proceed? (y/N): ');
    rl2.close();

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('\nCancelled. No packages removed.');
      return;
    }

    // Remove packages
    await removePackages(packagesToRemove, packageManager);

  } catch (error) {
    rl.close();
    throw error;
  }
}

/**
 * Parse user selection input
 */
function parseSelection(input: string, maxLength: number): number[] {
  if (!input) {
    return [];
  }

  if (input.toLowerCase() === 'all') {
    return Array.from({ length: maxLength }, (_, i) => i);
  }

  const indices: number[] = [];
  const parts = input.split(/[\s,]+/);

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 1 || num > maxLength) {
      console.warn(`Warning: Invalid selection "${part}" (must be 1-${maxLength})`);
      continue;
    }
    indices.push(num - 1); // Convert to 0-based index
  }

  // Remove duplicates and sort
  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * Remove packages using package manager
 */
async function removePackages(packages: string[], packageManager: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = getUninstallCommand(packageManager);
    const args = [...command, ...packages];

    console.log(`Running: ${packageManager} ${args.join(' ')}\n`);

    const child = spawn(packageManager, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✓ Successfully removed ${packages.length} package(s)`);
        resolve();
      } else {
        reject(new Error(`${packageManager} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to run ${packageManager}: ${error.message}`));
    });
  });
}

/**
 * Get uninstall command for package manager
 */
function getUninstallCommand(packageManager: string): string[] {
  switch (packageManager) {
    case 'npm':
      return ['uninstall', '--save'];
    case 'yarn':
      return ['remove'];
    case 'pnpm':
      return ['remove'];
    default:
      return ['uninstall', '--save'];
  }
}

/**
 * Detect package manager from lock files
 */
export function detectPackageManager(cwd: string): 'npm' | 'yarn' | 'pnpm' {
  const fs = require('fs');
  const path = require('path');

  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}
