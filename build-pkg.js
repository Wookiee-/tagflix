#!/usr/bin/env node
// build-pkg.js — builds server.cjs into a standalone .exe using pkg
// then patches the PE header from CONSOLE to GUI subsystem so no
// console window appears on launch.

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

// ─── Patch PE header: CONSOLE (3) → GUI (2) ───
// This tells Windows not to create a console window for this exe.
console.log('[build] patching PE header (CONSOLE → GUI)...');
const buf = fs.readFileSync(dstExe);

// Find PE signature offset at DOS header 0x3C
const peOffset = buf.readUInt32LE(0x3C);
// Optional header starts at peOffset + 24 (4-byte sig + 20-byte COFF header)
const optionalHeaderOffset = peOffset + 24;
// Magic at optional header start: 0x20B = PE32+, 0x10B = PE32
const magic = buf.readUInt16LE(optionalHeaderOffset);
const subsystemOffset = optionalHeaderOffset + 68; // subsystem is at +68 in both PE32 and PE32+

if (magic === 0x20B || magic === 0x10B) {
  const currentSubsystem = buf.readUInt16LE(subsystemOffset);
  console.log(`[build] PE subsystem: ${currentSubsystem} (3=CONSOLE, 2=GUI)`);
  if (currentSubsystem === 3) {
    buf.writeUInt16LE(2, subsystemOffset); // IMAGE_SUBSYSTEM_WINDOWS_GUI
    fs.writeFileSync(dstExe, buf);
    console.log('[build] patched to GUI — no console window on launch');
  } else {
    console.log('[build] already GUI or unknown subsystem, skipping');
  }
} else {
  console.log(`[build] unexpected PE magic: 0x${magic.toString(16)}, skipping patch`);
}

// Copy dist/ into dist-app/
console.log('[build] copying dist/ into dist-app/...');
fs.cpSync(DIST, path.join(DIST_APP, 'dist'), { recursive: true });

const exeSize = fs.statSync(dstExe).size;
console.log(`[build] done! tagflix.exe: ${(exeSize / 1024 / 1024).toFixed(1)}MB`);
console.log('[build] ship the dist-app/ folder to users.');
console.log('[build] users double-click tagflix.exe — no console, no VBS needed.');
