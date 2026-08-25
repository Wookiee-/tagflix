#!/usr/bin/env node
// build-pkg.js — builds server.cjs into a standalone .exe using pkg
// server.cjs only uses Node.js built-ins (http, fs, path, child_process)
// so we don't need to bundle any node_modules.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST_APP = path.join(ROOT, 'dist-app');
const DIST = path.join(ROOT, 'dist');

console.log('[build] cleaning dist-app/...');
fs.rmSync(DIST_APP, { recursive: true, force: true });

console.log('[build] packaging server.cjs with pkg...');
execSync(
  'npx pkg server.cjs --targets node18-win-x64 --out-path dist-app',
  { cwd: ROOT, stdio: 'inherit' }
);

// pkg names the output after the entry file — rename to tagflix.exe
const srcExe = path.join(DIST_APP, 'server.exe');
const dstExe = path.join(DIST_APP, 'tagflix.exe');
if (fs.existsSync(srcExe) && srcExe !== dstExe) {
  fs.renameSync(srcExe, dstExe);
}

console.log('[build] copying dist/ into dist-app/...');
fs.cpSync(DIST, path.join(DIST_APP, 'dist'), { recursive: true });

const exeSize = fs.statSync(dstExe).size;
console.log(`[build] done! tagflix.exe: ${(exeSize / 1024 / 1024).toFixed(1)}MB`);
console.log('[build] ship the dist-app/ folder to users.');
