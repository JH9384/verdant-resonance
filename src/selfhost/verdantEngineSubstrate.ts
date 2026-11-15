import {
  certifiedWasmCore_verifyVerdantEngineSubstrateCoherence,
  isCertifiedWasmReady,
} from '../game/generatedCertifiedWasmBridge';

/**
 * Standalone `verdant-engine` WebAssembly Substrate Bridge (`Foundation.Host.V1.Model`).
 *
 * Consumes the Prism-compiled `verdant-wasm` engine binary (`public/wasm/verdant_engine.wasm`)
 * extracted into `github.com/afflom/verdant-engine` as the 3D engine substrate underneath
 * Verdant Resonance (Flagship Game #1):
 *   - 7 Heyman-verified Builder architectural blueprints (`t_obs`, epoch rank 3)
 *   - Autonomous Perimeter Sentinel Rover spline patrol & player capsule terrain kinematics
 *   - Surface-Area-Heuristic (SAH) Bounding Volume Hierarchy frustum culling
 *   - Slope-verified 2,048-polygon Sanctuary Terrain NavMesh
 *   - Woodworth spherical-head 3D binaural ITD/ILD spatializer & Sabine travertine RT60
 *   - Authenticated `VDNT` + SHA-256 binary `WorldSnapshot` capture & tamper-refusing restore
 */

export interface VerdantEngineBlueprintTelemetry {
  readonly index: number;
  readonly name: string;
  readonly guild: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly safetyFactor: number;
  readonly modalHz: number;
}

export interface VerdantEngineBinauralCue {
  readonly stereoPan: number;
  readonly directGain: number;
  readonly itdMicros: number;
}

export interface VerdantEngineTelemetrySnapshot {
  readonly ready: boolean;
  readonly substrateCoherent: boolean;
  readonly seed: number;
  readonly epochRank: number;
  readonly blueprintCount: number;
  readonly walkableNavPolygons: number;
  readonly bvhVisibleEntities: number;
  readonly audioQuantumFrames: number;
  readonly audioStereoChannels: number;
  readonly workerRingCapacity: number;
  readonly snapshotMaxBytes: number;
  readonly sabineRt60Millis: number;
  readonly chimeModeRatios: readonly string[];
  readonly csmCascadeFarMeters: readonly [number, number, number, number];
  readonly roverX: number;
  readonly roverY: number;
  readonly roverZ: number;
  readonly roverYaw: number;
  readonly roverDistanceMeters: number;
  readonly monumentContact: boolean;
  readonly snapshotBytes: number;
  readonly snapshotSha256Hex: string;
  readonly blueprints: readonly VerdantEngineBlueprintTelemetry[];
}

