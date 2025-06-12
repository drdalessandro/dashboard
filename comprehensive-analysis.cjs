const fs = require('fs');
const path = require('path');

// Configuration
const SRC_PATH = '/Users/muazcisse/dev-workspace/gandall-healthcare-platform/gandall-healthcare-dashboard/src';
const FEATURES_PATH = path.join(SRC_PATH, 'features');
const FEATURES = ['patients', 'practitioners'];
const IGNORE_PATTERNS = ['.DS_Store', '.bak', '.old', 'backup', 'test', '__tests__', '__mocks__', 'node_modules'];

// Track all imports across the entire src directory
const globalImportMap = new Map();
const featureFiles = new Set();

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
        
        // Match ES6 imports - improved regex
        const importPatterns = [
            /import\s+(?:(?:\{[^}]*\})|(?:[^{}\s]+)|(?:\*\s+as\s+\w+))\s+from\s+['"]([^'"]+)['"]/g,
            /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // Dynamic imports
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /export\s+.*?\s+from\s+['"]([^'"]+)['"]/g // Re-exports
        ];
        
        importPatterns.forEach(regex => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                imports.push(match[1]);
            }
        });
        
        return imports;
    } catch (error) {
        return [];
    }
}

// Check if a file path is a feature file
function isFeatureFile(filePath) {
    return FEATURES.some(feature => filePath.includes(`/features/${feature}/`));
}

// Scan directory recursively
function scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !shouldIgnore(fullPath)) {
            scanDirectory(fullPath);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
            if (!shouldIgnore(fullPath)) {
                const imports = extractImports(fullPath);
                
                // Track which feature files are imported
                imports.forEach(imp => {
                    // Check if import references a feature file
                    FEATURES.forEach(feature => {
                        if (imp.includes(`features/${feature}`) || imp.includes(`@/features/${feature}`)) {
                            // Extract the actual file path from the import
                            let resolvedPath = imp;
                            if (imp.startsWith('@/')) {
                                resolvedPath = imp.replace('@/', '');
                            } else if (imp.startsWith('./') || imp.startsWith('../')) {
                                resolvedPath = path.resolve(path.dirname(fullPath), imp);
                                resolvedPath = path.relative(SRC_PATH, resolvedPath);
                            }
                            
                            if (!globalImportMap.has(resolvedPath)) {
                                globalImportMap.set(resolvedPath, new Set());
                            }
                            globalImportMap.get(resolvedPath).add(path.relative(SRC_PATH, fullPath));
                        }
                    });
                });
                
                // Track feature files
                if (isFeatureFile(fullPath)) {
                    const relativePath = path.relative(FEATURES_PATH, fullPath);
                    featureFiles.add(relativePath);
                }
            }
        }
    });
}

// Check if a file is actually used
function isFileUsed(featureFile) {
    // Check various import patterns
    const patterns = [
        featureFile,
        featureFile.replace('.tsx', ''),
        featureFile.replace('.ts', ''),
        `features/${featureFile}`,
        `@/features/${featureFile}`,
        featureFile.replace('.tsx', '/index'),
        featureFile.replace('.ts', '/index')
    ];
    
    for (const pattern of patterns) {
        if (globalImportMap.has(pattern)) {
            return true;
        }
        // Check if pattern is part of any import
        for (const [imp, importers] of globalImportMap) {
            if (imp.includes(pattern) || pattern.includes(imp)) {
                return true;
            }
        }
    }
    
    // Check if it's a page file (pages are often used by routing)
    if (featureFile.includes('/pages/') || featureFile.includes('Page.tsx')) {
        return true;
    }
    
    // Check if it's an index file (often used for exports)
    if (featureFile.endsWith('index.ts') || featureFile.endsWith('index.tsx')) {
        return true;
    }
    
    return false;
}

// Main execution
console.log('Starting comprehensive code analysis...\n');
console.log('Scanning entire src directory for imports...');
scanDirectory(SRC_PATH);

console.log(`Found ${featureFiles.size} feature files`);
console.log(`Found ${globalImportMap.size} imports referencing feature files\n`);

// Analyze unused files
const unusedFiles = [];
const usedFiles = [];

featureFiles.forEach(file => {
    if (!isFileUsed(file)) {
        unusedFiles.push(file);
    } else {
        usedFiles.push(file);
    }
});

// Generate detailed report
const report = {
    summary: {
        totalFeatureFiles: featureFiles.size,
        usedFiles: usedFiles.length,
        unusedFiles: unusedFiles.length
    },
    unusedFiles: unusedFiles.sort(),
    usedFiles: usedFiles.sort()
};

// Save report
fs.writeFileSync(
    path.join(path.dirname(SRC_PATH), 'comprehensive-unused-report.json'),
    JSON.stringify(report, null, 2)
);

// Print summary
console.log('=== Comprehensive Analysis Results ===');
console.log(`Total feature files: ${report.summary.totalFeatureFiles}`);
console.log(`Used files: ${report.summary.usedFiles}`);
console.log(`Unused files: ${report.summary.unusedFiles}`);

console.log('\n=== Unused Files to Move to Backup ===');
report.unusedFiles.forEach(file => {
    console.log(`- ${file}`);
});

console.log('\n✓ Analysis complete. Report saved to comprehensive-unused-report.json');
