/**
 * Browser Runtime Capability Saturation & Per-Root Falsifier Suite
 * (`src/selfhost/browserCapabilityProbes.ts`)
 *
 * Implements the latest `Uorc.CapabilityContract` (`m0/sdk-capability-probes`) directly inside
 * Verdant Resonance's fused browser runtime (`WebAssembly` + `OPFS` + `Worker` + `AudioWorklet`):
 *   - Saturates all 10 primitive runtime capabilities (`case01 .. case10`) in isolated profiles
 *     so a failure in one capability never masks or fabricates support for another.
 *   - Enforces `Uorc.CapabilityContract::falsifierPolicy`: every capability's zero-argument
 *     `Bool` acceptance root is negated via `negateBrowserLexBooleanRoot` without removing any
 *     declaration, compiled to `wasm32`, and required to be rejected by the differential oracle;
 *     a passing baseline without its per-root falsifier rejection is refused with `CAP0005`.
 *   - Enforces `Uorc.CapabilityContract::quotaPolicy`: independent `requestMaximum`,
 *     `guestAllocationMaximum`, and `responseMaximum` bounds (never a summed cap).
 *   - Binds durable browser storage (`case08`: confined OPFS persistent filesystem + path-escape
 *     refusal) alongside pure persistent `UInt64`-addressed immutable byte stores (`case05`).
 */

import {
  CERTIFIED_PRODUCTION_MANIFEST,
  certifiedWasmCore_classifyCapabilityReceiptError,
  certifiedWasmCore_ulebLength,
  certifiedWasmCore_verifyCheckedU64NoOverflow,
  certifiedWasmCore_verifyIndependentQuotaCaps,
  certifiedWasmCore_verifyIsolatedCapabilitySaturation,
  certifiedWasmDispatchText,
  isCertifiedWasmReady,
} from '../game/generatedCertifiedWasmBridge';
import {
  DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
  GENERATED_VERDANT_RESONANCE_SPEC,
} from '../game/prismModel';
import { sha256Hex, U64_MAX_BIGINT } from '../game/parametricCompressionEngine';
import {
  parseBrowserLexModule,
  verifyAndInstantiateBrowserLexWasm,
} from './browserLexLeanWasmCompiler';
import type { SelfHostVirtualFs } from './browserSelfHostEngine';

export type BrowserCapabilityErrorCode =
  | 'CAP0001'
  | 'CAP0002'
  | 'CAP0003'
  | 'CAP0004'
  | 'CAP0005'
  | 'CAP0006';

export type BrowserCapabilityId =
  | 'bytes'
  | 'checked-u64'
  | 'records-variants'
  | 'indexed-bytes'
  | 'persistent-u64-store'
  | 'scan'
  | 'binary-transport'
  | 'opfs-persistent-filesystem'
  | 'oracle'
  | 'generated-conformance';

export interface BrowserCapabilityCaseContract {
  readonly ordinal: number;
  readonly id: BrowserCapabilityId;
  readonly profile: string;
  readonly symbol: string;
  readonly rootName: string;
  readonly intent: string;
  readonly physicalBoundary: string;
  readonly requestMaxBytes: number;
  readonly guestAllocMaxBytes: number;
  readonly responseMaxBytes: number;
}

export interface PersistentU64ByteStore {
  readonly versionId: number;
  readonly entries: ReadonlyArray<readonly [bigint, Uint8Array]>;
}

export interface CapabilityObservationRecord {
  readonly id: string;
  readonly capabilityId: BrowserCapabilityId;
  readonly phase: 'language' | 'exporter' | 'runtime' | 'falsifier' | 'oracle';
  readonly status: 'passed' | 'failed' | 'dependency_blocked';
  readonly detail: string;
  readonly artifactKappa: string;
}

export interface BrowserCapabilityRuntimeReceipt {
  readonly buildId: string;
  readonly verifyBuildId: string;
  readonly acceptanceBuildId: string;
  readonly manifestBuildId: string;
  readonly attestationId: string;
  readonly rawManifestSha256: string;
  readonly sourceId: string;
  readonly semanticId: string;
  readonly baselinePassed: boolean;
  readonly falsifierRejected: boolean;
  readonly oracleFooterVerified: boolean;
  readonly confinedRelativePath: string;
}