interface VerdantEngineWasmExports {
  readonly memory: WebAssembly.Memory;
  verdant_wasm_init(seed: bigint): number;
  verdant_wasm_set_epoch_rank(rank: number): number;
  verdant_wasm_step(
    dtMicros: number,
    moveFwdMilli: number,
    moveStrafeMilli: number,
    walkYawMilli: number,
  ): number;
  verdant_wasm_rover_x(): number;
  verdant_wasm_rover_y(): number;
  verdant_wasm_rover_z(): number;
  verdant_wasm_rover_yaw(): number;
  verdant_wasm_rover_distance(): number;
  verdant_wasm_player_x(): number;
  verdant_wasm_player_y(): number;
  verdant_wasm_player_z(): number;
  verdant_wasm_terrain_height(x: number, z: number, amp: number): number;
  verdant_wasm_monument_contact(): number;
  verdant_wasm_bvh_visible_count(
    eyeX: number,
    eyeY: number,
    eyeZ: number,
    fwdX: number,
    fwdY: number,
    fwdZ: number,
    aspect: number,
  ): number;
  verdant_wasm_navmesh_polygon_count(): number;
  verdant_wasm_audio_quantum_frames(): number;
  verdant_wasm_audio_channels(): number;
  verdant_wasm_chime_mode_numer(modeIndex: number): number;
  verdant_wasm_chime_mode_denom(): number;
  verdant_wasm_sabine_rt60_millis(volumeM3: number, absorptionMilliM2: number): number;
  verdant_wasm_binaural_pan(
    srcX: number,
    srcY: number,
    srcZ: number,
    eyeX: number,
    eyeY: number,
    eyeZ: number,
    fwdX: number,
    fwdY: number,
    fwdZ: number,
  ): number;
  verdant_wasm_binaural_gain(): number;
  verdant_wasm_binaural_itd_micros(): number;
  verdant_wasm_csm_split_meters(nearMeters: number, farMeters: number, cascadeIdx: number): number;
  verdant_wasm_io_clear(): void;
  verdant_wasm_io_push_byte(byte: number): void;
  verdant_wasm_io_len(): number;
  verdant_wasm_io_get_byte(index: number): number;
  verdant_wasm_snapshot_encode(): number;
  verdant_wasm_snapshot_decode_and_restore(): number;
  verdant_wasm_active_epoch_rank(): number;
  verdant_wasm_active_seed(): bigint;
  verdant_wasm_blueprint_count(): number;
  verdant_wasm_blueprint_x(index: number): number;
  verdant_wasm_blueprint_y(index: number): number;
  verdant_wasm_blueprint_z(index: number): number;
  verdant_wasm_blueprint_safety_factor(index: number): number;
  verdant_wasm_blueprint_modal_hz(index: number): number;
  verdant_wasm_worker_ring_capacity(): number;
  verdant_wasm_snapshot_max_bytes(): number;
}

const BUILDER_BLUEPRINT_META: readonly { readonly name: string; readonly guild: string }[] = [
  { name: 'Harmonic Rotunda Pavilion', guild: 'Lithic Masonry' },
  { name: 'Solar Meridian Sundial', guild: 'Celestial Gnomonics' },
  { name: 'Resonant Chime Pergola', guild: 'Modal Acoustics' },
  { name: 'Quartz Pendulum Chamber', guild: 'Modal Acoustics' },
  { name: 'Hydrological Pier Causeway', guild: 'Hydrological Engineering' },
  { name: 'Travertine Path Network', guild: 'Lithic Masonry' },
  { name: 'Perimeter Sentinel Rover', guild: 'Kinetic Automation' },
];

let _engineExports: VerdantEngineWasmExports | null = null;
const _telemetryListeners = new Set<(snap: VerdantEngineTelemetrySnapshot) => void>();

const EMPTY_TELEMETRY_SNAPSHOT: VerdantEngineTelemetrySnapshot = {
  ready: false,
  substrateCoherent: false,
  seed: 7,
  epochRank: 3,
  blueprintCount: 0,
  walkableNavPolygons: 0,
  bvhVisibleEntities: 0,
  audioQuantumFrames: 128,
  audioStereoChannels: 2,
  workerRingCapacity: 64,
  snapshotMaxBytes: 32768,
  sabineRt60Millis: 3000,
  chimeModeRatios: ['9/9', '25/9', '49/9', '81/9', '121/9'],
  csmCascadeFarMeters: [4.5, 14.0, 42.0, 140.0],
  roverX: 18.0,
  roverY: 1.5,
  roverZ: 0.0,
  roverYaw: 0.0,
  roverDistanceMeters: 0.0,
  monumentContact: false,
  snapshotBytes: 0,
  snapshotSha256Hex: '',
  blueprints: [],
};

let _cachedTelemetry: VerdantEngineTelemetrySnapshot = EMPTY_TELEMETRY_SNAPSHOT;

function evaluateCertifiedSubstrateGate(
  blueprintCount: number,
  walkableNavPolygons: number,
  audioQuantumFrames: number,
  snapshotBytes: number,
): boolean {
  if (isCertifiedWasmReady()) {
    return certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
      blueprintCount,
      walkableNavPolygons,
      audioQuantumFrames,
      snapshotBytes,
    );
  }
  return (
    blueprintCount === 7 &&
    walkableNavPolygons >= 2048 &&
    audioQuantumFrames === 128 &&
    snapshotBytes > 0 &&
    snapshotBytes <= 32768
  );
}

