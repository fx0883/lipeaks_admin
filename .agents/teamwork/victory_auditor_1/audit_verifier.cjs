const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const docsDir = path.join(repoRoot, 'docs');
const businessDir = path.join(docsDir, 'business-modules');

console.log('=== Victory Audit: Independent Verification Script ===');
console.log('Repo root:', repoRoot);
console.log('Docs dir:', docsDir);

const requiredCoreDocs = [
  'README.md',
  'architecture.md',
  'routing-and-permissions.md',
  'state-management.md',
  'api-and-network.md',
  'engineering-and-deployment.md'
];

const requiredBusinessDocs = [
  'admin-user.md',
  'application.md',
  'check-system.md',
  'cms.md',
  'customer.md',
  'dashboard.md',
  'feedback.md',
  'license.md',
  'login.md',
  'member.md',
  'menu.md',
  'notification.md',
  'order.md',
  'permission.md',
  'tenant.md',
  'welcome.md',
  'error.md'
];

let errors = [];
let warnings = [];
let allDocs = [];

// 1. Check Document Inventory
console.log('\n--- 1. Document Inventory Check ---');
for (const doc of requiredCoreDocs) {
  const fullPath = path.join(docsDir, doc);
  if (!fs.existsSync(fullPath)) {
    errors.push(`[Missing Core Doc] ${doc} does not exist at ${fullPath}`);
  } else {
    const stat = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    console.log(`Core Doc [OK]: ${doc} (${stat.size} bytes, ${lines} lines)`);
    allDocs.push({ name: doc, path: fullPath, content, lines, size: stat.size, isCore: true });
  }
}

for (const doc of requiredBusinessDocs) {
  const fullPath = path.join(businessDir, doc);
  if (!fs.existsSync(fullPath)) {
    errors.push(`[Missing Business Doc] ${doc} does not exist at ${fullPath}`);
  } else {
    const stat = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    console.log(`Business Doc [OK]: business-modules/${doc} (${stat.size} bytes, ${lines} lines)`);
    allDocs.push({ name: `business-modules/${doc}`, path: fullPath, content, lines, size: stat.size, isCore: false });
  }
}

console.log(`Total Docs Verified: ${allDocs.length} / 23`);

// 2. Forensic Integrity & Anti-cheating Check
console.log('\n--- 2. Forensic Integrity & Anti-cheating Check ---');
const prohibitedPatterns = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bXXX\b/,
  /\[TBD\]/i,
  /占位符/,
  /待补充/,
  /待实现/,
  /未完成/
];

for (const doc of allDocs) {
  // Check minimum size
  if (doc.size < 2000) {
    errors.push(`[Facade Suspicion] ${doc.name} size is suspiciously small: ${doc.size} bytes`);
  }
  if (doc.lines < 50) {
    errors.push(`[Facade Suspicion] ${doc.name} lines is suspiciously small: ${doc.lines} lines`);
  }

  // Check prohibited placeholders line by line
  const lines = doc.content.split('\n');
  lines.forEach((line, idx) => {
    // Exclude markdown code comments or examples if they describe a real TODO in user code, but flag if it is doc's own placeholder
    for (const pattern of prohibitedPatterns) {
      if (pattern.test(line)) {
        // Check context: is it in a table describing a status, or is it actual doc placeholder?
        console.log(`[Pattern Match in ${doc.name}:${idx + 1}]: "${line.trim()}" matched ${pattern}`);
        // Let's flag as warning first to analyze context
        warnings.push(`[Pattern match] ${doc.name}:${idx + 1} matched ${pattern}: ${line.trim()}`);
      }
    }
  });

  // Check for empty sections (e.g. "## header\n\n## next_header")
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('#') && lines[i + 1].startsWith('#')) {
      errors.push(`[Empty Section] ${doc.name}:${i + 1} empty heading followed immediately by another heading`);
    }
  }
}

// 3. Link and Anchor Validation
console.log('\n--- 3. Link & Anchor Validation ---');
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extractHeadings(content) {
  const headings = new Set();
  const rawHeadings = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      const headingText = match[1].trim();
      rawHeadings.push(headingText);
      headings.add(slugify(headingText));
      headings.add(headingText.toLowerCase().replace(/\s+/g, '-'));
      headings.add(encodeURIComponent(headingText.toLowerCase().replace(/\s+/g, '-')));
    }
  }
  return { headings, rawHeadings };
}

// Map each doc to its heading slug set
const docHeadings = new Map();
for (const doc of allDocs) {
  docHeadings.set(doc.path, extractHeadings(doc.content));
}

