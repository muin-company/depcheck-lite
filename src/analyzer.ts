import * as fs from 'fs';
import * as path from 'path';
import { AnalyzerOptions, AnalysisResult } from './types';

const DEFAULT_DIRS = ['src', 'lib', 'app', 'components', 'pages', 'utils'];
const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

export class DependencyAnalyzer {
  private options: AnalyzerOptions;
  private packageJson: any;
  
  constructor(options: AnalyzerOptions) {
    this.options = options;
    this.packageJson = this.loadPackageJson();
  }

  private loadPackageJson(): any {
    const pkgPath = path.join(this.options.cwd, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      throw new Error('package.json not found');
    }
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  }

  private getAllDependencies(): string[] {
    const deps = [
      ...Object.keys(this.packageJson.dependencies || {}),
      ...Object.keys(this.packageJson.devDependencies || {})
    ];
    
    // Filter out ignored packages
    if (this.options.ignore && this.options.ignore.length > 0) {
      return deps.filter(dep => !this.options.ignore!.includes(dep));
    }
    
    return deps;
  }

  private findSourceFiles(): string[] {
    const files: string[] = [];
    const dirs = this.options.dirs || DEFAULT_DIRS;
    
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (SOURCE_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    for (const dir of dirs) {
      const fullPath = path.join(this.options.cwd, dir);
      walk(fullPath);
    }
    
    return files;
  }

  private scanFileForDependencies(filePath: string): Set<string> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const found = new Set<string>();
    
    // Match import statements
    // import foo from 'package'
    // import { bar } from 'package'
    // import * as baz from 'package'
    const importRegex = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
    
    // Match require statements
    // require('package')
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    
    // Match dynamic imports
    // import('package')
    const dynamicImportRegex = /import\s*\(['"]([^'"]+)['"]\)/g;
    
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      found.add(this.extractPackageName(match[1]));
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
      found.add(this.extractPackageName(match[1]));
    }
    
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      found.add(this.extractPackageName(match[1]));
    }
    
    return found;
  }

  private extractPackageName(importPath: string): string {
    // Handle relative imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      return '';
    }
    
    // Handle scoped packages (@scope/package)
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath;
    }
    
    // Handle regular packages (package/subpath -> package)
    return importPath.split('/')[0];
  }

  public analyze(): AnalysisResult {
    const allDeps = this.getAllDependencies();
    const sourceFiles = this.findSourceFiles();
    
    const usedDeps = new Set<string>();
    
    for (const file of sourceFiles) {
      const deps = this.scanFileForDependencies(file);
      deps.forEach(dep => {
        if (dep && allDeps.includes(dep)) {
          usedDeps.add(dep);
        }
      });
    }
    
    const used = Array.from(usedDeps).sort();
    const unused = allDeps.filter(dep => !usedDeps.has(dep)).sort();
    
    return {
      unused,
      used,
      total: allDeps.length
    };
  }
}