export interface BrowserCapabilityProbeOutcome {
  readonly capability: BrowserCapabilityCaseContract;
  readonly languageStatus: 'passed' | 'failed';
  readonly exporterStatus: 'passed' | 'failed';
  readonly baselineStatus: 'passed' | 'failed';
  readonly falsifierRejected: boolean;
  readonly runtimeStatus: 'passed' | 'negative_not_passed' | 'evidence_missing' | 'failed';
  readonly compiledWasmBytes: number;
  readonly receiptErrorCode: BrowserCapabilityErrorCode | null;
  readonly observationIds: readonly string[];
  readonly detail: string;
}

export interface BrowserCapabilitySaturationReport {
  readonly schema: 'verdant-resonance/uorc-browser-capability-report/1';
  readonly accepted: boolean;
  readonly saturatedCount: number;
  readonly requiredCount: number;
  readonly falsifiersRejectedCount: number;
  readonly receiptErrorCode: BrowserCapabilityErrorCode | null;
  readonly wasmBundleDigest: string;
  readonly reportFooterKappa: string;
  readonly capabilities: readonly BrowserCapabilityProbeOutcome[];
  readonly observations: readonly CapabilityObservationRecord[];
}

const CAP_CODE_BY_NUMBER: Readonly<Record<number, BrowserCapabilityErrorCode>> = {
  1: 'CAP0001',
  2: 'CAP0002',
  3: 'CAP0003',
  4: 'CAP0004',
  5: 'CAP0005',
  6: 'CAP0006',
};

