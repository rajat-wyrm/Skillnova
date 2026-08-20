// ════════════════════════════════════════════════════════════
//  Create P2P Update ZIP Script
// ════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('📦 Creating Peer-to-Peer Update Zip Packages...');

// Temporary staging directory
const stageDir = path.join(rootDir, '.p2p-staging');
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Helper to copy directory recursively with ignore filter
function copyDir(src, dest, ignorePatterns = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (ignorePatterns.some((pattern) => entry.name === pattern || entry.name.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, ignorePatterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy src
console.log('Copying src/ ...');
copyDir(path.join(rootDir, 'src'), path.join(stageDir, 'src'), ['node_modules', '.git']);

// 2. Copy server (excluding node_modules, .env, uploads, logs)
console.log('Copying server/ ...');
copyDir(path.join(rootDir, 'server'), path.join(stageDir, 'server'), [
  'node_modules',
  '.env',
  'uploads',
  '.git',
  '.tmp',
]);

// 3. Create zip files using PowerShell Compress-Archive
const zipName = 'skillnova-p2p-update.zip';
const outZipPath = path.join(rootDir, zipName);
const parentZipPath = path.join(path.dirname(rootDir), zipName);

// Also create in user's Downloads folder if accessible
const homeDir = process.env.USERPROFILE || process.env.HOME || '';
const downloadsDir = path.join(homeDir, 'Downloads');
const downloadsZipPath = path.join(downloadsDir, zipName);

try {
  // Compress staging directory contents
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${outZipPath}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${outZipPath}`);

  // Copy to parent folder
  fs.copyFileSync(outZipPath, parentZipPath);
  console.log(`✅ Copied to: ${parentZipPath}`);

  if (fs.existsSync(downloadsDir)) {
    fs.copyFileSync(outZipPath, downloadsZipPath);
    console.log(`✅ Copied to Downloads: ${downloadsZipPath}`);
  }
} catch (err) {
  console.error('Error creating archive:', err.message);
} finally {
  // Cleanup staging dir
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

console.log('🎉 P2P Zip Package creation complete!');
