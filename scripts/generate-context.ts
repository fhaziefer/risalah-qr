import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = 'ai_context';
const ROOT_DIR = '.';

// 1. Konfigurasi
const PRUNE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'coverage', 'tmp', '.turbo', 'build'
]);

const EXCLUDE_EXTENSIONS = [
  '.DS_Store', '.env', '.env.local', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.tsbuildinfo', '.png', '.jpg', '.jpeg', '.ico', '.svg', '.webp', '.gif',
  '.mp4', '.mov', '.pdf'
];

// Helper: Format Timestamp (YYYY-MM-DD_HH-MM-SS)
const getTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

const TIMESTAMP = getTimestamp();

// 2. Helpers
const shouldExcludeFile = (filename: string) => {
  return EXCLUDE_EXTENSIONS.some((ext) => filename.endsWith(ext));
};

const walkSync = (dir: string, fileList: string[] = []): string[] => {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      if (!PRUNE_DIRS.has(file)) {
        walkSync(filepath, fileList);
      }
    } else {
      if (!shouldExcludeFile(file)) {
        fileList.push(filepath);
      }
    }
  }
  return fileList;
};

const dumpPaths = (outputFile: string, paths: string[], filterOutSpecs: boolean = false, onlySpecs: boolean = false) => {
  console.log(`📦 Generating ${outputFile} ...`);
  const outputPath = path.join(OUT_DIR, outputFile);
  let content = '<context_dump>\n';

  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    const stat = fs.statSync(p);

    if (stat.isDirectory()) {
      const files = walkSync(p);
      for (const f of files) {
        const isSpec = f.endsWith('.spec.ts') || f.endsWith('.e2e-spec.ts');
        if (filterOutSpecs && isSpec) continue;
        if (onlySpecs && !isSpec) continue;

        content += `\n<file path="${f}">\n${fs.readFileSync(f, 'utf8')}\n</file>\n`;
      }
    } else {
      content += `\n<file path="${p}">\n${fs.readFileSync(p, 'utf8')}\n</file>\n`;
    }
  }

  content += '</context_dump>\n';
  fs.writeFileSync(outputPath, content);
};

// 3. Eksekusi Utama
console.log(`🧹 Resetting output dir: ${OUT_DIR}`);
if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// =========================
// A) Struktur Folder (Tree)
// =========================
console.log('🌳 Generating context_tree.txt...');
try {
  const treeIgnore = Array.from(PRUNE_DIRS).join('|') + '|*.lock|*.tsbuildinfo|.env*';
  const treeCmd = `tree -a -I "${treeIgnore}" ${ROOT_DIR}`;
  const treeOutput = execSync(treeCmd).toString();
  fs.writeFileSync(path.join(OUT_DIR, `${TIMESTAMP}_context_tree.txt`), `<project_structure>\n${treeOutput}\n</project_structure>`);
} catch (e) {
  fs.writeFileSync(path.join(OUT_DIR, `${TIMESTAMP}_context_tree.txt`), `<project_structure>\nCatatan: Command 'tree' tidak ditemukan di OS ini.\n</project_structure>`);
}

// =========================
// B) Konfigurasi Core NestJS
// =========================
dumpPaths(`${TIMESTAMP}_context_core.txt`, [
  'package.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'nest-cli.json',
  '.eslintrc.js',
  'eslint.config.js',
  'src/main.ts'
]);

// =========================
// C) Database / ORM (Jika pakai Prisma/TypeORM)
// =========================
dumpPaths(`${TIMESTAMP}_context_db.txt`, ['prisma', 'src/database']);

// =========================
// D) Modul, Controller, Service (Abaikan file test)
// =========================
dumpPaths(`${TIMESTAMP}_context_logic.txt`, ['src'], true, false);

// =========================
// E) File Testing (.spec.ts & folder test)
// =========================
// Ambil semua .spec.ts dari src, dan seluruh folder e2e/test
dumpPaths(`${TIMESTAMP}_context_tests.txt`, ['src', 'test'], false, true);

console.log('\n✅ DONE. File berhasil dibuat di folder: ' + OUT_DIR);