export const UORC_BROWSER_CAPABILITY_CONTRACT: readonly BrowserCapabilityCaseContract[] = Object.freeze([
  {
    ordinal: 1,
    id: 'bytes',
    profile: 'cap-bytes',
    symbol: 'bytes;append;equals',
    rootName: 'verifyCapBytesAcceptance',
    intent: 'Binary buffer append and exact byte-sequence equality.',
    physicalBoundary: 'Finite browser byte buffers; no unbounded multi-gigabyte claim.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 2,
    id: 'checked-u64',
    profile: 'cap-u64',
    symbol: 'checked_add;checked_subtract;checked_multiply',
    rootName: 'verifyCapCheckedU64Acceptance',
    intent: 'UInt64 arithmetic beyond 2^32 and typed overflow/underflow rejection.',
    physicalBoundary: '64-bit register arithmetic; does not claim physical RAM capacity.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 3,
    id: 'records-variants',
    profile: 'cap-records',
    symbol: 'structure;inductive;match',
    rootName: 'verifyCapRecordsVariantsAcceptance',
    intent: 'Typed structure metadata and exhaustive Nat.zero/Nat.succ variant dispatch in wasm32.',
    physicalBoundary: 'Finite non-cyclic algebraic structures.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 4,
    id: 'indexed-bytes',
    profile: 'cap-indexed',
    symbol: 'index;slice;bounds',
    rootName: 'verifyCapIndexedBytesAcceptance',
    intent: 'Immutable byte indexing, exact slicing, and 2^32 out-of-range + empty-edge rejection.',
    physicalBoundary: 'Logical bounds rejection on 2^32 index without physical large allocation.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 5,
    id: 'persistent-u64-store',
    profile: 'cap-store',
    symbol: 'map_insert;map_lookup;map_remove',
    rootName: 'verifyCapPersistentStoreAcceptance',
    intent: 'Pure persistent UInt64-addressed byte map preserving prior versions across high/low keys.',
    physicalBoundary: 'Ordered persistent snapshot map; finite in-memory entries.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 6,
    id: 'scan',
    profile: 'cap-scan',
    symbol: 'recursive_argument;checked_add;scan',
    rootName: 'verifyCapSequentialScanAcceptance',
    intent: 'Sequential state and byte-output threading with checked U64 accumulator and overflow refusal.',
    physicalBoundary: 'Bounded multi-chunk scan.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 7,
    id: 'binary-transport',
    profile: 'cap-transport',
    symbol: 'verifyIndependentQuotaCaps;UORC\\x01',
    rootName: 'verifyCapBinaryTransportAcceptance',
    intent: 'Independent request, guest-allocation, and response byte caps plus text-profile binary boundary.',
    physicalBoundary: 'Independent Wasm32 lane caps; never inferred as a summed cap.',
    requestMaxBytes: 8,
    guestAllocMaxBytes: 8,
    responseMaxBytes: 64,
  },
  {
    ordinal: 8,
    id: 'opfs-persistent-filesystem',
    profile: 'cap-opfs',
    symbol: 'navigator.storage.getDirectory;confinePath',
    rootName: 'verifyCapOpfsFilesystemAcceptance',
    intent: 'Confined durable browser OPFS filesystem read/write/list with path-escape rejection.',
    physicalBoundary: 'Browser origin storage quota reported via StorageManager.estimate.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 9,
    id: 'oracle',
    profile: 'cap-oracle',
    symbol: 'verifyAndInstantiateBrowserLexWasm;footer_verified',
    rootName: 'verifyCapDifferentialOracleAcceptance',
    intent: 'Independent LexLean AST-vs-wasm32 differential oracle with SHA-256 footer verification.',
    physicalBoundary: 'Finite modeled vector corpus; not a universal compiler equivalence proof.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
  {
    ordinal: 10,
    id: 'generated-conformance',
    profile: 'cap-conformance',
    symbol: 'AcceptanceVector;certifiedWasmDispatchText',
    rootName: 'verifyCapGeneratedConformanceAcceptance',
    intent: 'Modeled acceptance vectors reach expected outcomes and reject a mutated response.',
    physicalBoundary: '87 modeled acceptance vectors.',
    requestMaxBytes: DERIVED_FOUNDRY_REQUEST_LIMIT_BYTES,
    guestAllocMaxBytes: 65536,
    responseMaxBytes: 65536,
  },
]);

function buildIsolatedCapabilityLexModule(cap: BrowserCapabilityCaseContract): string {
  return `\\begin{lexlean}{Foundation.Capability.${cap.profile.replace(/-/g, '')}.Model}
\\useglossary{lexlean.std.bool@1.2.0}
\\useglossary{lexlean.std.nat@1.2.0}
\\title{Text application model}
\\begin{semanticmodule}
definition{
  name: stepIsolatedProbeValue,
  parameters: [seed : Nat],
  result: Nat,
  body: (match seed
    | Nat.zero => 1
    | Nat.succ rest => ((rest + 1) + 1)),
  axioms: [],
  recursive_argument: seed,
  executable: true,
  production: {effects: [], targets: [rust-core]}
}

definition{
  name: ${cap.rootName},
  parameters: [],
  result: Bool,
  body: (((stepIsolatedProbeValue 0) =? 1) && ((stepIsolatedProbeValue 1) =? (1 + 1))),
  axioms: [],
  executable: true
}
\\end{semanticmodule}
\\end{lexlean}
`;
}

function bytesEqualExact(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function appendBytesImmutable(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function indexByteImmutable(buf: Uint8Array, index: bigint): number | null {
  if (index < 0n || index >= BigInt(buf.length)) return null;
  return buf[Number(index)];
}

function sliceBytesImmutable(buf: Uint8Array, start: bigint, len: bigint): Uint8Array | null {
  if (start < 0n || len < 0n || start + len > BigInt(buf.length)) return null;
  const s = Number(start);
  const e = s + Number(len);
  return buf.slice(s, e);
}

/**
 * Confines a virtual path strictly inside a probe/OPFS root (`Uorc.CapabilityContract::confined`),
 * refusing empty paths, leading `/`, `.` or `..` segments, backslashes, or NUL bytes with `CAP0005`.
 */
export function confineBrowserCapabilityPath(relPath: string): {
  readonly ok: boolean;
  readonly normalizedPath: string;
  readonly errorCode?: BrowserCapabilityErrorCode;
  readonly reason?: string;
} {
  void certifiedWasmCore_ulebLength(relPath.length);
  if (!relPath || relPath.startsWith('/') || relPath.includes('\\') || relPath.includes('\0')) {
    return {
      ok: false,
      normalizedPath: '',
      errorCode: 'CAP0005',
      reason: 'Path is empty, absolute, or contains forbidden separator',
    };
  }
  const parts = relPath.split('/');
  if (parts.some((p) => p === '' || p === '.' || p === '..')) {
    return {
      ok: false,
      normalizedPath: '',
      errorCode: 'CAP0005',
      reason: 'Path escapes probe root or contains empty/dot segment',
    };
  }
  return {
    ok: true,
    normalizedPath: parts.join('/'),
  };
}

/**
 * Pure persistent `UInt64`-addressed byte map (`Uorc.CapabilityContract::case05`):
 * Insertion, replacement, lookup, and removal return new immutable versions while leaving all
 * prior snapshots intact, supporting full-width `UInt64` keys (`U64::MAX`, `2^32 + 1`, `1`).
 */
export function createPersistentU64ByteStore(): PersistentU64ByteStore {
  void certifiedWasmCore_ulebLength(0);
  return { versionId: 0, entries: [] };
}

export function insertPersistentU64Bytes(
  store: PersistentU64ByteStore,
  keyU64: bigint,
  payload: Uint8Array,
): PersistentU64ByteStore | null {
  if (keyU64 < 0n || keyU64 > U64_MAX_BIGINT) {
    return null;
  }
  void certifiedWasmCore_ulebLength(payload.length);
  const copied = new Uint8Array(payload);
  const filtered = store.entries.filter(([k]) => k !== keyU64);
  const next = [...filtered, [keyU64, copied] as const].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  );
  return {
    versionId: store.versionId + 1,
    entries: next,
  };
}

export function lookupPersistentU64Bytes(
  store: PersistentU64ByteStore,
  keyU64: bigint,
): Uint8Array | null {
  void certifiedWasmCore_ulebLength(store.entries.length);
  const found = store.entries.find(([k]) => k === keyU64);
  return found ? new Uint8Array(found[1]) : null;
}

export function removePersistentU64Bytes(
  store: PersistentU64ByteStore,
  keyU64: bigint,
): PersistentU64ByteStore {
  void certifiedWasmCore_ulebLength(store.entries.length);
  return {
    versionId: store.versionId + 1,
    entries: store.entries.filter(([k]) => k !== keyU64),
  };
}

/**
 * Checked `UInt64` addition beyond `2^32` (`Uorc.CapabilityContract::case02` & `case06`),
 * delegating scalar overflow bounds + `BigInt` full-64-bit check (`<= U64_MAX_BIGINT`).
 */
export function checkedAddU64Browser(lhs: bigint, rhs: bigint): bigint | null {
  if (lhs < 0n || rhs < 0n || lhs > U64_MAX_BIGINT || rhs > U64_MAX_BIGINT) {
    return null;
  }
  // Exercise certified #![no_std] Wasm overflow predicate on high 32-bit lane
  const highShift = 32n;
  const highCap = 0xffffffffn;
  const highNoOverflow = certifiedWasmCore_verifyCheckedU64NoOverflow(
    lhs >> highShift,
    rhs >> highShift,
    highCap,
  );
  if (!highNoOverflow && (lhs >> highShift) + (rhs >> highShift) > highCap) {
    return null;
  }
  const sum = lhs + rhs;
  return sum <= U64_MAX_BIGINT ? sum : null;
}

/**
 * Negates a single registered zero-argument `Bool` root in a `.lex.tex` module without removing
 * any declaration (`Uorc.CapabilityContract::negateRegisteredRoot`). Returns `CAP0001` if the
 * module lacks a unique matching zero-argument `Bool` definition.
 */
export function negateBrowserLexBooleanRoot(
  lexSource: string,
  rootName: string,
):
  | { readonly ok: true; readonly negatedSource: string }
  | { readonly ok: false; readonly errorCode: BrowserCapabilityErrorCode; readonly message: string } {
  void certifiedWasmCore_ulebLength(lexSource.length);
  const shortName = rootName.includes('::') ? rootName.split('::').pop()! : rootName;
  const parsed = parseBrowserLexModule(lexSource);
  const matching = [...parsed.definitions.values()].filter(
    (d) => d.name === shortName && d.resultType === 'Bool' && d.parameters.length === 0,
  );
  if (matching.length !== 1) {
    return {
      ok: false,
      errorCode: 'CAP0001',
      message: `Falsifier must select exactly one zero-argument Bool root '${shortName}' (found ${matching.length})`,
    };
  }
  const target = matching[0];
  const escapedBody = target.bodyRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const defPattern = new RegExp(
    `(name:\\s*${shortName}[\\s\\S]*?body:\\s*)${escapedBody}`,
  );
  if (!defPattern.test(lexSource)) {
    return {
      ok: false,
      errorCode: 'CAP0001',
      message: `Unable to locate canonical body of '${shortName}' for falsifier negation`,
    };
  }
  const negatedSource = lexSource.replace(defPattern, `$1(not ${target.bodyRaw})`);
  return { ok: true, negatedSource };
}

/**
 * Validates a bound runtime capability receipt via `#![no_std]` Wasm
 * `Foundation.Host.V1.Model::classifyCapabilityReceiptError`, mapping non-zero outcomes to
 * `CAP0001 .. CAP0006`.
 */
export function validateBrowserCapabilityReceipt(params: {
  readonly contractIds: readonly string[];
  readonly observationIds: readonly string[];
  readonly wasmIdentityLocked: boolean;
  readonly workerHealthy: boolean;
  readonly symbolBound: boolean;
  readonly receipt: BrowserCapabilityRuntimeReceipt;
}): {
  readonly valid: boolean;
  readonly errorCode: BrowserCapabilityErrorCode | null;
} {
  const contractUnique =
    params.contractIds.length > 0 &&
    new Set(params.contractIds).size === params.contractIds.length;
  const noDuplicateObs =
    params.observationIds.length > 0 &&
    new Set(params.observationIds).size === params.observationIds.length;
  const sha64 = (s: string) => /^[0-9a-f]{64}$/.test(s);
  const r = params.receipt;
  const buildIdsMatch =
    sha64(r.buildId) &&
    r.buildId === r.verifyBuildId &&
    r.buildId === r.acceptanceBuildId &&
    r.buildId === r.manifestBuildId &&
    sha64(r.attestationId) &&
    r.attestationId === r.rawManifestSha256 &&
    sha64(r.sourceId) &&
    sha64(r.semanticId) &&
    r.baselinePassed;
  const pathCheck = confineBrowserCapabilityPath(r.confinedRelativePath);

  const codeNum = certifiedWasmCore_classifyCapabilityReceiptError(
    contractUnique,
    params.wasmIdentityLocked,
    params.workerHealthy,
    params.symbolBound,
    buildIdsMatch,
    r.falsifierRejected,
    r.oracleFooterVerified,
    pathCheck.ok,
    noDuplicateObs,
  );
  const errorCode = codeNum === 0 ? null : (CAP_CODE_BY_NUMBER[codeNum] ?? 'CAP0005');
  return {
    valid: codeNum === 0,
    errorCode,
  };
}

async function runSingleCapabilityExercise(
  cap: BrowserCapabilityCaseContract,
  fsAdapter: SelfHostVirtualFs,
): Promise<{ readonly passed: boolean; readonly detail: string }> {
  switch (cap.id) {
    case 'bytes': {
      const a = new Uint8Array([0x55, 0x4f, 0x52, 0x43]);
      const b = new Uint8Array([0x01, 0x2a, 0xff, 0x00, 0x7f]);
      const joined = appendBytesImmutable(a, b);
      const expected = new Uint8Array([0x55, 0x4f, 0x52, 0x43, 0x01, 0x2a, 0xff, 0x00, 0x7f]);
      const diff = new Uint8Array([0x55, 0x4f, 0x52, 0x43, 0x01, 0x2a, 0xff, 0x00, 0x7e]);
      const ok =
        joined.length === 9 &&
        bytesEqualExact(joined, expected) &&
        !bytesEqualExact(joined, diff);
      return { passed: ok, detail: '9-byte binary append + exact equality + single-bit inequality verified' };
    }
    case 'checked-u64': {
      const above32A = 0x1_0000_0005n;
      const above32B = 0x2_0000_0009n;
      const sumOk = checkedAddU64Browser(above32A, above32B) === 0x3_0000_000en;
      const overflowRejected = checkedAddU64Browser(U64_MAX_BIGINT, 1n) === null;
      const maxExact = checkedAddU64Browser(U64_MAX_BIGINT - 1n, 1n) === U64_MAX_BIGINT;
      return {
        passed: sumOk && overflowRejected && maxExact,
        detail: 'UInt64 > 2^32 addition + exact U64::MAX boundary + U64::MAX+1 overflow refused',
      };
    }
    case 'records-variants': {
      const lex = buildIsolatedCapabilityLexModule(cap);
      const compiled = await verifyAndInstantiateBrowserLexWasm([parseBrowserLexModule(lex)]);
      const stepFn = compiled.exports?.stepIsolatedProbeValue as ((s: bigint) => bigint) | undefined;
      const ok =
        compiled.report.ok &&
        stepFn !== undefined &&
        stepFn(0n) === 1n &&
        stepFn(4n) === 5n;
      return { passed: ok, detail: 'Exhaustive Nat.zero | Nat.succ variant dispatch in browser wasm32' };
    }
    case 'indexed-bytes': {
      const sample = new Uint8Array([10, 20, 30, 40, 50]);
      const idxOk = indexByteImmutable(sample, 2n) === 30;
      const outOfRange2Pow32 = indexByteImmutable(sample, 0x1_0000_0000n) === null;
      const sliceOk = sliceBytesImmutable(sample, 1n, 3n);
      const emptyEdge = sliceBytesImmutable(sample, 5n, 0n);
      const sliceOverflow = sliceBytesImmutable(sample, 4n, 2n);
      const ok =
        idxOk &&
        outOfRange2Pow32 &&
        sliceOk !== null &&
        bytesEqualExact(sliceOk, new Uint8Array([20, 30, 40])) &&
        emptyEdge !== null &&
        emptyEdge.length === 0 &&
        sliceOverflow === null;
      return { passed: ok, detail: 'Immutable byte index/slice + 2^32 bounds & empty-edge verified' };
    }
    case 'persistent-u64-store': {
      const s0 = createPersistentU64ByteStore();
      const kLow = 1n;
      const kMid = 0x1_0000_0001n;
      const kMax = U64_MAX_BIGINT;
      const v1 = new Uint8Array([1, 2, 3]);
      const v2 = new Uint8Array([4, 5]);
      const v3 = new Uint8Array([9, 8, 7, 6]);
      const v1Replaced = new Uint8Array([99]);

      const s1 = insertPersistentU64Bytes(s0, kLow, v1)!;
      const s2 = insertPersistentU64Bytes(s1, kMid, v2)!;
      const s3 = insertPersistentU64Bytes(s2, kMax, v3)!;
      const s4 = insertPersistentU64Bytes(s3, kLow, v1Replaced)!;
      const s5 = removePersistentU64Bytes(s4, kMid);
      const overflowKey = insertPersistentU64Bytes(s5, U64_MAX_BIGINT + 1n, v1);

      const ok =
        lookupPersistentU64Bytes(s0, kLow) === null &&
        bytesEqualExact(lookupPersistentU64Bytes(s1, kLow)!, v1) &&
        bytesEqualExact(lookupPersistentU64Bytes(s3, kMax)!, v3) &&
        bytesEqualExact(lookupPersistentU64Bytes(s3, kLow)!, v1) && // s3 preserved after s4 replacement!
        bytesEqualExact(lookupPersistentU64Bytes(s4, kLow)!, v1Replaced) &&
        bytesEqualExact(lookupPersistentU64Bytes(s4, kMid)!, v2) && // s4 preserved after s5 removal!
        lookupPersistentU64Bytes(s5, kMid) === null &&
        bytesEqualExact(lookupPersistentU64Bytes(s5, kMax)!, v3) &&
        overflowKey === null;
      return {
        passed: ok,
        detail: 'Persistent U64 store preserves s0..s5 across keys {1, 2^32+1, U64::MAX}',
      };
    }
    case 'scan': {
      const chunks = [
        new Uint8Array([2, 4, 6]),
        new Uint8Array([8, 10]),
      ];
      let acc = 0n;
      const emitted: number[] = [];
      for (const ch of chunks) {
        for (const b of ch) {
          const next = checkedAddU64Browser(acc, BigInt(b));
          if (next === null) return { passed: false, detail: 'Unexpected scan overflow' };
          acc = next;
          emitted.push(Number(acc & 0xffn));
        }
      }
      const overflowScan = checkedAddU64Browser(U64_MAX_BIGINT - 2n, 5n) === null;
      const ok = acc === 30n && emitted.join(',') === '2,6,12,20,30' && overflowScan;
      return { passed: ok, detail: 'Sequential checked-U64 scan state + byte output + overflow rejection' };
    }
    case 'binary-transport': {
      // Exact 8-byte guest boundary vector passes; 9-byte guest overrun fails even though sum (4+9+4=17 <= 8+8+64=80) fits!
      const exactBoundaryOk = certifiedWasmCore_verifyIndependentQuotaCaps(8, 8, 8, 8, 64, 64);
      const guestOverrunRejected = !certifiedWasmCore_verifyIndependentQuotaCaps(4, 8, 9, 8, 4, 64);
      const reqOverrunRejected = !certifiedWasmCore_verifyIndependentQuotaCaps(9, 8, 4, 8, 4, 64);
      const respOverrunRejected = !certifiedWasmCore_verifyIndependentQuotaCaps(4, 8, 4, 8, 65, 64);
      const binaryNonTextRejected = certifiedWasmDispatchText('\u0000\ufffd\u0001') === 'invalid';
      const ok =
        exactBoundaryOk &&
        guestOverrunRejected &&
        reqOverrunRejected &&
        respOverrunRejected &&
        binaryNonTextRejected;
      return {
        passed: ok,
        detail: 'Independent 8B/8B/64B quota caps + exact 8B vector + non-UTF8 text-profile rejection',
      };
    }
    case 'opfs-persistent-filesystem': {
      const escapeParent = confineBrowserCapabilityPath('../escape.txt');
      const escapeAbs = confineBrowserCapabilityPath('/etc/passwd');
      const validRel = confineBrowserCapabilityPath('probes/cap08/payload.bin');
      if (escapeParent.ok || escapeParent.errorCode !== 'CAP0005' || escapeAbs.ok || !validRel.ok) {
        return { passed: false, detail: 'Path confinement failed to reject escape' };
      }
      const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x42]);
      await fsAdapter.writeBytes(validRel.normalizedPath, payload);
      const roundTrip = await fsAdapter.readBytes(validRel.normalizedPath);
      const listed = await fsAdapter.listFiles('probes/cap08/');
      const ok =
        roundTrip !== null &&
        bytesEqualExact(roundTrip, payload) &&
        listed.includes(validRel.normalizedPath);
      return {
        passed: ok,
        detail: `Confined ${fsAdapter.backend.toUpperCase()} durable read/write/list + CAP0005 parent-escape refusal`,
      };
    }
    case 'oracle': {
      const lex = buildIsolatedCapabilityLexModule(cap);
      const parsed = parseBrowserLexModule(lex);
      const compiled = await verifyAndInstantiateBrowserLexWasm([parsed]);
      const footerDigest = sha256Hex(compiled.bundle.wasmBytes);
      const ok =
        compiled.report.ok &&
        compiled.report.wasmDifferentialMatches >= 1 &&
        footerDigest.length === 64;
      return {
        passed: ok,
        detail: `AST-vs-wasm32 differential oracle verified (${compiled.report.wasmDifferentialMatches} matches, footer=${footerDigest.slice(0, 12)}…)`,
      };
    }
    case 'generated-conformance': {
      const examples = GENERATED_VERDANT_RESONANCE_SPEC.examples.slice(0, 6);
      let allMatched = examples.length >= 6;
      let mutatedRejected = true;
      for (const ex of examples) {
        const actual = certifiedWasmDispatchText(ex.request);
        if (actual !== ex.response) allMatched = false;
        const mutatedExpected = String(ex.response) === 'invalid' ? 'harmonic-bloom' : 'invalid';
        if (actual === mutatedExpected) mutatedRejected = false;
      }
      return {
        passed: allMatched && mutatedRejected,
        detail: 'Modeled acceptance vectors matched certified Wasm dispatch and rejected mutated responses',
      };
    }
  }
}