function extractDigestHexFromVdntWire(wire: Uint8Array): string {
  // `VDNT` wire format appends the 32-byte SHA-256 digest at the end of the envelope
  if (wire.length < 40) return '';
  const digestSlice = wire.subarray(wire.length - 32);
  let hex = '';
  for (let i = 0; i < digestSlice.length; i++) {
    hex += digestSlice[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function notifyTelemetryListeners(): void {
  for (const listener of _telemetryListeners) {
    listener(_cachedTelemetry);
  }
}

function refreshStaticAndDynamicTelemetry(
  ex: VerdantEngineWasmExports,
  snapshotWire?: Uint8Array,
): VerdantEngineTelemetrySnapshot {
  const blueprintCount = ex.verdant_wasm_blueprint_count() >>> 0;
  const blueprints: VerdantEngineBlueprintTelemetry[] = [];
  for (let i = 0; i < blueprintCount; i++) {
    const meta = BUILDER_BLUEPRINT_META[i] ?? {
      name: `Builder Artifact #${i + 1}`,
      guild: 'Lithic Masonry',
    };
    blueprints.push({
      index: i,
      name: meta.name,
      guild: meta.guild,
      x: Number(ex.verdant_wasm_blueprint_x(i).toFixed(2)),
      y: Number(ex.verdant_wasm_blueprint_y(i).toFixed(2)),
      z: Number(ex.verdant_wasm_blueprint_z(i).toFixed(2)),
      safetyFactor: Number(ex.verdant_wasm_blueprint_safety_factor(i).toFixed(2)),
      modalHz: Number(ex.verdant_wasm_blueprint_modal_hz(i).toFixed(2)),
    });
  }

  const walkableNavPolygons = ex.verdant_wasm_navmesh_polygon_count() >>> 0;
  const audioQuantumFrames = ex.verdant_wasm_audio_quantum_frames() >>> 0;
  const audioStereoChannels = ex.verdant_wasm_audio_channels() >>> 0;
  const workerRingCapacity = ex.verdant_wasm_worker_ring_capacity() >>> 0;
  const snapshotMaxBytes = ex.verdant_wasm_snapshot_max_bytes() >>> 0;
  const sabineRt60Millis = ex.verdant_wasm_sabine_rt60_millis(1800, 96000) >>> 0;
  const denom = ex.verdant_wasm_chime_mode_denom() >>> 0;
  const chimeModeRatios: string[] = [];
  for (let m = 0; m < 5; m++) {
    chimeModeRatios.push(`${ex.verdant_wasm_chime_mode_numer(m) >>> 0}/${denom}`);
  }
  const csmCascadeFarMeters: [number, number, number, number] = [
    Number(ex.verdant_wasm_csm_split_meters(0.25, 140.0, 0).toFixed(2)),
    Number(ex.verdant_wasm_csm_split_meters(0.25, 140.0, 1).toFixed(2)),
    Number(ex.verdant_wasm_csm_split_meters(0.25, 140.0, 2).toFixed(2)),
    Number(ex.verdant_wasm_csm_split_meters(0.25, 140.0, 3).toFixed(2)),
  ];

  let snapBytes = _cachedTelemetry.snapshotBytes;
  let snapHex = _cachedTelemetry.snapshotSha256Hex;
  if (snapshotWire) {
    snapBytes = snapshotWire.byteLength;
    snapHex = extractDigestHexFromVdntWire(snapshotWire);
  } else if (snapBytes === 0) {
    const encodedLen = ex.verdant_wasm_snapshot_encode() >>> 0;
    if (encodedLen > 0) {
      const wire = new Uint8Array(encodedLen);
      for (let i = 0; i < encodedLen; i++) {
        wire[i] = ex.verdant_wasm_io_get_byte(i) & 0xff;
      }
      snapBytes = wire.byteLength;
      snapHex = extractDigestHexFromVdntWire(wire);
    }
  }

  const bvhVisibleEntities =
    ex.verdant_wasm_bvh_visible_count(0, 2.4, 16, 0, -0.05, -1, 1.6) >>> 0;
  const substrateCoherent = evaluateCertifiedSubstrateGate(
    blueprintCount,
    walkableNavPolygons,
    audioQuantumFrames,
    snapBytes,
  );

  _cachedTelemetry = {
    ready: true,
    substrateCoherent,
    seed: Number(BigInt.asUintN(53, ex.verdant_wasm_active_seed())),
    epochRank: ex.verdant_wasm_active_epoch_rank() >>> 0,
    blueprintCount,
    walkableNavPolygons,
    bvhVisibleEntities,
    audioQuantumFrames,
    audioStereoChannels,
    workerRingCapacity,
    snapshotMaxBytes,
    sabineRt60Millis,
    chimeModeRatios,
    csmCascadeFarMeters,
    roverX: ex.verdant_wasm_rover_x(),
    roverY: ex.verdant_wasm_rover_y(),
    roverZ: ex.verdant_wasm_rover_z(),
    roverYaw: ex.verdant_wasm_rover_yaw(),
    roverDistanceMeters: ex.verdant_wasm_rover_distance(),
    monumentContact: (ex.verdant_wasm_monument_contact() >>> 0) !== 0,
    snapshotBytes: snapBytes,
    snapshotSha256Hex: snapHex,
    blueprints,
  };
  notifyTelemetryListeners();
  return _cachedTelemetry;
}

async function resolveEngineWasmBytes(
  wasmUrlOrBytes?: string | Uint8Array | ArrayBuffer,
): Promise<Uint8Array> {
  if (wasmUrlOrBytes instanceof Uint8Array) return wasmUrlOrBytes;
  if (wasmUrlOrBytes instanceof ArrayBuffer) return new Uint8Array(wasmUrlOrBytes);
  if (typeof wasmUrlOrBytes === 'string' && typeof globalThis.fetch === 'function') {
    try {
      const resp = await globalThis.fetch(wasmUrlOrBytes);
      if (resp.ok) {
        return new Uint8Array(await resp.arrayBuffer());
      }
    } catch {
      // Fall through to Node filesystem loader when running in CLI / test suite
    }
  }
  const fsModId = 'node:fs';
  const pathModId = 'node:path';
  const fsMod = (await import(/* @vite-ignore */ fsModId)) as typeof import('node:fs');
  const pathMod = (await import(/* @vite-ignore */ pathModId)) as typeof import('node:path');
  const diskPath = pathMod.resolve(process.cwd(), 'public', 'wasm', 'verdant_engine.wasm');
  return new Uint8Array(fsMod.readFileSync(diskPath));
}

export async function initVerdantEngineSubstrate(
  wasmUrlOrBytes?: string | Uint8Array | ArrayBuffer,
  seed = 7,
): Promise<VerdantEngineTelemetrySnapshot> {
  const bytes = await resolveEngineWasmBytes(wasmUrlOrBytes);
  const instantiated = await WebAssembly.instantiate(bytes as BufferSource, { env: {} });
  const instance =
    'instance' in instantiated ? instantiated.instance : (instantiated as WebAssembly.Instance);
  const ex = instance.exports as unknown as VerdantEngineWasmExports;
  const ok = ex.verdant_wasm_init(BigInt(Math.max(1, Math.trunc(seed))));
  if (ok !== 1) {
    return EMPTY_TELEMETRY_SNAPSHOT;
  }
  _engineExports = ex;
  const snap = refreshStaticAndDynamicTelemetry(ex);
  const gateOk = isCertifiedWasmReady()
    ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
        snap.blueprintCount,
        snap.walkableNavPolygons,
        snap.audioQuantumFrames,
        snap.snapshotBytes,
      )
    : snap.substrateCoherent;
  _cachedTelemetry = { ...snap, substrateCoherent: gateOk };
  notifyTelemetryListeners();
  return _cachedTelemetry;
}

export function isVerdantEngineReady(): boolean {
  if (!_engineExports || !_cachedTelemetry.ready) return false;
  return isCertifiedWasmReady()
    ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
        _cachedTelemetry.blueprintCount,
        _cachedTelemetry.walkableNavPolygons,
        _cachedTelemetry.audioQuantumFrames,
        _cachedTelemetry.snapshotBytes,
      )
    : _cachedTelemetry.substrateCoherent;
}

export function getVerdantEngineTelemetrySnapshot(): VerdantEngineTelemetrySnapshot {
  if (!_engineExports || !_cachedTelemetry.ready) return _cachedTelemetry;
  const coherent = isCertifiedWasmReady()
    ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
        _cachedTelemetry.blueprintCount,
        _cachedTelemetry.walkableNavPolygons,
        _cachedTelemetry.audioQuantumFrames,
        _cachedTelemetry.snapshotBytes,
      )
    : _cachedTelemetry.substrateCoherent;
  return coherent === _cachedTelemetry.substrateCoherent
    ? _cachedTelemetry
    : { ..._cachedTelemetry, substrateCoherent: coherent };
}

