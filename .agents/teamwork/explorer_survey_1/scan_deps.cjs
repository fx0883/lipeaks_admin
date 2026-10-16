const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const componentsDir = 'src/components';
const storeDir = 'src/store/modules';

const modules = [
  'admin-user', 'application', 'check-system', 'cms', 'customer',
  'dashboard', 'feedback', 'license', 'login', 'member',
  'menu', 'notification', 'order', 'permission', 'tenant', 'welcome', 'error'
];

function scanDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(scanDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const analysis = {};

modules.forEach(mod => {
  const vFiles = scanDir(path.join(viewsDir, mod));
  
  // 查找对应的 components
  const compDirs = fs.readdirSync(componentsDir).filter(c => {
    const normC = c.toLowerCase().replace(/management/g, '').replace(/-/g, '');
    const normM = mod.toLowerCase().replace(/-/g, '');
    return normC === normM || normC.includes(normM) || normM.includes(normC);
  });
  
  let cFiles = [];
  compDirs.forEach(cd => {
    cFiles = cFiles.concat(scanDir(path.join(componentsDir, cd)));
  });

  const allFiles = [...vFiles, ...cFiles];
  const imports = new Set();
  const elComponents = new Set();
  const pureComponents = new Set();
  const utils = new Set();
  const icons = new Set();

  allFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    // 提取 import
    const importMatches = content.matchAll(/import\s+(?:\{[\s\S]*?\}|[\w\s,*]+)\s+from\s+['"]([^'"]+)['"]/g);
    for (const m of importMatches) {
      const imp = m[1];
      imports.add(imp);
      if (imp.startsWith('@element-plus/icons-vue')) icons.add('ep-icons');
      if (imp.includes('iconify') || imp.includes('ReIcon')) icons.add('iconify/re-icon');
      if (imp.startsWith('@pureadmin/utils')) utils.add('@pureadmin/utils');
      if (imp.includes('echarts')) utils.add('echarts');
      if (imp.includes('dayjs')) utils.add('dayjs');
      if (imp.includes('vue-i18n') || imp.includes('@/plugins/i18n')) utils.add('i18n');
      if (imp.includes('diff')) utils.add('diff');
      if (imp.includes('file-saver')) utils.add('file-saver');
      if (imp.includes('jszip')) utils.add('jszip');
      if (imp.includes('sortablejs')) utils.add('sortablejs');
    }

    // 检查模板组件
    const tagMatches = content.matchAll(/<(el-[a-z0-9-]+|pure-[a-z0-9-]+|Re[A-Za-z0-9]+)/g);
    for (const t of tagMatches) {
      const tag = t[1];
      if (tag.startsWith('el-')) elComponents.add(tag);
      else pureComponents.add(tag);
    }
  });

  analysis[mod] = {
    viewFilesCount: vFiles.length,
    compFilesCount: cFiles.length,
    matchedComponents: compDirs,
    icons: Array.from(icons),
    utils: Array.from(utils),
    elComponentList: Array.from(elComponents).sort(),
    pureComponents: Array.from(pureComponents).sort(),
    externalImports: Array.from(imports).filter(i => !i.startsWith('.') && !i.startsWith('@/')).sort()
  };
});

fs.writeFileSync(
  path.join(__dirname, 'module_dependencies.json'),
  JSON.stringify(analysis, null, 2),
  'utf8'
);
console.log('Analysis finished. Written to module_dependencies.json');
