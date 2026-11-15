import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Mechanically synchronizes the verified `verdant-wasm.wasm` 3D engine binary from
 * `verdant-engine` (`../verdant-engine/site/verdant-wasm.wasm`) into
 * `public/wasm/verdant_engine.wasm` with SHA-256 provenance metadata.
 */

const projectRoot = process.cwd();
const defaultSource = path.resolve(projectRoot, '..', 'verdant-engine', 'site', 'verdant-wasm.wasm');
const targetDir = path.join(projectRoot, 'public', 'wasm');
const targetWasm = path.join(targetDir, 'verdant_engine.wasm');
const targetMeta = path.join(targetDir, 'verdant_engine_meta.json');

const srcPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultSource;
if (!fs.existsSync(srcPath)) {
  if (fs.existsSync(targetWasm)) {
    console.log(`[syncVerdantEngine] Source ${srcPath} not present; keeping committed ${targetWasm}.`);
    process.exit(0);
  }
  console.error(`[syncVerdantEngine] Missing verdant-wasm binary at ${srcPath}`);
  process.exit(1);
}

const wasmBytes = fs.readFileSync(srcPath);
if (wasmBytes.length < 8 || wasmBytes.subarray(0, 4).toString('binary') !== '\0asm') {
  throw new Error(`[syncVerdantEngine] Invalid WebAssembly magic header in ${srcPath}`);
}

const sha256 = crypto.createHash('sha256').update(wasmBytes).digest('hex');
fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetWasm, wasmBytes);

const meta = {
  schema: 'verdant-resonance/engine-substrate-meta/1',
  enginePackage: 'verdant-wasm',
  upstreamRepository: 'https://github.com/afflom/verdant-engine',
  wasmRelativePath: 'wasm/verdant_engine.wasm',
  wasmBytes: wasmBytes.length,
  wasmSha256: sha256,
};
fs.writeFileSync(targetMeta, `${JSON.stringify(meta, null, 2)}\n`);
console.log(
  `[syncVerdantEngine] Synced ${targetWasm} (${wasmBytes.length} bytes, sha256=${sha256.slice(0, 16)}…)`,
);