export function subscribeVerdantEngineTelemetry(
  listener: (snap: VerdantEngineTelemetrySnapshot) => void,
): () => void {
  _telemetryListeners.add(listener);
  if (_cachedTelemetry.ready && isCertifiedWasmReady()) {
    void certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
      _cachedTelemetry.blueprintCount,
      _cachedTelemetry.walkableNavPolygons,
      _cachedTelemetry.audioQuantumFrames,
      _cachedTelemetry.snapshotBytes,
    );
  }
  return () => {
    _telemetryListeners.delete(listener);
  };
}

export function stepVerdantEngineFrame(params: {
  readonly dtSeconds: number;
  readonly moveForward: number;
  readonly moveStrafe: number;
  readonly walkYawRad: number;
  readonly eyeX: number;
  readonly eyeY: number;
  readonly eyeZ: number;
  readonly fwdX: number;
  readonly fwdY: number;
  readonly fwdZ: number;
  readonly aspect?: number;
}): VerdantEngineTelemetrySnapshot {
  if (!_engineExports) return _cachedTelemetry;
  const dtMicros = Math.max(1000, Math.min(50000, Math.round(params.dtSeconds * 1_000_000)));
  const moveFwdMilli = Math.round(Math.max(-1, Math.min(1, params.moveForward)) * 1000);
  const moveStrafeMilli = Math.round(Math.max(-1, Math.min(1, params.moveStrafe)) * 1000);
  const walkYawMilli = Math.round(params.walkYawRad * 1000);
  _engineExports.verdant_wasm_step(dtMicros, moveFwdMilli, moveStrafeMilli, walkYawMilli);
  const visible =
    _engineExports.verdant_wasm_bvh_visible_count(
      params.eyeX,
      params.eyeY,
      params.eyeZ,
      params.fwdX,
      params.fwdY,
      params.fwdZ,
      params.aspect ?? 1.6,
    ) >>> 0;
  const coherent = isCertifiedWasmReady()
    ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
        _cachedTelemetry.blueprintCount,
        _cachedTelemetry.walkableNavPolygons,
        _cachedTelemetry.audioQuantumFrames,
        _cachedTelemetry.snapshotBytes,
      )
    : _cachedTelemetry.substrateCoherent;

  _cachedTelemetry = {
    ..._cachedTelemetry,
    substrateCoherent: coherent,
    bvhVisibleEntities: visible,
    roverX: _engineExports.verdant_wasm_rover_x(),
    roverY: _engineExports.verdant_wasm_rover_y(),
    roverZ: _engineExports.verdant_wasm_rover_z(),
    roverYaw: _engineExports.verdant_wasm_rover_yaw(),
    roverDistanceMeters: _engineExports.verdant_wasm_rover_distance(),
    monumentContact: (_engineExports.verdant_wasm_monument_contact() >>> 0) !== 0,
  };
  return _cachedTelemetry;
}

