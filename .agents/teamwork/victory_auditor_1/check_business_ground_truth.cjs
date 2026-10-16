const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const businessDir = path.join(repoRoot, 'docs/business-modules');

const modules = [
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

console.log('=== Business Modules Code Ground-Truth Checker ===');

let totalChecks = 0;
let passedChecks = 0;
let issues = [];

for (const mod of modules) {
  const filePath = path.join(businessDir, mod);
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`\nChecking [${mod}]...`);

  // Check 1: Find all paths mentioned like `src/...`
  const srcPathRegex = /src\/[a-zA-Z0-9_\-\.\/]+/g;
  const matchedPaths = new Set(content.match(srcPathRegex) || []);

  for (let p of matchedPaths) {
    // Strip trailing punctuation if any
    p = p.replace(/[.,:;`\)'">]+$/, '');
    // If it's a file pattern like src/api/modules/*.ts, check parent dir
    if (p.includes('*')) {
      const parentDir = path.dirname(p);
      const absPath = path.join(repoRoot, parentDir);
      totalChecks++;
      if (fs.existsSync(absPath)) {
        passedChecks++;
      } else {
        issues.push(`[${mod}] Wildcard base path does not exist: ${p} (tried: ${absPath})`);
      }
      continue;
    }

    const absPath = path.join(repoRoot, p);
    totalChecks++;
    // Might be file or directory, or .ts/.vue without extension
    if (fs.existsSync(absPath)) {
      passedChecks++;
    } else if (fs.existsSync(absPath + '.ts') || fs.existsSync(absPath + '.vue') || fs.existsSync(absPath + '.js')) {
      passedChecks++;
    } else {
      // Check if it's a directory
      if (fs.existsSync(path.dirname(absPath))) {
        // Maybe file doesn't exist, flag it
        issues.push(`[${mod}] Referenced path does not exist: ${p}`);
      } else {
        issues.push(`[${mod}] Referenced path & dir do not exist: ${p}`);
      }
    }
  }

  // Check 2: Verify primary views directory exists
  const modBaseName = mod.replace('.md', '');
  const viewsDir = path.join(repoRoot, 'src/views', modBaseName);
  totalChecks++;
  if (fs.existsSync(viewsDir)) {
    passedChecks++;
    console.log(`  - views directory src/views/${modBaseName}: EXISTS`);
  } else {
    issues.push(`[${mod}] Primary views directory src/views/${modBaseName} NOT FOUND!`);
  }
}

console.log('\n==================================================');
console.log(`Total Ground-Truth Path Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Issues Found: ${issues.length}`);

if (issues.length > 0) {
  console.log('\nDetailed Issues:');
  issues.forEach(i => console.log('  ' + i));
} else {
  console.log('\nALL referenced source paths in all 17 business modules verified successfully!');
}
