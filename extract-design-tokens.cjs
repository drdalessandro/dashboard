const fs = require('fs');
const path = require('path');

// Function to extract CSS variables from HTML content
function extractCSSVariables(content) {
  const rootMatch = content.match(/:root\s*{([^}]*)}/s);
  const variables = {};
  
  if (rootMatch) {
    const variableMatches = rootMatch[1].matchAll(/--([^:]+):\s*([^;]+);/g);
    for (const match of variableMatches) {
      const varName = match[1].trim();
      const varValue = match[2].trim();
      variables[varName] = varValue;
    }
  }
  
  return variables;
}

// Function to extract Tailwind classes
function extractTailwindClasses(content) {
  const classPattern = /class="([^"]*)"/g;
  const classes = new Set();
  let match;
  
  while ((match = classPattern.exec(content)) !== null) {
    const classString = match[1];
    classString.split(' ').forEach(cls => {
      if (cls.trim()) classes.add(cls.trim());
    });
  }
  
  return Array.from(classes).sort();
}

// Function to extract component patterns
function extractComponentPatterns(content) {
  const patterns = {
    buttons: [],
    inputs: [],
    cards: [],
    tables: [],
    badges: []
  };
  
  // Extract button patterns
  const buttonPattern = /<button[^>]*class="([^"]*)"[^>]*>/g;
  let match;
  while ((match = buttonPattern.exec(content)) !== null) {
    patterns.buttons.push(match[1]);
  }
  
  // Extract input patterns
  const inputPattern = /<input[^>]*class="([^"]*)"[^>]*>/g;
  while ((match = inputPattern.exec(content)) !== null) {
    patterns.inputs.push(match[1]);
  }
  
  // Extract card/container patterns
  const cardPattern = /class="([^"]*(?:card|container|box)[^"]*)"/g;
  while ((match = cardPattern.exec(content)) !== null) {
    patterns.cards.push(match[1]);
  }
  
  return patterns;
}

// Main extraction function
function analyzeHTMLFiles() {
  const visualsDir = path.join(__dirname, 'visuals');
  const files = fs.readdirSync(visualsDir).filter(f => f.endsWith('.html'));
  
  const analysis = {
    cssVariables: {},
    tailwindClasses: new Set(),
    componentPatterns: {},
    typography: {
      fonts: [],
      sizes: [],
      weights: []
    },
    spacing: new Set(),
    colors: new Set(),
    files: []
  };
  
  files.forEach(file => {
    console.log(`Analyzing ${file}...`);
    const content = fs.readFileSync(path.join(visualsDir, file), 'utf8');
    
    // Extract CSS variables
    const variables = extractCSSVariables(content);
    Object.assign(analysis.cssVariables, variables);
    
    // Extract Tailwind classes
    const classes = extractTailwindClasses(content);
    classes.forEach(cls => analysis.tailwindClasses.add(cls));
    
    // Extract component patterns
    const patterns = extractComponentPatterns(content);
    
    analysis.files.push({
      name: file,
      variables,
      patterns,
      classCount: classes.length
    });
  });
  
  // Convert sets to arrays for JSON output
  analysis.tailwindClasses = Array.from(analysis.tailwindClasses).sort();
  
  // Extract specific patterns
  analysis.tailwindClasses.forEach(cls => {
    // Extract spacing values
    const spacingMatch = cls.match(/^(p|m|gap|space)-(x|y|t|b|l|r)?-?(\d+)$/);
    if (spacingMatch) {
      analysis.spacing.add(spacingMatch[3]);
    }
    
    // Extract text sizes
    const textSizeMatch = cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$/);
    if (textSizeMatch) {
      analysis.typography.sizes.push(textSizeMatch[1]);
    }
    
    // Extract font weights
    const fontWeightMatch = cls.match(/^font-(light|normal|medium|semibold|bold)$/);
    if (fontWeightMatch) {
      analysis.typography.weights.push(fontWeightMatch[1]);
    }
    
    // Extract color classes
    const colorMatch = cls.match(/^(text|bg|border)-(primary|secondary|error|warning|success|copy|foreground|background)/);
    if (colorMatch) {
      analysis.colors.add(colorMatch[2]);
    }
  });
  
  // Convert sets to arrays
  analysis.spacing = Array.from(analysis.spacing).sort((a, b) => parseInt(a) - parseInt(b));
  analysis.colors = Array.from(analysis.colors).sort();
  analysis.typography.sizes = [...new Set(analysis.typography.sizes)];
  analysis.typography.weights = [...new Set(analysis.typography.weights)];
  
  return analysis;
}

// Run analysis
console.log('Starting design token extraction...');
const results = analyzeHTMLFiles();

// Save results
fs.writeFileSync(
  path.join(__dirname, 'design-tokens-extraction.json'),
  JSON.stringify(results, null, 2)
);

console.log('\nExtraction complete! Results saved to design-tokens-extraction.json');
console.log('\nSummary:');
console.log(`- Analyzed ${results.files.length} files`);
console.log(`- Found ${Object.keys(results.cssVariables).length} CSS variables`);
console.log(`- Found ${results.tailwindClasses.length} unique Tailwind classes`);
console.log(`- Extracted ${results.spacing.length} spacing values`);
console.log(`- Extracted ${results.colors.length} color patterns`);