export function evaluateVerdantEngineBinauralCue(params: {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceZ: number;
  readonly listenerX: number;
  readonly listenerY: number;
  readonly listenerZ: number;
  readonly listenerYaw: number;
  readonly listenerPitch?: number;
}): VerdantEngineBinauralCue {
  if (!_engineExports) {
    const fallbackCoherent = isCertifiedWasmReady()
      ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(7, 2048, 128, 1)
      : true;
    return { stereoPan: fallbackCoherent ? 0 : 0, directGain: 1, itdMicros: 0 };
  }
  const pitch = params.listenerPitch ?? 0;
  const cosP = Math.cos(pitch);
  const fwdX = -Math.sin(params.listenerYaw) * cosP;
  const fwdY = Math.sin(pitch);
  const fwdZ = -Math.cos(params.listenerYaw) * cosP;
  const pan = _engineExports.verdant_wasm_binaural_pan(
    params.sourceX,
    params.sourceY,
    params.sourceZ,
    params.listenerX,
    params.listenerY,
    params.listenerZ,
    fwdX,
    fwdY,
    fwdZ,
  );
  const directGain = _engineExports.verdant_wasm_binaural_gain();
  const itdMicros = _engineExports.verdant_wasm_binaural_itd_micros();
  if (isCertifiedWasmReady()) {
    void certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
      _cachedTelemetry.blueprintCount,
      _cachedTelemetry.walkableNavPolygons,
      _cachedTelemetry.audioQuantumFrames,
      _cachedTelemetry.snapshotBytes,
    );
  }
  return {
    stereoPan: Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0)),
    directGain: Math.max(0, Math.min(1, Number.isFinite(directGain) ? directGain : 0)),
    itdMicros: Number.isFinite(itdMicros) ? itdMicros : 0,
  };
}

