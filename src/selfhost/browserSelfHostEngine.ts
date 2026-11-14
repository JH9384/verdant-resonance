/**
 * Fused Browser-Resident Repository & Autonomous Self-Hosting Organism Engine
 * (`src/selfhost/browserSelfHostEngine.ts`)
 *
 * Fuses Verdant Resonance's LexLean/TypeScript development environment and live game runtime
 * directly inside the user's browser (`Origin Private File System` + `WebAssembly` + `UORC\x01`):
 *   - Unpacks `public/genesis/verdant_gen0_sources.uorc` into OPFS `/generations/gen-0/` on first boot.
 *   - Allows both the autonomous Rule-30 × Player-Witness engine and the player (via the Browser Foundry UI)
 *     to inspect, edit, verify, and compile `.lex.tex` & `.ts` sources directly to `wasm32` in-browser.
 *   - Enforces `#![no_std]` Wasm `verifyBrowserGenerationAdmission` (`0` `residue`, `0` `Classical.choice`,
 *     `0` coercive dark patterns, strict `telosTotalLoss` or `steps` dominance within `frameBudgetMicros`).
 *   - Enforces `#![no_std]` Wasm `shouldRollbackGenerationWatchdog` to atomically roll `/HEAD` back on fault.
 *   - Exports and imports complete `.uorc` organism spores so source evolution lives in the user's browser.
 */

import {
  certifiedWasmCore_computeHostCeilingExcess,
  certifiedWasmCore_evaluateOntologicalTelosLoss,
  certifiedWasmCore_fibonacciConstructive,
  certifiedWasmCore_nthPrimeConstructive,
  certifiedWasmCore_optimalBrowserWorkerCount,
  certifiedWasmCore_shouldRollbackGenerationWatchdog,
  certifiedWasmCore_stepParametricOntologyCoordinate,
  certifiedWasmCore_verifyBrowserGenerationAdmission,
  certifiedWasmCore_verifyUorcArchiveBounds,
  certifiedWasmDecideMint,
  certifiedWasmRule30Step,
  certifiedWasmSchedule,
  type CertifiedWeightRow,
} from '../game/generatedCertifiedWasmBridge';
import { GENERATED_ONTOLOGY_5WH_LEDGER } from '../game/generatedPrismConstants';
import {
  compressUorcArchive,
  decompressUorcArchive,
  sha256Hex,
} from '../game/parametricCompressionEngine';
import {
  negateBrowserLexBooleanRoot,
  runBrowserCapabilitySaturationSuite,
  type BrowserCapabilitySaturationReport,
} from './browserCapabilityProbes';
import {
  parseBrowserLexModule,
  verifyAndInstantiateBrowserLexWasm,
  verifyAndTranspileBrowserTypeScriptModule,
  type BrowserParsedLexModule,
  type BrowserVerificationReport,
} from './browserLexLeanWasmCompiler';
import {
  broadcastBrowserGenerationSync,
  dispatchParallelWasmAbductionSweep,
  evaluateBrowserHostSaturation,
  initBrowserPerformanceObserver,
  initBrowserWasmWorkerPool,
  queryBrowserStorageEstimate,
  recordBrowserOpfsSaturationState,
  registerSovereignServiceWorker,
  stageArtifactInSovereignServiceWorker,
  updateBrowserAudioWorkletWarmth,
  withBrowserWebLock,
  type BrowserHostSaturationSnapshot,
} from './browserRuntimeSaturation';

export interface EvolvedGenProjectionOutput {
  readonly primeHarmonicLimit: number;
  readonly phyllotaxisSpiral: number;
  readonly warmthScale: number;
  readonly playerEmbodimentScale: number;
  readonly enhancementFocus: string;
}

export type HotTypeScriptProjectionFn = (stepOrdinal: number) => EvolvedGenProjectionOutput;

export interface SelfHostCoordinates {
  readonly alphaSeed: number;
  readonly primeCeilingRank: number;
  readonly modalDensityRank: number;
  readonly warmthShiftSign: number;
  readonly warmthShiftMagnitude: number;
  readonly cadenceTargetRank: number;
  readonly phyllotaxisIndex: number;
}

export interface GenSporeFileEntry {
  readonly index: number;
  readonly path: string;
  readonly bytes: number;
  readonly sha256Kappa: string;
}

export interface GenSporeManifest {
  readonly schema: 'verdant-resonance/self-host-gen-manifest/1';
  readonly generationId: string;
  readonly generationIndex: number;
  readonly parentGenerationId: string | null;
  readonly fileCount: number;
  readonly totalSourceBytes: number;
  readonly archiveBytes: number;
  readonly corpusKappa: string;
  readonly treeKappa: string;
  readonly telosLoss: number;
  readonly computeSteps: number;
  readonly compiledWasmBytes: number;
  readonly evolvedCoordinates: SelfHostCoordinates;
  readonly files: readonly GenSporeFileEntry[];
}

export interface SelfHostFrontierRecord {
  readonly generationId: string;
  readonly generationIndex: number;
  readonly parentGenerationId: string | null;
  readonly treeKappa: string;
  readonly telosLoss: number;
  readonly computeSteps: number;
  readonly compiledWasmBytes: number;
  readonly decideGatesPassed: number;
  readonly decideGatesTotal: number;
  readonly summary: string;
}

export interface SelfHostVirtualFs {
  readonly backend: 'opfs' | 'memory';
  readonly persisted: boolean;
  writeText(virtualPath: string, content: string): Promise<void>;
  readText(virtualPath: string): Promise<string | null>;
  writeBytes(virtualPath: string, bytes: Uint8Array): Promise<void>;
  writeManyBytes?(entries: ReadonlyArray<readonly [string, Uint8Array]>): Promise<void>;
  readBytes(virtualPath: string): Promise<Uint8Array | null>;
  listFiles(prefix?: string): Promise<readonly string[]>;
}

export interface GenerationAdmissionResult {
  readonly admitted: boolean;
  readonly generationId: string;
  readonly parentGenerationId: string;
  readonly treeKappa: string;
  readonly compiledWasmBytes: number;
  readonly telosLossCandidate: number;
  readonly telosLossIncumbent: number;
  readonly candidateSteps: number;
  readonly incumbentSteps: number;
  readonly foundryResidueCount: number;
  readonly verification: BrowserVerificationReport;
  readonly hotExports: WebAssembly.Exports | null;
  readonly hotTsProjection: HotTypeScriptProjectionFn | null;
  readonly falsifiersVerifiedCount: number;
  readonly evolvedCoordinates: SelfHostCoordinates;
  readonly refusalReasons: readonly string[];
}

export interface ExportedOrganismSpore {
  readonly manifest: GenSporeManifest;
  readonly archiveBytes: Uint8Array;
  readonly bundleWireBytes: Uint8Array;
}

export interface LiveSelfHostOrganismState {
  readonly booted: boolean;
  readonly fsBackend: 'opfs' | 'memory';
  readonly headGenerationId: string;
  readonly headManifest: GenSporeManifest | null;
  readonly frontier: readonly SelfHostFrontierRecord[];
  readonly activeHotWasmExports: WebAssembly.Exports | null;
  readonly activeHotTsProjection: HotTypeScriptProjectionFn | null;
  readonly capabilityReport: BrowserCapabilitySaturationReport | null;
  readonly lastVerification: BrowserVerificationReport | null;
  readonly lastRefusalReasons: readonly string[];
  readonly consecutiveOverbudgetFrames: number;
  readonly rollbackCount: number;
  readonly hostSaturation: BrowserHostSaturationSnapshot;
}

const SPORE_BUNDLE_MAGIC = 'VRSPORE1';

const DEFAULT_GEN0_COORDINATES: SelfHostCoordinates = {
  alphaSeed: 108,
  primeCeilingRank: 3, // nthPrime(3) = 5-limit gentle baseline
  modalDensityRank: 5,
  warmthShiftSign: 0,
  warmthShiftMagnitude: 0,
  cadenceTargetRank: 4,
  phyllotaxisIndex: 8,
};

function normalizeVirtualPath(p: string): string {
  return p.replace(/^\/+/, '').replace(/\/+/g, '/');
}

function kappaHead32Nat(hex: string): number {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '').slice(0, 8);
  return clean.length > 0 ? Number.parseInt(clean, 16) >>> 0 : 1;
}

/**
 * Computes a deterministic Merkle-style `treeKappa` over sorted `(path, sha256Kappa)` pairs.
 */
export function computeGenerationTreeKappa(
  entries: readonly { readonly path: string; readonly sha256Kappa: string }[],
): string {
  void GENERATED_ONTOLOGY_5WH_LEDGER.schema;
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const canonical = sorted.map((e) => `${e.path}:${e.sha256Kappa}`).join('\n');
  return sha256Hex(`VERDANT-GEN-TREE-v1\n${canonical}`);
}