let totalLinks = 0;
let validLinks = 0;

for (const doc of allDocs) {
  // Match markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(doc.content)) !== null) {
    const linkText = match[1];
    let linkTarget = match[2].trim();
    totalLinks++;

    // Skip external links (http/https/mailto)
    if (linkTarget.startsWith('http://') || linkTarget.startsWith('https://') || linkTarget.startsWith('mailto:')) {
      validLinks++;
      continue;
    }

    // Split target into file and anchor
    let [targetPath, anchor] = linkTarget.split('#');
    let resolvedFilePath = doc.path;

    if (targetPath && targetPath.length > 0) {
      resolvedFilePath = path.resolve(path.dirname(doc.path), targetPath);
    }

    if (!fs.existsSync(resolvedFilePath)) {
      errors.push(`[Broken Link in ${doc.name}] Target file does not exist: "${linkTarget}" (resolved: ${resolvedFilePath})`);
      continue;
    }

    if (anchor) {
      const targetHeadingInfo = docHeadings.get(resolvedFilePath);
      if (targetHeadingInfo) {
        const decodedAnchor = decodeURIComponent(anchor).toLowerCase();
        const slugAnchor = slugify(decodedAnchor);
        const hasAnchor = targetHeadingInfo.headings.has(anchor) ||
                          targetHeadingInfo.headings.has(decodedAnchor) ||
                          targetHeadingInfo.headings.has(slugAnchor) ||
                          targetHeadingInfo.rawHeadings.some(h => slugify(h) === slugAnchor || h.toLowerCase() === decodedAnchor);
        if (!hasAnchor) {
          warnings.push(`[Unmatched Anchor in ${doc.name}] Anchor "#${anchor}" not strictly found in ${path.relative(repoRoot, resolvedFilePath)} (Target headings: ${targetHeadingInfo.rawHeadings.slice(0, 5).join(', ')}...)`);
        }
      }
    }

    validLinks++;
  }
}
console.log(`Link Validation Summary: Checked ${totalLinks} links, ${validLinks} valid`);

// 4. Mermaid Diagram Validation
console.log('\n--- 4. Mermaid Diagram Validation ---');
let totalMermaid = 0;
for (const doc of allDocs) {
  const mermaidRegex = /```mermaid([\s\S]*?)```/g;
  let match;
  while ((match = mermaidRegex.exec(doc.content)) !== null) {
    totalMermaid++;
    const code = match[1].trim();
    const firstLine = code.split('\n')[0].trim();
    
    // Check valid diagram type
    const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'stateDiagram', 'stateDiagram-v2', 'classDiagram', 'erDiagram', 'pie', 'gantt', 'journey', 'gitGraph'];
    const hasValidType = validTypes.some(t => firstLine.startsWith(t));
    if (!hasValidType) {
      errors.push(`[Invalid Mermaid Type in ${doc.name}] Header line: "${firstLine}"`);
    }

    // Basic bracket balancing check
    const openSquare = (code.match(/\[/g) || []).length;
    const closeSquare = (code.match(/\]/g) || []).length;
    const openRound = (code.match(/\(/g) || []).length;
    const closeRound = (code.match(/\)/g) || []).length;
    const openCurly = (code.match(/\{/g) || []).length;
    const closeCurly = (code.match(/\}/g) || []).length;

    if (openSquare !== closeSquare) {
      errors.push(`[Mermaid Syntax in ${doc.name}] Unbalanced square brackets: [ ${openSquare} vs ] ${closeSquare} in diagram starting with "${firstLine}"`);
    }
    if (openRound !== closeRound) {
      errors.push(`[Mermaid Syntax in ${doc.name}] Unbalanced parentheses: ( ${openRound} vs ) ${closeRound} in diagram starting with "${firstLine}"`);
    }
    if (openCurly !== closeCurly) {
      errors.push(`[Mermaid Syntax in ${doc.name}] Unbalanced curly brackets: { ${openCurly} vs } ${closeCurly} in diagram starting with "${firstLine}"`);
    }
  }
}
console.log(`Total Mermaid Diagrams Analyzed: ${totalMermaid}`);

console.log('\n==================================================');
console.log(`Verification Errors: ${errors.length}`);
console.log(`Verification Warnings: ${warnings.length}`);
if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log('  - ' + e));
}
if (warnings.length > 0) {
  console.log('\nWARNINGS:');
  warnings.forEach(w => console.log('  - ' + w));
}