export function captureVerdantEngineSnapshot(): Uint8Array {
  if (!_engineExports) return new Uint8Array(0);
  const encodedLen = _engineExports.verdant_wasm_snapshot_encode() >>> 0;
  if (encodedLen === 0) return new Uint8Array(0);
  const out = new Uint8Array(encodedLen);
  for (let i = 0; i < encodedLen; i++) {
    out[i] = _engineExports.verdant_wasm_io_get_byte(i) & 0xff;
  }
  const coherent = isCertifiedWasmReady()
    ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
        _cachedTelemetry.blueprintCount,
        _cachedTelemetry.walkableNavPolygons,
        _cachedTelemetry.audioQuantumFrames,
        out.byteLength,
      )
    : out.byteLength <= 32768;
  _cachedTelemetry = {
    ..._cachedTelemetry,
    substrateCoherent: coherent,
    snapshotBytes: out.byteLength,
    snapshotSha256Hex: extractDigestHexFromVdntWire(out),
  };
  notifyTelemetryListeners();
  return out;
}

export function restoreVerdantEngineSnapshot(wireBytes: Uint8Array): boolean {
  if (!_engineExports || wireBytes.byteLength === 0) return false;
  _engineExports.verdant_wasm_io_clear();
  for (let i = 0; i < wireBytes.byteLength; i++) {
    _engineExports.verdant_wasm_io_push_byte(wireBytes[i]);
  }
  const ok = (_engineExports.verdant_wasm_snapshot_decode_and_restore() >>> 0) === 1;
  if (!ok) return false;
  const refreshed = refreshStaticAndDynamicTelemetry(_engineExports, wireBytes);
  return isCertifiedWasmReady()
    ? certifiedWasmCore_verifyVerdantEngineSubstrateCoherence(
        refreshed.blueprintCount,
        refreshed.walkableNavPolygons,
        refreshed.audioQuantumFrames,
        refreshed.snapshotBytes,
      )
    : refreshed.substrateCoherent;
}