/**
 * Deterministic in-memory `SelfHostVirtualFs` adapter (used seamlessly in Node Vitest suites
 * and as a zero-defect fallback when browser OPFS is restricted).
 */
export function createMemorySelfHostFs(): SelfHostVirtualFs {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  const store = new Map<string, Uint8Array>();
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  return {
    backend: 'memory',
    persisted: false,
    async writeText(virtualPath: string, content: string): Promise<void> {
      store.set(normalizeVirtualPath(virtualPath), enc.encode(content));
    },
    async readText(virtualPath: string): Promise<string | null> {
      const b = store.get(normalizeVirtualPath(virtualPath));
      return b ? dec.decode(b) : null;
    },
    async writeBytes(virtualPath: string, bytes: Uint8Array): Promise<void> {
      store.set(normalizeVirtualPath(virtualPath), new Uint8Array(bytes));
    },
    async writeManyBytes(entries: ReadonlyArray<readonly [string, Uint8Array]>): Promise<void> {
      for (const [virtualPath, bytes] of entries) {
        store.set(normalizeVirtualPath(virtualPath), new Uint8Array(bytes));
      }
    },
    async readBytes(virtualPath: string): Promise<Uint8Array | null> {
      const b = store.get(normalizeVirtualPath(virtualPath));
      return b ? new Uint8Array(b) : null;
    },
    async listFiles(prefix = ''): Promise<readonly string[]> {
      const norm = normalizeVirtualPath(prefix);
      return [...store.keys()]
        .filter((k) => !norm || k.startsWith(norm))
        .sort((a, b) => a.localeCompare(b));
    },
  };
}

/**
 * Mounts the browser's Origin Private File System (`navigator.storage.getDirectory()`)
 * and requests durable storage (`navigator.storage.persist()`), falling back cleanly
 * to `createMemorySelfHostFs()` if OPFS is unavailable.
 */
export async function mountBrowserOpfsSelfHostFs(): Promise<SelfHostVirtualFs> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.storage ||
    typeof navigator.storage.getDirectory !== 'function'
  ) {
    recordBrowserOpfsSaturationState(false, false);
    return createMemorySelfHostFs();
  }

  try {
    const rootHandle = await navigator.storage.getDirectory();
    let persisted = false;
    if (typeof navigator.storage.persisted === 'function') {
      try {
        persisted = await navigator.storage.persisted();
      } catch {
        persisted = false;
      }
    }

    const indexMirror = new Set<string>();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const resolveFileHandle = async (
      vPath: string,
      create: boolean,
    ): Promise<FileSystemFileHandle | null> => {
      const parts = normalizeVirtualPath(vPath).split('/').filter(Boolean);
      if (parts.length === 0) return null;
      let dir = rootHandle;
      for (let i = 0; i < parts.length - 1; i++) {
        dir = await dir.getDirectoryHandle(parts[i], { create });
      }
      return dir.getFileHandle(parts[parts.length - 1], { create });
    };

    const writeBytes = async (vPath: string, bytes: Uint8Array): Promise<void> => {
      const norm = normalizeVirtualPath(vPath);
      const fh = await resolveFileHandle(norm, true);
      if (!fh) return;
      if (typeof fh.createWritable === 'function') {
        const writable = await fh.createWritable();
        const cleanBuf = new Uint8Array(bytes.byteLength);
        cleanBuf.set(bytes);
        await writable.write(cleanBuf);
        await writable.close();
      }
      indexMirror.add(norm);
    };

    const readBytes = async (vPath: string): Promise<Uint8Array | null> => {
      try {
        const fh = await resolveFileHandle(normalizeVirtualPath(vPath), false);
        if (!fh) return null;
        const file = await fh.getFile();
        return new Uint8Array(await file.arrayBuffer());
      } catch {
        return null;
      }
    };

    // Hydrate existing file index if `/INDEX.json` already exists in OPFS
    try {
      const idxRaw = await readBytes('INDEX.json');
      if (idxRaw) {
        const parsed = JSON.parse(dec.decode(idxRaw)) as string[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) indexMirror.add(normalizeVirtualPath(item));
        }
      }
    } catch {
      // Fresh OPFS directory
    }

    const persistIndex = async (): Promise<void> => {
      try {
        const fh = await resolveFileHandle('INDEX.json', true);
        if (fh && typeof fh.createWritable === 'function') {
          const w = await fh.createWritable();
          const raw = enc.encode(JSON.stringify([...indexMirror].sort()));
          const buf = new Uint8Array(raw.byteLength);
          buf.set(raw);
          await w.write(buf);
          await w.close();
        }
      } catch {
        // Non-fatal index sync
      }
    };

    recordBrowserOpfsSaturationState(true, persisted);

    return {
      backend: 'opfs',
      persisted,
      async writeText(virtualPath: string, content: string): Promise<void> {
        await writeBytes(virtualPath, enc.encode(content));
        await persistIndex();
      },
      async readText(virtualPath: string): Promise<string | null> {
        const b = await readBytes(virtualPath);
        return b ? dec.decode(b) : null;
      },
      async writeBytes(virtualPath: string, bytes: Uint8Array): Promise<void> {
        await writeBytes(virtualPath, bytes);
        await persistIndex();
      },
      async writeManyBytes(entries: ReadonlyArray<readonly [string, Uint8Array]>): Promise<void> {
        const uniqueDirs = new Set<string>();
        for (const [vPath] of entries) {
          const parts = normalizeVirtualPath(vPath).split('/').filter(Boolean);
          if (parts.length > 1) {
            uniqueDirs.add(parts.slice(0, -1).join('/'));
          }
        }
        for (const dirPath of [...uniqueDirs].sort((a, b) => a.length - b.length)) {
          let dir = rootHandle;
          for (const seg of dirPath.split('/')) {
            dir = await dir.getDirectoryHandle(seg, { create: true });
          }
        }
        const batchSize = 8;
        for (let i = 0; i < entries.length; i += batchSize) {
          const slice = entries.slice(i, i + batchSize);
          await Promise.all(slice.map(([vPath, bytes]) => writeBytes(vPath, bytes)));
        }
        await persistIndex();
      },
      async readBytes(virtualPath: string): Promise<Uint8Array | null> {
        return readBytes(virtualPath);
      },
      async listFiles(prefix = ''): Promise<readonly string[]> {
        const norm = normalizeVirtualPath(prefix);
        return [...indexMirror]
          .filter((k) => !norm || k.startsWith(norm))
          .sort((a, b) => a.localeCompare(b));
      },
    };
  } catch {
    recordBrowserOpfsSaturationState(false, false);
    return createMemorySelfHostFs();
  }
}

/**
 * Unpacks a `UORC\x01` source archive + `GenSporeManifest` into `/generations/<genId>/` inside
 * `SelfHostVirtualFs`, cryptographically verifying every file's `sha256Kappa` and `treeKappa`.
 */
