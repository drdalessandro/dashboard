const fs = require('fs');
const path = require('path');

// Configuration
const BASE_PATH = '/Users/muazcisse/dev-workspace/gandall-healthcare-platform/gandall-healthcare-dashboard/src/features';
const FEATURES = ['patients', 'practitioners'];
const IGNORE_PATTERNS = ['.DS_Store', '.bak', '.old', 'backup', 'test', '__tests__', '__mocks__'];

// Track all imports and exports
const importMap = new Map();
const exportMap = new Map();
const fileUsageMap = new Map();
const allFiles = new Set();

// Helper to check if path should be ignored
function shouldIgnore(filePath) {
    return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

// Extract imports from a file
function extractImports(filePath) {
    if (shouldIgnore(filePath)) return [];
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = [];
        
        // Match ES6 imports
        const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:[^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
}

// Extract exports from a file
function extractExports(filePath) {
    if (shouldIgnore(filePath)) return [];
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exports = [];
        
        // Match various export patterns
        const exportPatterns = [
            /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
            /export\s+\{([^}]+)\}/g,
            /export\s+\*\s+from/g
        ];
        
        exportPatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                if (match[1]) {
                    const names = match[1].split(',').map(n => n.trim());
                    exports.push(...names);
                }
            }
        });
        
        return exports;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
}

// Scan directory recursively
function scanDirectory(dirPath, featureName) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !shouldIgnore(fullPath)) {
            scanDirectory(fullPath, featureName);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
            if (!shouldIgnore(fullPath)) {
                const relativePath = path.relative(BASE_PATH, fullPath);
                allFiles.add(relativePath);
                
                // Track imports
                const imports = extractImports(fullPath);
                importMap.set(relativePath, imports);
                
                // Track exports
                const exports = extractExports(fullPath);
                exportMap.set(relativePath, exports);
                
                // Mark imported files as used
                imports.forEach(imp => {
                    if (!fileUsageMap.has(imp)) {
                        fileUsageMap.set(imp, new Set());
                    }
                    fileUsageMap.get(imp).add(relativePath);
                });
            }
        }
    });
}

// Analyze unused code
function analyzeUnusedCode() {
    console.log('=== Healthcare Platform Code Analysis ===\n');
    
    const unusedFiles = [];
    const possiblyUnused = [];
    const activeFiles = [];
    
    // Check each file for usage
    allFiles.forEach(file => {
        const importedBy = fileUsageMap.get(file) || new Set();
        const imports = importMap.get(file) || [];
        const exports = exportMap.get(file) || [];
        
        if (importedBy.size === 0 && !file.includes('index.ts') && !file.includes('page') && !file.includes('Page')) {
            if (exports.length > 0) {
                possiblyUnused.push({
                    file,
                    exports,
                    reason: 'File has exports but is never imported'
                });
            } else {
                unusedFiles.push({
                    file,
                    reason: 'File is never imported and has no exports'
                });
            }
        } else {
            activeFiles.push({
                file,
                importedBy: Array.from(importedBy),
                imports,
                exports
            });
        }
    });
    
    // Generate report
    const report = {
        summary: {
            totalFiles: allFiles.size,
            activeFiles: activeFiles.length,
            unusedFiles: unusedFiles.length,
            possiblyUnused: possiblyUnused.length
        },
        unusedFiles,
        possiblyUnused,
        activeFiles: activeFiles.slice(0, 10) // Show first 10 for brevity
    };
    
    return report;
}

// Main execution
console.log('Starting code analysis...\n');

FEATURES.forEach(feature => {
    const featurePath = path.join(BASE_PATH, feature);
    console.log(`Scanning ${feature} feature...`);
    scanDirectory(featurePath, feature);
});

const report = analyzeUnusedCode();

// Save report
fs.writeFileSync(
    path.join(path.dirname(BASE_PATH), 'unused-code-report.json'),
    JSON.stringify(report, null, 2)
);

// Print summary
console.log('\n=== Analysis Summary ===');
console.log(`Total files analyzed: ${report.summary.totalFiles}`);
console.log(`Active files: ${report.summary.activeFiles}`);
console.log(`Unused files: ${report.summary.unusedFiles}`);
console.log(`Possibly unused: ${report.summary.possiblyUnused}`);

console.log('\n=== Unused Files ===');
report.unusedFiles.forEach(({ file, reason }) => {
    console.log(`- ${file}: ${reason}`);
});

console.log('\n=== Possibly Unused Files ===');
report.possiblyUnused.forEach(({ file, reason }) => {
    console.log(`- ${file}: ${reason}`);
});

console.log('\n✓ Analysis complete. Full report saved to unused-code-report.json');