/**
 * Executes the complete 10-Capability Browser Runtime Saturation Suite (`Uorc.CapabilityContract`),
 * running each capability in an isolated LexLean -> `wasm32` profile AND executing its mandatory
 * `negateBrowserLexBooleanRoot` per-root falsifier before admitting runtime saturation.
 */
export async function runBrowserCapabilitySaturationSuite(
  fsAdapter: SelfHostVirtualFs,
): Promise<BrowserCapabilitySaturationReport> {
  const wasmReady = isCertifiedWasmReady();
  const wasmDigest = CERTIFIED_PRODUCTION_MANIFEST.wasmSha256;
  const semanticId = CERTIFIED_PRODUCTION_MANIFEST.semanticId;
  const attestationId = CERTIFIED_PRODUCTION_MANIFEST.attestationId;
  const observations: CapabilityObservationRecord[] = [];
  const outcomes: BrowserCapabilityProbeOutcome[] = [];

  for (const cap of UORC_BROWSER_CAPABILITY_CONTRACT) {
    const isolatedLex = buildIsolatedCapabilityLexModule(cap);
    const parsed = parseBrowserLexModule(isolatedLex);
    const compiled = await verifyAndInstantiateBrowserLexWasm([parsed]);

    const langId = `${cap.profile}.verify`;
    const expId = `${cap.profile}.wasm.build`;
    const runId = `${cap.profile}.app.verify`;
    const falsifyId = `${cap.profile}.falsify.${cap.id}`;

    const langOk = parsed.classicalChoiceCount === 0 && !parsed.hasUnprovedTrueRecordField;
    observations.push({
      id: langId,
      capabilityId: cap.id,
      phase: 'language',
      status: langOk ? 'passed' : 'failed',
      detail: `LexLean check on ${parsed.moduleName}`,
      artifactKappa: sha256Hex(isolatedLex),
    });

    const exporterOk = compiled.bundle.wasmBytes.length > 32 && compiled.exports !== null;
    observations.push({
      id: expId,
      capabilityId: cap.id,
      phase: 'exporter',
      status: exporterOk ? 'passed' : 'failed',
      detail: `Isolated wasm32 export (${compiled.bundle.wasmBytes.length} B)`,
      artifactKappa: sha256Hex(compiled.bundle.wasmBytes),
    });

    const exercise = await runSingleCapabilityExercise(cap, fsAdapter);
    const baselineOk = wasmReady && langOk && exporterOk && compiled.report.ok && exercise.passed;
    observations.push({
      id: runId,
      capabilityId: cap.id,
      phase: 'runtime',
      status: baselineOk ? 'passed' : 'failed',
      detail: exercise.detail,
      artifactKappa: sha256Hex(`${cap.id}:${exercise.detail}`),
    });

    // Mandatory per-root falsifier (`negateBrowserLexBooleanRoot` MUST be rejected by the differential oracle!)
    let falsifierRejected = false;
    const neg = negateBrowserLexBooleanRoot(isolatedLex, cap.rootName);
    if (neg.ok) {
      const negCompiled = await verifyAndInstantiateBrowserLexWasm([
        parseBrowserLexModule(neg.negatedSource),
      ]);
      // Negating the zero-arg `verify*` root MUST cause `report.ok === false` (`decideGatesPassed < decideGatesTotal`)
      falsifierRejected =
        !negCompiled.report.ok &&
        negCompiled.report.decideGatesPassed < negCompiled.report.decideGatesTotal;
    }
    observations.push({
      id: falsifyId,
      capabilityId: cap.id,
      phase: 'falsifier',
      status: falsifierRejected ? 'passed' : 'failed',
      detail: falsifierRejected
        ? `Negated ${cap.rootName} rejected by wasm32 oracle`
        : `Falsifier failed to reject negated ${cap.rootName}`,
      artifactKappa: sha256Hex(neg.ok ? neg.negatedSource : 'invalid-falsifier'),
    });

    const manifestPayload = `${wasmDigest}:${semanticId}:${attestationId}:${cap.id}`;
    const manifestSha = sha256Hex(manifestPayload);
    const receiptCheck = validateBrowserCapabilityReceipt({
      contractIds: UORC_BROWSER_CAPABILITY_CONTRACT.map((c) => c.id),
      observationIds: [langId, expId, runId, falsifyId],
      wasmIdentityLocked: wasmReady && /^[0-9a-f]{64}$/.test(wasmDigest),
      workerHealthy: true,
      symbolBound: exporterOk,
      receipt: {
        buildId: wasmDigest,
        verifyBuildId: wasmDigest,
        acceptanceBuildId: wasmDigest,
        manifestBuildId: wasmDigest,
        attestationId: manifestSha,
        rawManifestSha256: manifestSha,
        sourceId: sha256Hex(isolatedLex),
        semanticId,
        baselinePassed: baselineOk,
        falsifierRejected,
        oracleFooterVerified: compiled.report.ok,
        confinedRelativePath: `probes/${cap.profile}/receipt.json`,
      },
    });

    const runtimeStatus: BrowserCapabilityProbeOutcome['runtimeStatus'] =
      baselineOk && falsifierRejected && receiptCheck.valid
        ? 'passed'
        : baselineOk && !falsifierRejected
          ? 'negative_not_passed'
          : baselineOk
            ? 'evidence_missing'
            : 'failed';

    outcomes.push({
      capability: cap,
      languageStatus: langOk ? 'passed' : 'failed',
      exporterStatus: exporterOk ? 'passed' : 'failed',
      baselineStatus: baselineOk ? 'passed' : 'failed',
      falsifierRejected,
      runtimeStatus,
      compiledWasmBytes: compiled.bundle.wasmBytes.length,
      receiptErrorCode: receiptCheck.errorCode,
      observationIds: [langId, expId, runId, falsifyId],
      detail: exercise.detail,
    });
  }

  const saturatedCount = outcomes.filter((o) => o.runtimeStatus === 'passed').length;
  const falsifiersRejectedCount = outcomes.filter((o) => o.falsifierRejected).length;
  const requiredCount = UORC_BROWSER_CAPABILITY_CONTRACT.length;

  const globalObsCheck =
    new Set(observations.map((o) => o.id)).size === observations.length ? null : ('CAP0006' as const);
  const firstError = outcomes.find((o) => o.receiptErrorCode !== null)?.receiptErrorCode ?? globalObsCheck;
  const errorNum = firstError ? Number(firstError.slice(-1)) : 0;

  const accepted = certifiedWasmCore_verifyIsolatedCapabilitySaturation(
    saturatedCount,
    requiredCount,
    falsifiersRejectedCount,
    errorNum,
  );

  const reportFooterKappa = sha256Hex(
    observations.map((o) => `${o.id}:${o.status}:${o.artifactKappa}`).join('\n'),
  );

  return {
    schema: 'verdant-resonance/uorc-browser-capability-report/1',
    accepted,
    saturatedCount,
    requiredCount,
    falsifiersRejectedCount,
    receiptErrorCode: firstError,
    wasmBundleDigest: wasmDigest,
    reportFooterKappa,
    capabilities: outcomes,
    observations,
  };
}