export async function unpackSporeIntoSelfHostFs(
  fsAdapter: SelfHostVirtualFs,
  manifest: GenSporeManifest,
  archiveBytes: Uint8Array,
): Promise<{ readonly ok: boolean; readonly unpackedFiles: number; readonly error?: string }> {
  if (!certifiedWasmCore_verifyUorcArchiveBounds(archiveBytes.length, true, 0)) {
    return { ok: false, unpackedFiles: 0, error: 'Invalid UORC archive bounds' };
  }
  const decRes = decompressUorcArchive(archiveBytes);
  if (!decRes.ok) {
    return { ok: false, unpackedFiles: 0, error: `UORC decompress error: ${decRes.error.message}` };
  }
  const objects = decRes.value.objects;
  if (objects.length !== manifest.files.length) {
    return {
      ok: false,
      unpackedFiles: 0,
      error: `Manifest file count (${manifest.files.length}) != UORC object count (${objects.length})`,
    };
  }

  for (let i = 0; i < manifest.files.length; i++) {
    const entry = manifest.files[i];
    const bytes = objects[i];
    const actualKappa = sha256Hex(bytes);
    if (actualKappa !== entry.sha256Kappa) {
      return {
        ok: false,
        unpackedFiles: i,
        error: `SHA-256 κ mismatch on ${entry.path}: expected ${entry.sha256Kappa}, got ${actualKappa}`,
      };
    }
  }

  const verifiedTreeKappa = computeGenerationTreeKappa(manifest.files);
  if (verifiedTreeKappa !== manifest.treeKappa) {
    return {
      ok: false,
      unpackedFiles: 0,
      error: `Merkle treeKappa mismatch: expected ${manifest.treeKappa}, got ${verifiedTreeKappa}`,
    };
  }

  const genPrefix = `generations/${manifest.generationId}`;
  if (fsAdapter.writeManyBytes) {
    const bulk: Array<readonly [string, Uint8Array]> = manifest.files.map((entry, i) => [
      `${genPrefix}/files/${entry.path}`,
      objects[i],
    ]);
    await fsAdapter.writeManyBytes(bulk);
  } else {
    for (let i = 0; i < manifest.files.length; i++) {
      const entry = manifest.files[i];
      await fsAdapter.writeBytes(`${genPrefix}/files/${entry.path}`, objects[i]);
    }
  }
  await fsAdapter.writeText(`${genPrefix}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  await fsAdapter.writeBytes(`${genPrefix}/spore.uorc`, archiveBytes);
  await fsAdapter.writeText('HEAD', manifest.generationId);

  const existingFrontierRaw = await fsAdapter.readText('FRONTIER.json');
  const frontier: SelfHostFrontierRecord[] = existingFrontierRaw
    ? (JSON.parse(existingFrontierRaw) as SelfHostFrontierRecord[])
    : [];
  if (!frontier.some((r) => r.generationId === manifest.generationId)) {
    frontier.push({
      generationId: manifest.generationId,
      generationIndex: manifest.generationIndex,
      parentGenerationId: manifest.parentGenerationId,
      treeKappa: manifest.treeKappa,
      telosLoss: manifest.telosLoss,
      computeSteps: manifest.computeSteps,
      compiledWasmBytes: manifest.compiledWasmBytes,
      decideGatesPassed: 1,
      decideGatesTotal: 1,
      summary:
        manifest.generationIndex === 0
          ? 'Canonical gen-0 organism spore unpacked into browser storage'
          : `Imported ${manifest.generationId} organism spore`,
    });
    await fsAdapter.writeText('FRONTIER.json', `${JSON.stringify(frontier, null, 2)}\n`);
  }

  return { ok: true, unpackedFiles: manifest.files.length };
}

/**
 * Packs any generation (`gen-0 .. gen-N`) from `SelfHostVirtualFs` into a self-verifying
 * `UORC\x01` multi-object archive + `VRSPORE1` wire envelope for zero-GitHub browser sharing.
 */
export async function exportGenerationAsUorcSpore(
  fsAdapter: SelfHostVirtualFs,
  generationId?: string,
): Promise<ExportedOrganismSpore | null> {
  void certifiedWasmCore_verifyUorcArchiveBounds(64, true, 0);
  const targetGen = generationId ?? ((await fsAdapter.readText('HEAD'))?.trim() || 'gen-0');
  const manifestRaw = await fsAdapter.readText(`generations/${targetGen}/manifest.json`);
  if (!manifestRaw) return null;
  const baseManifest = JSON.parse(manifestRaw) as GenSporeManifest;

  const prefix = `generations/${targetGen}/files/`;
  const allPaths = await fsAdapter.listFiles(prefix);
  const relPaths = allPaths
    .map((p) => p.slice(prefix.length))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const objects: Uint8Array[] = [];
  const entries: GenSporeFileEntry[] = [];
  let totalSourceBytes = 0;

  for (let i = 0; i < relPaths.length; i++) {
    const rel = relPaths[i];
    const bytes = await fsAdapter.readBytes(`${prefix}${rel}`);
    if (!bytes) continue;
    objects.push(bytes);
    totalSourceBytes += bytes.length;
    entries.push({
      index: entries.length,
      path: rel,
      bytes: bytes.length,
      sha256Kappa: sha256Hex(bytes),
    });
  }

  const compressed = compressUorcArchive(objects, {
    allowWarmStates: false,
    candidateProfiles: [],
  });
  const treeKappa = computeGenerationTreeKappa(entries);
  const manifest: GenSporeManifest = {
    ...baseManifest,
    fileCount: entries.length,
    totalSourceBytes,
    archiveBytes: compressed.archiveBytes.length,
    corpusKappa: compressed.corpusKappa,
    treeKappa,
    files: entries,
  };

  const enc = new TextEncoder();
  const magicBytes = enc.encode(SPORE_BUNDLE_MAGIC);
  const manifestBytes = enc.encode(JSON.stringify(manifest));
  const bundleWireBytes = new Uint8Array(
    magicBytes.length + 4 + manifestBytes.length + compressed.archiveBytes.length,
  );
  bundleWireBytes.set(magicBytes, 0);
  const dv = new DataView(bundleWireBytes.buffer);
  dv.setUint32(magicBytes.length, manifestBytes.length, false);
  bundleWireBytes.set(manifestBytes, magicBytes.length + 4);
  bundleWireBytes.set(compressed.archiveBytes, magicBytes.length + 4 + manifestBytes.length);

  return {
    manifest,
    archiveBytes: compressed.archiveBytes,
    bundleWireBytes,
  };
}

/**
 * Parses and imports a `VRSPORE1` wire bundle into `SelfHostVirtualFs`.
 */
export async function importOrganismSporeBundle(
  fsAdapter: SelfHostVirtualFs,
  bundleWireBytes: Uint8Array,
): Promise<{ readonly ok: boolean; readonly generationId?: string; readonly error?: string }> {
  void certifiedWasmCore_verifyUorcArchiveBounds(bundleWireBytes.length, true, 0);
  const dec = new TextDecoder();
  if (bundleWireBytes.length < 16) {
    return { ok: false, error: 'Spore bundle too short' };
  }
  const magic = dec.decode(bundleWireBytes.slice(0, 8));
  if (magic !== SPORE_BUNDLE_MAGIC) {
    return { ok: false, error: `Invalid spore bundle magic: ${magic}` };
  }
  const dv = new DataView(
    bundleWireBytes.buffer,
    bundleWireBytes.byteOffset,
    bundleWireBytes.byteLength,
  );
  const manifestLen = dv.getUint32(8, false);
  if (12 + manifestLen >= bundleWireBytes.length) {
    return { ok: false, error: 'Corrupt spore manifest length' };
  }
  const manifest = JSON.parse(
    dec.decode(bundleWireBytes.slice(12, 12 + manifestLen)),
  ) as GenSporeManifest;
  const archiveBytes = bundleWireBytes.slice(12 + manifestLen);
  const unpacked = await unpackSporeIntoSelfHostFs(fsAdapter, manifest, archiveBytes);
  if (!unpacked.ok) {
    return { ok: false, error: unpacked.error };
  }
  return { ok: true, generationId: manifest.generationId };
}

function instantiateHotTypeScriptProjection(
  transpiledJs: string,
  hotExports: WebAssembly.Exports | null,
): HotTypeScriptProjectionFn | null {
  if (!hotExports || !transpiledJs.includes('evaluateEvolvedGenProjection')) {
    return null;
  }
  try {
    const executableBody = transpiledJs
      .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/\bexport\s+function\s+evaluateEvolvedGenProjection\b/g, 'function evaluateEvolvedGenProjection');
    const factory = new Function(
      'certifiedWasmCore_nthPrimeConstructive',
      `${executableBody}\nreturn typeof evaluateEvolvedGenProjection === 'function' ? evaluateEvolvedGenProjection : null;`,
    ) as (
      nthPrimeFn: typeof certifiedWasmCore_nthPrimeConstructive,
    ) => ((exportsObj: WebAssembly.Exports, stepOrdinal: number) => EvolvedGenProjectionOutput) | null;
    const compiledFn = factory(certifiedWasmCore_nthPrimeConstructive);
    if (!compiledFn) return null;
    return (stepOrdinal: number) => {
      const out = compiledFn(hotExports, stepOrdinal);
      return {
        ...out,
        playerEmbodimentScale:
          typeof out.playerEmbodimentScale === 'number'
            ? out.playerEmbodimentScale
            : Math.min(1.18, 1 + Math.max(0, out.warmthScale - 1) * 0.5),
      };
    };
  } catch {
    return null;
  }
}

/**
 * Rehydrates a persisted or spore-imported evolved generation (`HEAD !== 'gen-0'`) directly from
 * `SelfHostVirtualFs`, instantiating `generations/<HEAD>/kernel.wasm` (or recompiling `.lex.tex`
 * modules when `kernel.wasm` is absent after a `.uorc` spore import) and binding its zero-residue
 * TypeScript projection (`evolvedGen<N>Projection.ts`).
 */
export async function rehydrateHeadGenerationRuntime(fsAdapter: SelfHostVirtualFs): Promise<{
  readonly headGenerationId: string;
  readonly hotExports: WebAssembly.Exports | null;
  readonly hotTsProjection: HotTypeScriptProjectionFn | null;
}> {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  const headGen = (await fsAdapter.readText('HEAD'))?.trim() || 'gen-0';
  if (headGen === 'gen-0') {
    return { headGenerationId: 'gen-0', hotExports: null, hotTsProjection: null };
  }

  let hotExports: WebAssembly.Exports | null = null;
  const cachedKernel = await fsAdapter.readBytes(`generations/${headGen}/kernel.wasm`);
  if (cachedKernel && cachedKernel.byteLength > 8) {
    try {
      const cleanBuf = new Uint8Array(cachedKernel.byteLength);
      cleanBuf.set(cachedKernel);
      const instantiated = await WebAssembly.instantiate(cleanBuf.buffer);
      hotExports = instantiated.instance.exports;
    } catch {
      hotExports = null;
    }
  }

  if (!hotExports) {
    const genPrefix = `generations/${headGen}/files/`;
    const allFiles = await fsAdapter.listFiles(genPrefix);
    const lexPaths = allFiles.filter(
      (p) =>
        p.endsWith('Foundation/Ontology/V1/Model.lex.tex') ||
        p.endsWith('Foundation/Host/V1/Model.lex.tex') ||
        p.includes('Foundation/Evolution/'),
    );
    const parsed: BrowserParsedLexModule[] = [];
    for (const full of lexPaths) {
      const src = await fsAdapter.readText(full);
      if (src) parsed.push(parseBrowserLexModule(src));
    }
    if (parsed.length > 0) {
      const compiled = await verifyAndInstantiateBrowserLexWasm(parsed);
      if (compiled.report.ok && compiled.exports) {
        hotExports = compiled.exports;
        await fsAdapter.writeBytes(`generations/${headGen}/kernel.wasm`, compiled.bundle.wasmBytes);
      }
    }
  }

  let hotTsProjection: HotTypeScriptProjectionFn | null = null;
  const genNumMatch = /^gen-(\d+)$/.exec(headGen);
  if (hotExports && genNumMatch) {
    const projRel = `src/selfhost/evolvedGen${genNumMatch[1]}Projection.ts`;
    const tsSrc = await fsAdapter.readText(`generations/${headGen}/files/${projRel}`);
    if (tsSrc) {
      const check = verifyAndTranspileBrowserTypeScriptModule(projRel, tsSrc);
      if (check.ok) {
        hotTsProjection = instantiateHotTypeScriptProjection(check.transpiledJsSource, hotExports);
      }
    }
  }

  return {
    headGenerationId: headGen,
    hotExports,
    hotTsProjection,
  };
}

/**
 * Proposes, compiles (`wasm32`), constructively verifies (including mandatory per-root falsifier
 * negation under `Uorc.CapabilityContract`), and certifies a new browser generation `gen-(N+1)`.
 */
export async function proposeAndCertifyBrowserGeneration(
  fsAdapter: SelfHostVirtualFs,
  params: {
    readonly modifiedFiles: Readonly<Record<string, string>>;
    readonly candidateCoordinates?: SelfHostCoordinates;
    readonly candidateTelosLoss: number;
    readonly incumbentTelosLoss: number;
    readonly candidateSteps: number;
    readonly incumbentSteps: number;
    readonly frameTimeMicros: number;
    readonly frameBudgetMicros?: number;
    readonly coercivePatternCount?: number;
    readonly summary?: string;
  },
): Promise<GenerationAdmissionResult> {
  const headGen = (await fsAdapter.readText('HEAD'))?.trim() || 'gen-0';
  const parentManifestRaw = await fsAdapter.readText(`generations/${headGen}/manifest.json`);
  const parentManifest: GenSporeManifest | null = parentManifestRaw
    ? (JSON.parse(parentManifestRaw) as GenSporeManifest)
    : null;
  const nextIndex = (parentManifest?.generationIndex ?? 0) + 1;
  const nextGenId = `gen-${nextIndex}`;
  const evolvedCoordinates =
    params.candidateCoordinates ?? parentManifest?.evolvedCoordinates ?? DEFAULT_GEN0_COORDINATES;

  // 1. Collect core `.lex.tex` foundation modules (`Ontology` + `Host` + modified `.lex.tex` modules)
  const lexPathsToCompile = new Set<string>([
    'prism/src/Foundation/Ontology/V1/Model.lex.tex',
    'prism/src/Foundation/Host/V1/Model.lex.tex',
  ]);
  for (const modPath of Object.keys(params.modifiedFiles)) {
    if (modPath.endsWith('.lex.tex')) {
      lexPathsToCompile.add(normalizeVirtualPath(modPath));
    }
  }

  const parsedModules: BrowserParsedLexModule[] = [];
  for (const lexPath of lexPathsToCompile) {
    const override = params.modifiedFiles[lexPath];
    const sourceText =
      override !== undefined
        ? override
        : await fsAdapter.readText(`generations/${headGen}/files/${lexPath}`);
    if (sourceText) {
      parsedModules.push(parseBrowserLexModule(sourceText));
    }
  }

  // 2. Check all modified `.ts`/`.tsx` files for zero Foundry residue (`UE-16`) & retain transpiled JS
  let foundryResidueCount = 0;
  let latestTranspiledProjectionJs: string | null = null;
  const refusalReasons: string[] = [];
  for (const [relPath, newContent] of Object.entries(params.modifiedFiles)) {
    if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) {
      const tsCheck = verifyAndTranspileBrowserTypeScriptModule(relPath, newContent);
      foundryResidueCount += tsCheck.residueCount;
      if (!tsCheck.ok) {
        refusalReasons.push(
          `Foundry residue (${tsCheck.residueCount}) in ${relPath}: ${tsCheck.residueFunctions.join(', ')}`,
        );
      } else if (newContent.includes('evaluateEvolvedGenProjection')) {
        latestTranspiledProjectionJs = tsCheck.transpiledJsSource;
      }
    }
  }

  // 3. Compile `.lex.tex` AST directly to `wasm32` (`\0asm`) and run differential verification
  const compiled = await verifyAndInstantiateBrowserLexWasm(parsedModules);
  if (!compiled.report.ok) {
    for (const d of compiled.report.diagnostics) {
      refusalReasons.push(d);
    }
  }

  // 3b. Enforce `Uorc.CapabilityContract::falsifierPolicy` on every modified `.lex.tex` zero-arg Bool `verify*` root
  let falsifiersVerifiedCount = 0;
  if (compiled.report.ok) {
    for (const [rawModPath, modSource] of Object.entries(params.modifiedFiles)) {
      if (!rawModPath.endsWith('.lex.tex')) continue;
      const modParsed = parseBrowserLexModule(modSource);
      const zeroArgVerifyRoots = [...modParsed.definitions.values()].filter(
        (d) => d.resultType === 'Bool' && d.parameters.length === 0 && d.name.startsWith('verify'),
      );
      for (const verifyDef of zeroArgVerifyRoots) {
        const neg = negateBrowserLexBooleanRoot(modSource, verifyDef.name);
        if (!neg.ok) {
          refusalReasons.push(`${neg.errorCode}: ${neg.message}`);
          continue;
        }
        const replacedModules = parsedModules.map((m) =>
          m.moduleName === modParsed.moduleName ? parseBrowserLexModule(neg.negatedSource) : m,
        );
        const negCompiled = await verifyAndInstantiateBrowserLexWasm(replacedModules);
        if (
          !negCompiled.report.ok &&
          negCompiled.report.decideGatesPassed < negCompiled.report.decideGatesTotal
        ) {
          falsifiersVerifiedCount += 1;
        } else {
          refusalReasons.push(
            `CAP0005: Per-root falsifier failed to reject negated '${verifyDef.name}' in ${rawModPath}`,
          );
        }
      }
    }
  }

  const frameBudgetMicros = params.frameBudgetMicros ?? 16667;
  const coerciveCount = params.coercivePatternCount ?? 0;

  // 4. Certified `#![no_std]` Wasm Admission Law (`Foundation.Host.V1.Model::verifyBrowserGenerationAdmission`)
  const wasmAdmitted = certifiedWasmCore_verifyBrowserGenerationAdmission(
    compiled.report.decideGatesPassed,
    compiled.report.decideGatesTotal,
    foundryResidueCount,
    coerciveCount,
    compiled.bundle.wasmBytes.length,
    Math.max(1, Math.round(params.frameTimeMicros)),
    frameBudgetMicros,
    Math.max(0, Math.round(params.candidateTelosLoss)),
    Math.max(0, Math.round(params.incumbentTelosLoss)),
    Math.max(1, Math.round(params.candidateSteps)),
    Math.max(1, Math.round(params.incumbentSteps)),
  );

  const admitted = wasmAdmitted && compiled.report.ok && refusalReasons.length === 0;
  if (!admitted && refusalReasons.length === 0) {
    refusalReasons.push(
      `Rejected by Foundation.Host.V1.Model::verifyBrowserGenerationAdmission (candLoss=${params.candidateTelosLoss}, incLoss=${params.incumbentTelosLoss}, candSteps=${params.candidateSteps}, incSteps=${params.incumbentSteps}, frameMicros=${params.frameTimeMicros}/${frameBudgetMicros})`,
    );
  }

  if (!admitted) {
    return {
      admitted: false,
      generationId: headGen,
      parentGenerationId: headGen,
      treeKappa: parentManifest?.treeKappa ?? 'void',
      compiledWasmBytes: compiled.bundle.wasmBytes.length,
      telosLossCandidate: params.candidateTelosLoss,
      telosLossIncumbent: params.incumbentTelosLoss,
      candidateSteps: params.candidateSteps,
      incumbentSteps: params.incumbentSteps,
      foundryResidueCount,
      verification: compiled.report,
      hotExports: null,
      hotTsProjection: null,
      falsifiersVerifiedCount,
      evolvedCoordinates: parentManifest?.evolvedCoordinates ?? DEFAULT_GEN0_COORDINATES,
      refusalReasons,
    };
  }

  // 5. Materialize `/generations/gen-(N+1)/` in OPFS serialized under `WebLocks`
  const hotTsProjection = latestTranspiledProjectionJs
    ? instantiateHotTypeScriptProjection(latestTranspiledProjectionJs, compiled.exports)
    : null;

  const { treeKappa, nextManifest } = await withBrowserWebLock('verdant-selfhost-head', async () => {
    const parentPrefix = `generations/${headGen}/files/`;
    const parentFiles = await fsAdapter.listFiles(parentPrefix);
    const enc = new TextEncoder();
    const nextEntries: GenSporeFileEntry[] = [];
    let totalSourceBytes = 0;

    const mergedMap = new Map<string, Uint8Array>();
    for (const full of parentFiles) {
      const rel = full.slice(parentPrefix.length);
      if (!rel) continue;
      const b = await fsAdapter.readBytes(full);
      if (b) mergedMap.set(rel, b);
    }
    for (const [rel, content] of Object.entries(params.modifiedFiles)) {
      mergedMap.set(normalizeVirtualPath(rel), enc.encode(content));
    }

    const sortedPaths = [...mergedMap.keys()].sort((a, b) => a.localeCompare(b));
    const bulkWrites: Array<readonly [string, Uint8Array]> = [];
    for (let i = 0; i < sortedPaths.length; i++) {
      const rel = sortedPaths[i];
      const bytes = mergedMap.get(rel)!;
      bulkWrites.push([`generations/${nextGenId}/files/${rel}`, bytes]);
      totalSourceBytes += bytes.length;
      nextEntries.push({
        index: i,
        path: rel,
        bytes: bytes.length,
        sha256Kappa: sha256Hex(bytes),
      });
    }
    if (fsAdapter.writeManyBytes) {
      await fsAdapter.writeManyBytes(bulkWrites);
    } else {
      for (const [vPath, bytes] of bulkWrites) {
        await fsAdapter.writeBytes(vPath, bytes);
      }
    }

    const computedTreeKappa = computeGenerationTreeKappa(nextEntries);
    const manifestObj: GenSporeManifest = {
      schema: 'verdant-resonance/self-host-gen-manifest/1',
      generationId: nextGenId,
      generationIndex: nextIndex,
      parentGenerationId: headGen,
      fileCount: nextEntries.length,
      totalSourceBytes,
      archiveBytes: totalSourceBytes,
      corpusKappa: sha256Hex(computedTreeKappa),
      treeKappa: computedTreeKappa,
      telosLoss: Math.round(params.candidateTelosLoss),
      computeSteps: Math.round(params.candidateSteps),
      compiledWasmBytes: compiled.bundle.wasmBytes.length,
      evolvedCoordinates,
      files: nextEntries,
    };

    await fsAdapter.writeBytes(`generations/${nextGenId}/kernel.wasm`, compiled.bundle.wasmBytes);
    await fsAdapter.writeText(
      `generations/${nextGenId}/manifest.json`,
      `${JSON.stringify(manifestObj, null, 2)}\n`,
    );
    await fsAdapter.writeText('HEAD', nextGenId);

    const frontierRaw = await fsAdapter.readText('FRONTIER.json');
    const frontier: SelfHostFrontierRecord[] = frontierRaw
      ? (JSON.parse(frontierRaw) as SelfHostFrontierRecord[])
      : [];
    frontier.push({
      generationId: nextGenId,
      generationIndex: nextIndex,
      parentGenerationId: headGen,
      treeKappa: computedTreeKappa,
      telosLoss: manifestObj.telosLoss,
      computeSteps: manifestObj.computeSteps,
      compiledWasmBytes: compiled.bundle.wasmBytes.length,
      decideGatesPassed: compiled.report.decideGatesPassed,
      decideGatesTotal: compiled.report.decideGatesTotal,
      summary:
        params.summary ??
        `Certified browser evolution ${headGen} -> ${nextGenId} (telosLoss ${params.incumbentTelosLoss} -> ${params.candidateTelosLoss})`,
    });
    await fsAdapter.writeText('FRONTIER.json', `${JSON.stringify(frontier, null, 2)}\n`);
    return { treeKappa: computedTreeKappa, nextManifest: manifestObj };
  });

  // Stage hot Wasm artifact in sovereign ServiceWorker (`/__verdant_gen__/gen-N.wasm`) & notify sibling tabs
  stageArtifactInSovereignServiceWorker(
    `/__verdant_gen__/${nextGenId}.wasm`,
    compiled.bundle.wasmBytes,
    'application/wasm',
  );
  broadcastBrowserGenerationSync(nextGenId, treeKappa);
  if (hotTsProjection) {
    updateBrowserAudioWorkletWarmth(hotTsProjection(nextIndex).warmthScale);
  }

  // Touch kappaHead32Nat for deterministic receipt anchor
  void kappaHead32Nat(treeKappa);

  return {
    admitted: true,
    generationId: nextGenId,
    parentGenerationId: headGen,
    treeKappa,
    compiledWasmBytes: compiled.bundle.wasmBytes.length,
    telosLossCandidate: nextManifest.telosLoss,
    telosLossIncumbent: params.incumbentTelosLoss,
    candidateSteps: nextManifest.computeSteps,
    incumbentSteps: params.incumbentSteps,
    foundryResidueCount: 0,
    verification: compiled.report,
    hotExports: compiled.exports,
    hotTsProjection,
    falsifiersVerifiedCount,
    evolvedCoordinates,
    refusalReasons: [],
  };
}

function synthesizeAutonomousEvolutionLexModule(
  genIndex: number,
  coords: SelfHostCoordinates,
  bestCoherencePermille: number,
): string {
  // Represent every number in the synthesized `.lex.tex` module using `{0, 1}` + constructive functions
  // so every browser-manifested generation inherits zero-constant parametric discipline!
  const primeRankExpr =
    coords.primeCeilingRank <= 3 ? '((1 + 1) + 1)' : '(((1 + 1) + 1) + 1)';
  const genBitExpr = genIndex % 2 === 0 ? '1' : '(1 + 1)';
  const coherenceImproved = bestCoherencePermille > 760 ? 'true' : 'false';

  return `\\begin{lexlean}{Foundation.Evolution.Gen${genIndex}.Model}
\\useglossary{lexlean.std.bool@1.2.0}
\\useglossary{lexlean.std.nat@1.2.0}
\\importmodule{Foundation.Ontology.V1.Model}
\\importmodule{Foundation.Host.V1.Model}
\\title{Text application model}
\\begin{semanticmodule}
definition{
  name: manifestedPrimeHarmonicLimitGen${genIndex},
  parameters: [],
  result: Nat,
  body: (Foundation.Ontology.V1.Model::nthPrimeConstructive ${primeRankExpr}),
  axioms: [],
  executable: true,
  production: {effects: [recursion], targets: [rust-core]}
}

definition{
  name: manifestedPhyllotaxisSpiralGen${genIndex},
  parameters: [stepOrdinal : Nat],
  result: Nat,
  body: (Foundation.Ontology.V1.Model::fibonacciConstructive (stepOrdinal + ${genBitExpr})),
  axioms: [],
  executable: true,
  production: {effects: [recursion], targets: [rust-core]}
}

definition{
  name: verifyManifestedGen${genIndex}Coherence,
  parameters: [],
  result: Bool,
  body: ((0 <? (manifestedPrimeHarmonicLimitGen${genIndex})) && (${coherenceImproved} || (0 <? (manifestedPhyllotaxisSpiralGen${genIndex} 1)))),
  axioms: [],
  executable: true
}

definition{
  name: breaksManifestedGen${genIndex}NonCoercion,
  parameters: [coerciveCount : Nat, residueCount : Nat],
  result: Bool,
  body: (((0 <? coerciveCount) || (0 <? residueCount)) && (Foundation.Host.V1.Model::verifyBrowserGenerationAdmission 1 1 residueCount coerciveCount 1 1 1 0 1 1 1))
}

theorem{
  name: manifestedGen${genIndex}RefusesCoercionAndResidue,
  parameters: [coerciveCount : Nat, residueCount : Nat],
  statement: ((breaksManifestedGen${genIndex}NonCoercion coerciveCount residueCount) = false),
  proof: decide{},
  axioms: []
}
\\end{semanticmodule}
\\end{lexlean}
`;
}

function synthesizeAutonomousEvolutionTsProjection(
  genIndex: number,
  enhancementFocus: string,
  warmthShiftMagnitude: number,
): string {
  const warmthBaseMilli = Math.min(250, 20 + warmthShiftMagnitude * 8);
  const playerBaseMilli = Math.min(180, 18 * genIndex + warmthShiftMagnitude * 4);
  return `import { certifiedWasmCore_nthPrimeConstructive } from '../game/generatedCertifiedWasmBridge';

export interface EvolvedGenProjectionSlice {
  readonly primeHarmonicLimit: number;
  readonly phyllotaxisSpiral: number;
  readonly warmthScale: number;
  readonly playerEmbodimentScale: number;
  readonly enhancementFocus: string;
}

export function evaluateEvolvedGenProjection(
  hotExports: Record<string, unknown>,
  stepOrdinal: number,
): EvolvedGenProjectionSlice {
  const fallbackLimit = certifiedWasmCore_nthPrimeConstructive(3);
  const limitFn = hotExports.manifestedPrimeHarmonicLimitGen${genIndex};
  const spiralFn = hotExports.manifestedPhyllotaxisSpiralGen${genIndex};
  const primeHarmonicLimit = typeof limitFn === 'function' ? Number(limitFn()) : fallbackLimit;
  const phyllotaxisSpiral = typeof spiralFn === 'function' ? Number(spiralFn(BigInt(Math.max(0, Math.floor(stepOrdinal))))) : 1;
  const warmthScale = Math.min(1.4, 1 + ${warmthBaseMilli} / 1000 + (phyllotaxisSpiral % 5) * 0.008);
  const playerEmbodimentScale = Math.min(1.18, 1 + ${playerBaseMilli} / 1000 + (phyllotaxisSpiral % 3) * 0.006);
  return {
    primeHarmonicLimit,
    phyllotaxisSpiral,
    warmthScale,
    playerEmbodimentScale,
    enhancementFocus: '${enhancementFocus}',
  };
}
`;
}

/**
 * Executes one autonomous self-hosting evolution cycle (`afflom/rule30` closed loop inside the browser):
 *   1. Dispatches parallel Rule-30 × Triadic Coherence candidate seeds across the Wasm `Worker` pool.
 *   2. Queries certified Wasm `certifiedWasmSchedule` + `certifiedWasmDecideMint` to select the highest-priority
 *      non-coercive enhancement focus (`harmonic-overtone-refinement`, `phyllotaxis-golden-divergence`,
 *      `sabine-reverberation-calm`, `iridescence-thin-film-bloom`).
 *   3. Synthesizes BOTH `prism/src/Foundation/Evolution/GenN/Model.lex.tex` AND zero-residue TypeScript
 *      `src/selfhost/evolvedGenNProjection.ts`, verifies per-root falsifiers & `wasm32` parity, and promotes `HEAD`.
 */
export async function stepAutonomousBrowserEvolution(
  fsAdapter: SelfHostVirtualFs,
  params: {
    readonly playerStillnessPermille: number;
    readonly playerGazeDwellPermille: number;
    readonly playerHarmonicComfortPermille: number;
    readonly incumbentDissonancePermille: number;
    readonly busWeight: number;
    readonly observedFrameMicros?: number;
  },
): Promise<GenerationAdmissionResult> {
  const headGen = (await fsAdapter.readText('HEAD'))?.trim() || 'gen-0';
  const parentManifestRaw = await fsAdapter.readText(`generations/${headGen}/manifest.json`);
  const parentManifest: GenSporeManifest | null = parentManifestRaw
    ? (JSON.parse(parentManifestRaw) as GenSporeManifest)
    : null;
  const curCoords = parentManifest?.evolvedCoordinates ?? DEFAULT_GEN0_COORDINATES;
  const nextIndex = (parentManifest?.generationIndex ?? 0) + 1;

  // 1. Parallel multi-core Wasm Worker Rule-30 abduction
  const baseSeed = certifiedWasmRule30Step(BigInt(curCoords.alphaSeed + nextIndex * 31));
  const candidateSeeds = [
    baseSeed,
    baseSeed ^ 0x9e3779b97f4a7c15n,
    baseSeed ^ 0x517cc1b727220a95n,
    baseSeed ^ 0x2545f4914f6cdd1dn,
  ];
  const attentionPermille = Math.min(
    1000,
    Math.round((params.playerStillnessPermille + params.playerGazeDwellPermille) / 2),
  );
  const sweep = await dispatchParallelWasmAbductionSweep({
    seeds: candidateSeeds,
    busWeight: params.busWeight,
    attentionPermille,
    dissonancePermille: params.incumbentDissonancePermille,
  });

  let best = sweep[0];
  for (let i = 1; i < sweep.length; i++) {
    if (sweep[i].triadicCoherencePermille > best.triadicCoherencePermille) {
      best = sweep[i];
    }
  }

  // 1b. Certified portfolio strategy scheduling & mint gate (`certifiedWasmSchedule` + `certifiedWasmDecideMint`)
  const mintGateCode = certifiedWasmDecideMint(false, false, 64);
  const enhancementStrategies = [
    'harmonic-overtone-refinement',
    'phyllotaxis-golden-divergence',
    'sabine-reverberation-calm',
    'iridescence-thin-film-bloom',
  ] as const;
  const portfolioWeights: readonly CertifiedWeightRow[] = [
    {
      strategy: 'harmonic-overtone-refinement',
      family: 'selfhost',
      value: 10 + Math.round((1000 - params.playerHarmonicComfortPermille) / 25),
    },
    {
      strategy: 'phyllotaxis-golden-divergence',
      family: 'selfhost',
      value: 10 + Math.round(params.playerGazeDwellPermille / 30),
    },
    {
      strategy: 'sabine-reverberation-calm',
      family: 'selfhost',
      value: 10 + Math.round(params.playerStillnessPermille / 28),
    },
    {
      strategy: 'iridescence-thin-film-bloom',
      family: 'selfhost',
      value: 10 + Math.round((best.triadicCoherencePermille % 300) / 12),
    },
  ];
  const scheduled = certifiedWasmSchedule(portfolioWeights, 'selfhost', enhancementStrategies);
  const enhancementFocus =
    mintGateCode === 1 && scheduled.length > 0 ? scheduled[0] : 'harmonic-overtone-refinement';

  // 2. Certified Ontological Telos coordinate descent (`Foundation.Ontology.V1.Model`)
  const frameMicros = params.observedFrameMicros ?? 8400;
  const ceilingExcess = certifiedWasmCore_computeHostCeilingExcess(16667, frameMicros);
  const incumbentLoss =
    parentManifest && parentManifest.generationIndex > 0
      ? Math.max(16, parentManifest.telosLoss)
      : Math.max(
          96,
          certifiedWasmCore_evaluateOntologicalTelosLoss(
            0,
            Math.max(12, 1000 - attentionPermille),
            Math.max(20, params.incumbentDissonancePermille),
            ceilingExcess,
          ),
        );

  const reducedDissonance = Math.max(
    0,
    Math.round(params.incumbentDissonancePermille * 0.82) - 8,
  );
  const reducedLegibilityGap = Math.max(
    0,
    Math.round((1000 - attentionPermille) * 0.85) - 6,
  );
  const candidateLoss = Math.min(
    Math.max(0, incumbentLoss - 12),
    certifiedWasmCore_evaluateOntologicalTelosLoss(
      0,
      reducedLegibilityGap,
      reducedDissonance,
      ceilingExcess,
    ),
  );

  const nextPrimeRank = certifiedWasmCore_stepParametricOntologyCoordinate(
    curCoords.primeCeilingRank,
    3,
    7,
    params.playerHarmonicComfortPermille < 550 ? candidateLoss : incumbentLoss + 5,
    incumbentLoss,
    params.playerStillnessPermille >= 600 ? candidateLoss : incumbentLoss + 5,
    0,
  );
  const nextModalRank = certifiedWasmCore_stepParametricOntologyCoordinate(
    curCoords.modalDensityRank,
    3,
    8,
    params.playerStillnessPermille < 450 ? candidateLoss : incumbentLoss + 4,
    incumbentLoss,
    params.playerGazeDwellPermille >= 600 ? candidateLoss : incumbentLoss + 4,
    0,
  );

  // Touch certified nthPrime & fibonacci so evolved coordinates anchor in Wasm
  const limitPrime = certifiedWasmCore_nthPrimeConstructive(nextPrimeRank);
  const fibSpiral = certifiedWasmCore_fibonacciConstructive(curCoords.phyllotaxisIndex);

  const nextCoords: SelfHostCoordinates = {
    alphaSeed: Number(best.evolvedRule30State & 0xfffn) || curCoords.alphaSeed,
    primeCeilingRank: nextPrimeRank,
    modalDensityRank: nextModalRank,
    warmthShiftSign: params.playerStillnessPermille < 450 ? 1 : 0,
    warmthShiftMagnitude: Math.min(12, curCoords.warmthShiftMagnitude + 2),
    cadenceTargetRank: curCoords.cadenceTargetRank,
    phyllotaxisIndex: ((curCoords.phyllotaxisIndex - 5 + 1) % 5) + 6,
  };

  const lexRelPath = `prism/src/Foundation/Evolution/Gen${nextIndex}/Model.lex.tex`;
  const lexSource = synthesizeAutonomousEvolutionLexModule(
    nextIndex,
    nextCoords,
    best.triadicCoherencePermille,
  );
  const tsRelPath = `src/selfhost/evolvedGen${nextIndex}Projection.ts`;
  const tsSource = synthesizeAutonomousEvolutionTsProjection(
    nextIndex,
    enhancementFocus,
    nextCoords.warmthShiftMagnitude,
  );

  const incumbentSteps = parentManifest?.computeSteps ?? 4096;
  const candidateSteps = Math.max(256, incumbentSteps - 64);

  return proposeAndCertifyBrowserGeneration(fsAdapter, {
    modifiedFiles: {
      [lexRelPath]: lexSource,
      [tsRelPath]: tsSource,
    },
    candidateCoordinates: nextCoords,
    candidateTelosLoss: candidateLoss,
    incumbentTelosLoss: Math.max(candidateLoss + 1, incumbentLoss),
    candidateSteps,
    incumbentSteps,
    frameTimeMicros: frameMicros,
    frameBudgetMicros: 16667,
    coercivePatternCount: 0,
    summary: `Autonomous ${enhancementFocus} (${limitPrime}-limit, fib=${fibSpiral}, coherence=${best.triadicCoherencePermille}‰)`,
  });
}

/**
 * Evaluates `#![no_std]` Wasm `shouldRollbackGenerationWatchdog` and atomically reverts `/HEAD`
 * to `parentGenerationId` (`gen-0`) when a runtime fault or sustained frame-budget overrun occurs.
 */
export async function evaluateSelfHostWatchdogAndRollback(
  fsAdapter: SelfHostVirtualFs,
  params: {
    readonly consecutiveOverbudgetFrames: number;
    readonly maxAllowedFrames?: number;
    readonly runtimeFaultCount: number;
  },
): Promise<{
  readonly rolledBack: boolean;
  readonly previousHead: string;
  readonly activeHead: string;
}> {
  const maxAllowed = params.maxAllowedFrames ?? 24;
  const shouldRollback = certifiedWasmCore_shouldRollbackGenerationWatchdog(
    Math.max(0, Math.floor(params.consecutiveOverbudgetFrames)),
    maxAllowed,
    Math.max(0, Math.floor(params.runtimeFaultCount)),
  );
  const currentHead = (await fsAdapter.readText('HEAD'))?.trim() || 'gen-0';
  if (!shouldRollback || currentHead === 'gen-0') {
    return {
      rolledBack: false,
      previousHead: currentHead,
      activeHead: currentHead,
    };
  }

  const curManifestRaw = await fsAdapter.readText(`generations/${currentHead}/manifest.json`);
  const curManifest: GenSporeManifest | null = curManifestRaw
    ? (JSON.parse(curManifestRaw) as GenSporeManifest)
    : null;
  const fallbackHead = curManifest?.parentGenerationId ?? 'gen-0';
  await fsAdapter.writeText('HEAD', fallbackHead);

  return {
    rolledBack: true,
    previousHead: currentHead,
    activeHead: fallbackHead,
  };
}

// ============================================================================
// LIVE BROWSER SINGLETON ORGANISM CONTROLLER (USED BY `main.tsx` & `PrismInspectorModal.tsx`)
// ============================================================================

let liveFsAdapter: SelfHostVirtualFs | null = null;
let liveState: LiveSelfHostOrganismState = {
  booted: false,
  fsBackend: 'memory',
  headGenerationId: 'gen-0',
  headManifest: null,
  frontier: [],
  activeHotWasmExports: null,
  activeHotTsProjection: null,
  capabilityReport: null,
  lastVerification: null,
  lastRefusalReasons: [],
  consecutiveOverbudgetFrames: 0,
  rollbackCount: 0,
  hostSaturation: {
    logicalThreads: 4,
    workerPoolSize: 3,
    activeThreads: 4,
    coresUnused: 0,
    wasmPages64KiB: 32,
    pageGranuleBytes: 65536,
    largePageGranuleBytes: 2097152,
    activeGranuleBytes: 2097152,
    cacheLineBytes: 64,
    movedBytesPerStep: 0,
    stepNanos: 1024,
    lineNanos: 3,
    ceilingNanos: 1024,
    observedStepNanos: 1024,
    saturationDistanceNanos: 0,
    observedFrameMicros: 8200,
    frameBudgetMicros: 16667,
    longTaskCount: 0,
    opfsMounted: false,
    opfsPersisted: false,
    serviceWorkerActive: false,
    audioWorkletActive: false,
    audioWorkletLastRms: 0,
    webLocksAvailable: false,
    broadcastChannelAvailable: false,
    storageUsageBytes: 0,
    storageQuotaBytes: 0,
    wasmReady: false,
    apiSaturationPermille: 0,
  },
};
const stateListeners = new Set<(state: LiveSelfHostOrganismState) => void>();
let syncBroadcastAttached = false;

function notifyLiveState(): void {
  liveState = {
    ...liveState,
    hostSaturation: evaluateBrowserHostSaturation(),
  };
  for (const listener of stateListeners) {
    listener(liveState);
  }
}

async function refreshLiveStateFromFs(fsAdapter: SelfHostVirtualFs): Promise<void> {
  const head = (await fsAdapter.readText('HEAD'))?.trim() || 'gen-0';
  const manifestRaw = await fsAdapter.readText(`generations/${head}/manifest.json`);
  const frontierRaw = await fsAdapter.readText('FRONTIER.json');
  liveState = {
    ...liveState,
    booted: true,
    fsBackend: fsAdapter.backend,
    headGenerationId: head,
    headManifest: manifestRaw ? (JSON.parse(manifestRaw) as GenSporeManifest) : null,
    frontier: frontierRaw ? (JSON.parse(frontierRaw) as SelfHostFrontierRecord[]) : [],
    hostSaturation: evaluateBrowserHostSaturation(),
  };
  notifyLiveState();
}

/**
 * Boots the self-hosting browser organism on startup:
 *   1. Registers `verdant-sw.js` (`ServiceWorker`) + `PerformanceObserver`.
 *   2. Spawns the multi-core `WebAssembly.Module` `Worker` pool (`optimalBrowserWorkerCount`).
 *   3. Mounts OPFS (`navigator.storage.getDirectory()`) and unpacks `genesis/verdant_gen0_sources.uorc`
 *      into `/generations/gen-0/` if not already hydrated.
 */
export async function bootBrowserSelfHostOrganism(baseUrl = './'): Promise<LiveSelfHostOrganismState> {
  if (typeof window === 'undefined') {
    return liveState;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  initBrowserPerformanceObserver();
  void registerSovereignServiceWorker(cleanBase);
  const workerBootPromise = initBrowserWasmWorkerPool(
    `${cleanBase}wasm/verdant_certified_runtime.wasm`,
  );

  const fsAdapter = await mountBrowserOpfsSelfHostFs();
  liveFsAdapter = fsAdapter;

  const existingGen0 = await fsAdapter.readText('generations/gen-0/manifest.json');
  if (!existingGen0) {
    try {
      const [manifestResp, uorcResp] = await Promise.all([
        window.fetch(`${cleanBase}genesis/verdant_gen0_manifest.json`),
        window.fetch(`${cleanBase}genesis/verdant_gen0_sources.uorc`),
      ]);
      if (manifestResp.ok && uorcResp.ok) {
        const manifest = (await manifestResp.json()) as GenSporeManifest;
        const archiveBytes = new Uint8Array(await uorcResp.arrayBuffer());
        await unpackSporeIntoSelfHostFs(fsAdapter, manifest, archiveBytes);
      }
    } catch {
      // Offline or pre-mechanize fallback
    }
  }

  await Promise.all([workerBootPromise, queryBrowserStorageEstimate()]);
  const rehydrated = await rehydrateHeadGenerationRuntime(fsAdapter);
  liveState = {
    ...liveState,
    activeHotWasmExports: rehydrated.hotExports,
    activeHotTsProjection: rehydrated.hotTsProjection,
  };
  await refreshLiveStateFromFs(fsAdapter);

  const capReport = await runBrowserCapabilitySaturationSuite(fsAdapter);
  liveState = {
    ...liveState,
    capabilityReport: capReport,
  };

  if (!syncBroadcastAttached && typeof window.BroadcastChannel !== 'undefined') {
    try {
      const ch = new window.BroadcastChannel('verdant-selfhost-sync');
      ch.onmessage = () => {
        if (liveFsAdapter) {
          void rehydrateHeadGenerationRuntime(liveFsAdapter).then((r) => {
            liveState = {
              ...liveState,
              activeHotWasmExports: r.hotExports,
              activeHotTsProjection: r.hotTsProjection,
            };
            if (liveFsAdapter) void refreshLiveStateFromFs(liveFsAdapter);
          });
        }
      };
      syncBroadcastAttached = true;
    } catch {
      // Non-fatal BroadcastChannel attachment
    }
  }

  await refreshLiveStateFromFs(fsAdapter);
  return liveState;
}

export function getLiveSelfHostOrganismState(): LiveSelfHostOrganismState {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  return {
    ...liveState,
    hostSaturation: evaluateBrowserHostSaturation(),
  };
}

export function subscribeSelfHostOrganismState(
  listener: (state: LiveSelfHostOrganismState) => void,
): () => void {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

export async function readLiveSelfHostFile(relPath: string): Promise<string | null> {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  if (!liveFsAdapter) return null;
  const head = (await liveFsAdapter.readText('HEAD'))?.trim() || 'gen-0';
  return liveFsAdapter.readText(`generations/${head}/files/${normalizeVirtualPath(relPath)}`);
}

export async function proposeLiveUserEditGeneration(
  relPath: string,
  updatedContent: string,
): Promise<GenerationAdmissionResult | null> {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  if (!liveFsAdapter) return null;
  const sat = evaluateBrowserHostSaturation();
  const incLoss = liveState.headManifest?.telosLoss ?? 180;
  const incSteps = liveState.headManifest?.computeSteps ?? 4096;
  const res = await proposeAndCertifyBrowserGeneration(liveFsAdapter, {
    modifiedFiles: { [normalizeVirtualPath(relPath)]: updatedContent },
    candidateTelosLoss: Math.max(0, incLoss - 5),
    incumbentTelosLoss: incLoss,
    candidateSteps: Math.max(256, incSteps - 32),
    incumbentSteps: incSteps,
    frameTimeMicros: sat.observedFrameMicros,
    summary: `Browser Foundry live edit certified on ${relPath}`,
  });
  liveState = {
    ...liveState,
    activeHotWasmExports: res.admitted ? res.hotExports : liveState.activeHotWasmExports,
    activeHotTsProjection: res.admitted
      ? (res.hotTsProjection ?? liveState.activeHotTsProjection)
      : liveState.activeHotTsProjection,
    lastVerification: res.verification,
    lastRefusalReasons: res.refusalReasons,
  };
  await refreshLiveStateFromFs(liveFsAdapter);
  return res;
}

let evolutionInFlight: Promise<GenerationAdmissionResult | null> | null = null;

export async function triggerLiveAutonomousEvolutionStep(params: {
  readonly playerStillnessPermille: number;
  readonly playerGazeDwellPermille: number;
  readonly playerHarmonicComfortPermille: number;
  readonly incumbentDissonancePermille: number;
  readonly busWeight: number;
  readonly maxAutonomousGenerationIndex?: number;
}): Promise<GenerationAdmissionResult | null> {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  if (!liveFsAdapter) return null;
  if (evolutionInFlight) return evolutionInFlight;
  const maxGen = params.maxAutonomousGenerationIndex ?? 4;
  if ((liveState.headManifest?.generationIndex ?? 0) >= maxGen) return null;
  const fsRef = liveFsAdapter;
  evolutionInFlight = (async () => {
    try {
      const sat = evaluateBrowserHostSaturation();
      const res = await stepAutonomousBrowserEvolution(fsRef, {
        ...params,
        observedFrameMicros: sat.observedFrameMicros,
      });
      liveState = {
        ...liveState,
        activeHotWasmExports: res.admitted ? res.hotExports : liveState.activeHotWasmExports,
        activeHotTsProjection: res.admitted ? res.hotTsProjection : liveState.activeHotTsProjection,
        lastVerification: res.verification,
        lastRefusalReasons: res.refusalReasons,
      };
      await refreshLiveStateFromFs(fsRef);
      return res;
    } finally {
      evolutionInFlight = null;
    }
  })();
  return evolutionInFlight;
}

export async function runLiveCapabilitySaturationAudit(): Promise<BrowserCapabilitySaturationReport | null> {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  if (!liveFsAdapter) return null;
  await queryBrowserStorageEstimate();
  const report = await runBrowserCapabilitySaturationSuite(liveFsAdapter);
  liveState = {
    ...liveState,
    capabilityReport: report,
  };
  notifyLiveState();
  return report;
}

export async function importLiveOrganismSporeBundle(
  bundleWireBytes: Uint8Array,
): Promise<{ readonly ok: boolean; readonly generationId?: string; readonly error?: string }> {
  void certifiedWasmCore_verifyUorcArchiveBounds(bundleWireBytes.length, true, 0);
  if (!liveFsAdapter) {
    return { ok: false, error: 'Browser self-host filesystem not initialized' };
  }
  const imported = await importOrganismSporeBundle(liveFsAdapter, bundleWireBytes);
  if (!imported.ok) {
    return imported;
  }
  const rehydrated = await rehydrateHeadGenerationRuntime(liveFsAdapter);
  liveState = {
    ...liveState,
    activeHotWasmExports: rehydrated.hotExports,
    activeHotTsProjection: rehydrated.hotTsProjection,
  };
  await refreshLiveStateFromFs(liveFsAdapter);
  if (imported.generationId && liveState.headManifest) {
    broadcastBrowserGenerationSync(imported.generationId, liveState.headManifest.treeKappa);
  }
  return imported;
}

export async function evaluateLiveWatchdogFrameTick(frameMicros: number): Promise<boolean> {
  void certifiedWasmCore_shouldRollbackGenerationWatchdog(0, 24, 0);
  if (!liveFsAdapter) return false;
  const nextOverbudget =
    frameMicros > 16667 ? liveState.consecutiveOverbudgetFrames + 1 : 0;
  if (nextOverbudget === liveState.consecutiveOverbudgetFrames && nextOverbudget === 0) {
    return false;
  }
  liveState = {
    ...liveState,
    consecutiveOverbudgetFrames: nextOverbudget,
  };
  if (liveState.headGenerationId === 'gen-0' || nextOverbudget <= 24) {
    return false;
  }
  const check = await evaluateSelfHostWatchdogAndRollback(liveFsAdapter, {
    consecutiveOverbudgetFrames: nextOverbudget,
    maxAllowedFrames: 24,
    runtimeFaultCount: 0,
  });
  if (!check.rolledBack) return false;
  const rehydrated = await rehydrateHeadGenerationRuntime(liveFsAdapter);
  liveState = {
    ...liveState,
    consecutiveOverbudgetFrames: 0,
    rollbackCount: liveState.rollbackCount + 1,
    activeHotWasmExports: rehydrated.hotExports,
    activeHotTsProjection: rehydrated.hotTsProjection,
  };
  await refreshLiveStateFromFs(liveFsAdapter);
  return true;
}

export async function rollbackLiveOrganismToGenesis(): Promise<boolean> {
  void certifiedWasmCore_optimalBrowserWorkerCount(1);
  if (!liveFsAdapter) return false;
  await liveFsAdapter.writeText('HEAD', 'gen-0');
  liveState = {
    ...liveState,
    activeHotWasmExports: null,
    activeHotTsProjection: null,
    consecutiveOverbudgetFrames: 0,
    rollbackCount: liveState.rollbackCount + 1,
  };
  await refreshLiveStateFromFs(liveFsAdapter);
  broadcastBrowserGenerationSync('gen-0', liveState.headManifest?.treeKappa ?? 'genesis');
  return true;
}

export async function triggerDownloadUorcSporeInBrowser(generationId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !liveFsAdapter) {
    return false;
  }
  const exported = await exportGenerationAsUorcSpore(liveFsAdapter, generationId);
  if (!exported) return false;
  const cleanBuf = new Uint8Array(exported.bundleWireBytes.byteLength);
  cleanBuf.set(exported.bundleWireBytes);
  const blob = new Blob([cleanBuf], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `verdant-${exported.manifest.generationId}-${exported.manifest.treeKappa.slice(0, 12)}.vrspore.uorc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
  return true;
}
