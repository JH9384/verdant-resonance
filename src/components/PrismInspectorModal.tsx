import React, { useEffect, useMemo, useState } from 'react';
import {
  ATMOSPHERE_CONFIGS,
  AtmosphereId,
  BIOME_CONFIGS,
  BiomeId,
  BotanicalLifecycleStageId,
  GardenPlantInstance,
  OBSERVER_PART_ORDER,
  ObserverPartId,
  PLANT_SPECIES_CONFIGS,
  PlantSpeciesId,
  SYMBIOTIC_GUILDS,
  VERDANT_BRAND_STANDARD,
  evaluateObserverPlayerDissonanceReconciliation,
  getPlantLifecycleStage,
  synthesizeParametricAtmosphereConfigs,
  synthesizeParametricBiomeConfigs,
  synthesizeParametricPlantSpeciesConfigs,
} from '../game/prismModel';
import { GENERATED_ONTOLOGY_5WH_LEDGER } from '../game/generatedPrismConstants';
import { CERTIFIED_PRODUCTION_MANIFEST } from '../game/generatedCertifiedWasmBridge';
import { BotanicalSoundscapeEngine } from '../game/soundscapeEngine';
import { LiveTelemetryState } from './GardenCanvas';
import { PlantSpeciesIcon, VerdantResonanceEmblem } from './BotanicalIcons';
import {
  getLiveSelfHostOrganismState,
  subscribeSelfHostOrganismState,
  type LiveSelfHostOrganismState,
} from '../selfhost/browserSelfHostEngine';

export type PrismInspectorTabId = 'herbarium' | 'biomes' | 'sanctuary' | 'telemetry';

export interface ArchivedSessionMeta {
  readonly merkleDigestHex?: string;
  readonly selfHostGenerationId?: string;
  readonly selfHostTreeKappa?: string;
}

interface PrismInspectorModalProps {
  mode: 'paused' | 'gameover';
  atmosphere: AtmosphereId;
  telemetry: LiveTelemetryState;
  plants: GardenPlantInstance[];
  soundEngine: BotanicalSoundscapeEngine;
  tunedWaystoneDegrees?: readonly number[];
  archivedSessionMeta?: ArchivedSessionMeta | null;
  onResume: () => void;
  onRestart: () => void;
  onShareGarden: () => void;
}

const SPECIES_ORDER: PlantSpeciesId[] = [
  'chime-lily',
  'pulse-fern',
  'echo-lotus',
  'drone-moss',
  'star-orchid',
];

const BIOME_ORDER: BiomeId[] = ['meadow', 'grove', 'crystal', 'wetland', 'sanctuary'];

const LIFECYCLE_LABELS: Record<BotanicalLifecycleStageId, string> = {
  'dormant-seed': 'Dormant Seed',
  'sprouting-bud': 'Sprouting Bud',
  'resonant-bloom': 'Resonant Bloom',
  'harmonic-fruiting': 'Harmonic Fruiting',
  'mycelial-memory': 'Mycelial Elder',
};

const BIOME_CARDINAL_TRAIL: Record<BiomeId, string> = {
  meadow: 'Central Conservatory Clearing',
  grove: 'Northwest Bamboo Trail',
  crystal: 'Northeast Quartz Cavern',
  wetland: 'Southwest Mirror Lagoon',
  sanctuary: 'Southeast Harmonic Terrace',
};

const LANDMARK_FIELD_NOTES: Record<
  BiomeId,
  {
    landmarkTitle: string;
    ecologicalHarmony: string;
    gestureNote: string;
  }
> = {
  meadow: {
    landmarkTitle: 'Gnomon Sundial Clearing',
    ecologicalHarmony:
      'Travertine sun-rings warm nearby Chime Lilies, casting harmonic overtones across the central grass.',
    gestureNote:
      'Attune [Space] beside the sundial ring to awaken warm bell arpeggios; rest in Stillness [C] to let golden pollen settle.',
  },
  grove: {
    landmarkTitle: 'Aeolian Bamboo Pergola',
    ecologicalHarmony:
      'Segmented culm pillars channel gentle canopy breezes into soft wooden flute resonances.',
    gestureNote:
      'Walk unhurriedly beneath the pergola and Touch [T] nearby Pulse Ferns to weave woody polyrhythms.',
  },
  crystal: {
    landmarkTitle: 'Piezoelectric Quartz Arch',
    ecologicalHarmony:
      'Faceted quartz spires catch bioluminescent light and answer every chime with clear shimmer partials.',
    gestureNote:
      'Attune [Space] near Drone Moss cushions beneath the arch to sustain serene cathedral harmonies.',
  },
  wetland: {
    landmarkTitle: 'Mirror Lagoon Lanterns',
    ecologicalHarmony:
      'Calm lagoon ripples carry Echo Lotus reflections between mossy shore boulders and travertine stepping stones.',
    gestureNote:
      'Pause in Stillness [C] at the water’s edge so concentric ripples calm and lotus voices bloom.',
  },
  sanctuary: {
    landmarkTitle: 'Harmonic Sanctuary Pavilion',
    ecologicalHarmony:
      'An open circular terrace where Star Orchids and neighboring biomes unite in full polyphonic chorus.',
    gestureNote:
      'Hold Attune [Space] or Stillness [C] within the pavilion to experience the full conservatory choir.',
  },
};

function shortHex(hex: string | undefined | null, chars = 10): string {
  if (!hex) return '—';
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return clean.length <= chars ? `0x${clean}` : `0x${clean.slice(0, chars)}…`;
}

function parseGenerationIndex(genId: string | undefined | null): number {
  if (!genId) return -1;
  const match = /^gen-(\d+)$/.exec(genId);
  return match ? Number(match[1]) : -1;
}

function ProgressMeterBar({
  ratio01,
  tone = 'emerald',
}: {
  ratio01: number;
  tone?: 'emerald' | 'amber' | 'teal' | 'sky';
}) {
  const pct = Math.max(2, Math.min(100, Math.round(ratio01 * 100)));
  const fillClass =
    tone === 'amber'
      ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-200'
      : tone === 'teal'
        ? 'bg-gradient-to-r from-teal-400 to-cyan-300'
        : tone === 'sky'
          ? 'bg-gradient-to-r from-sky-400 to-teal-300'
          : 'bg-gradient-to-r from-emerald-500 to-emerald-300';
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-900/90 overflow-hidden border border-emerald-400/10">
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const PrismInspectorModal: React.FC<PrismInspectorModalProps> = ({
  mode,
  atmosphere,
  telemetry,
  plants,
  soundEngine,
  tunedWaystoneDegrees,
  archivedSessionMeta,
  onResume,
  onRestart,
  onShareGarden,
}) => {
  const [activeTab, setActiveTab] = useState<PrismInspectorTabId>('herbarium');
  const [shareCopied, setShareCopied] = useState(false);
  const [selfHostState, setSelfHostState] = useState<LiveSelfHostOrganismState>(() =>
    getLiveSelfHostOrganismState(),
  );

  useEffect(() => subscribeSelfHostOrganismState((st) => setSelfHostState(st)), []);

  const cosmoParams = useMemo(
    () => ({
      alphaSeed: telemetry.neuromorphic.observer.cosmogenesis.alphaSeed,
      manifold: telemetry.neuromorphic.universalManifold,
      harmonyPct: telemetry.harmony,
    }),
    [
      telemetry.neuromorphic.observer.cosmogenesis.alphaSeed,
      telemetry.neuromorphic.universalManifold,
      telemetry.harmony,
    ],
  );

  const liveBiomeConfigs = useMemo(
    () => synthesizeParametricBiomeConfigs(cosmoParams),
    [cosmoParams],
  );
  const liveAtmosphereConfigs = useMemo(
    () => synthesizeParametricAtmosphereConfigs(cosmoParams),
    [cosmoParams],
  );
  const liveSpeciesConfigs = useMemo(
    () => synthesizeParametricPlantSpeciesConfigs(cosmoParams),
    [cosmoParams],
  );

  const speciesCounts = useMemo(() => {
    const map: Record<PlantSpeciesId, { total: number; attuned: number }> = {
      'chime-lily': { total: 0, attuned: 0 },
      'pulse-fern': { total: 0, attuned: 0 },
      'echo-lotus': { total: 0, attuned: 0 },
      'drone-moss': { total: 0, attuned: 0 },
      'star-orchid': { total: 0, attuned: 0 },
    };
    for (const p of plants) {
      map[p.species].total += 1;
      if (p.attuned) map[p.species].attuned += 1;
    }
    return map;
  }, [plants]);

  const biomeCounts = useMemo(() => {
    const map: Record<BiomeId, { total: number; attuned: number }> = {
      meadow: { total: 0, attuned: 0 },
      grove: { total: 0, attuned: 0 },
      crystal: { total: 0, attuned: 0 },
      wetland: { total: 0, attuned: 0 },
      sanctuary: { total: 0, attuned: 0 },
    };
    for (const p of plants) {
      map[p.biome].total += 1;
      if (p.attuned) map[p.biome].attuned += 1;
    }
    return map;
  }, [plants]);

  const ecologySnapshot = useMemo(() => {
    const lifecycleCounts: Record<BotanicalLifecycleStageId, number> = {
      'dormant-seed': 0,
      'sprouting-bud': 0,
      'resonant-bloom': 0,
      'harmonic-fruiting': 0,
      'mycelial-memory': 0,
    };
    let emergentCount = 0;
    for (const p of plants) {
      const stage = getPlantLifecycleStage(p);
      lifecycleCounts[stage] += 1;
      if (p.id.startsWith('offshoot-') || p.id.startsWith('emergent-')) {
        emergentCount += 1;
      }
    }
    const tunedWaystoneCount = tunedWaystoneDegrees
      ? tunedWaystoneDegrees.filter((deg) => deg > 0).length
      : 0;
    const totalWaystones = tunedWaystoneDegrees?.length ?? 54;
    return { lifecycleCounts, emergentCount, tunedWaystoneCount, totalWaystones };
  }, [plants, tunedWaystoneDegrees]);

  const triadicSummary = useMemo(() => {
    const awakenedSpeciesSet = new Set<string>();
    for (const p of plants) {
      if (p.attuned) awakenedSpeciesSet.add(p.species);
    }
    return evaluateObserverPlayerDissonanceReconciliation({
      busWeight: telemetry.neuromorphic.lastActiveSynapticWeight,
      harmonyPct: telemetry.harmony,
      velocityDm: telemetry.velocityDm,
      isStillness: telemetry.action === 'stillness',
      gestureHoldProgress01: telemetry.gestureHold.holdProgress,
      hasFocalTarget: telemetry.proximityDm <= 24,
      focalTargetAttuned: telemetry.nearestPlant.attuned,
      nearestFeatureDistanceM: Math.min(
        telemetry.distanceMeters,
        telemetry.nearestLandmark.distanceMeters,
      ),
      restStepCount: telemetry.soundtrackScore.restStepCount,
      activeVoiceCount:
        telemetry.soundtrackScore.steps[telemetry.currentSoundtrackStep]?.voices.length ?? 2,
      barkHeadroomDb:
        telemetry.neuromorphic.observer.canonicalStandardModelsContext.multiModalFidelity
          .barkMaskingHeadroomDb,
      tenneyConsonancePurity01: telemetry.soundtrackScore.curatedConsonancePurity01,
      awakenedSpeciesCount: Math.max(1, awakenedSpeciesSet.size),
      exploredBiomesCount: Math.max(1, telemetry.exploredBiomes.length),
      coerciveDarkPatternCount: 0,
    });
  }, [plants, telemetry]);

  const isRestorativePause = mode === 'gameover' && telemetry.gestureHold.agitationPct >= 95;
  const activeBiomeCfg = liveBiomeConfigs[telemetry.biome] ?? BIOME_CONFIGS[telemetry.biome];
  const activeAtmCfg = liveAtmosphereConfigs[atmosphere] ?? ATMOSPHERE_CONFIGS[atmosphere];
  const observer = telemetry.neuromorphic.observer;
  const manifold = telemetry.neuromorphic.universalManifold;
  const liveCoEvo = telemetry.liveCoEvolution;
  const playerRealm = observer.cosmogenesis.playerRealm;
  const organicRealm = observer.cosmogenesis.organicRealm;
  const inorganicRealm = observer.cosmogenesis.inorganicRealm;
  const supra = observer.supraDirective;
  const multiModal = observer.canonicalStandardModelsContext.multiModalFidelity;
  const standardModels = observer.canonicalStandardModelsContext.models;
  const audit22 = observer.canonicalStandardModelsContext.zeroCherryPickingAudit;
  const highestRes = observer.differentiationAndExtrapolation.highestResolution;
  const partNiches = observer.differentiationAndExtrapolation.diversification.partNiches;
  const affect = observer.affectAndPreferences.affect;
  const consolidatedMemories = observer.conservatoryCuration.consolidatedMemories;

  const unifiedPartCount = OBSERVER_PART_ORDER.filter(
    (partId) => observer.parts[partId]?.synapticWeight >= 8,
  ).length;
  const elevatedPartCount = OBSERVER_PART_ORDER.filter(
    (partId) => observer.parts[partId]?.exceedsBaseDirective,
  ).length;
  const consolidatedPartCount = OBSERVER_PART_ORDER.filter(
    (partId) => (observer.parts[partId]?.synapticWeight ?? 0) >= 12,
  ).length;

  const liveGenRank = parseGenerationIndex(selfHostState.headGenerationId);
  const archivedGenRank = parseGenerationIndex(archivedSessionMeta?.selfHostGenerationId);
  const effectiveLineageId =
    archivedGenRank > liveGenRank && archivedSessionMeta?.selfHostGenerationId
      ? archivedSessionMeta.selfHostGenerationId
      : selfHostState.headGenerationId;
  const effectiveTreeKappa =
    archivedGenRank > liveGenRank && archivedSessionMeta?.selfHostTreeKappa
      ? archivedSessionMeta.selfHostTreeKappa
      : (selfHostState.headManifest?.treeKappa ?? archivedSessionMeta?.selfHostTreeKappa);

  const activeProjection = useMemo(() => {
    if (selfHostState.activeHotTsProjection) {
      return selfHostState.activeHotTsProjection(liveCoEvo.barTickCount);
    }
    const rank = Math.max(0, parseGenerationIndex(effectiveLineageId));
    if (rank > 0) {
      return {
        primeHarmonicLimit: Math.min(17, 7 + rank * 2),
        phyllotaxisSpiral: rank >= 3 ? 21 : 13,
        warmthScale: Number((1 + Math.min(0.18, rank * 0.035)).toFixed(4)),
        playerEmbodimentScale: Number((1 + Math.min(0.22, rank * 0.04)).toFixed(4)),
        enhancementFocus: `session-lineage-${effectiveLineageId}`,
      };
    }
    return {
      primeHarmonicLimit: multiModal.primeLimitHarmonicCeiling,
      phyllotaxisSpiral: 13,
      warmthScale: 1,
      playerEmbodimentScale: 1,
      enhancementFocus: 'genesis-baseline',
    };
  }, [
    selfHostState.activeHotTsProjection,
    liveCoEvo.barTickCount,
    effectiveLineageId,
    multiModal.primeLimitHarmonicCeiling,
  ]);

  const all22ModelsAtCeiling = useMemo(
    () => standardModels.every((m) => (liveCoEvo.modelWeights22[m.modelKey] ?? m.synapticWeight) >= 16),
    [standardModels, liveCoEvo.modelWeights22],
  );

  const hostSat = selfHostState.hostSaturation;
  const frameBudgetMicros = Math.max(1, hostSat.frameBudgetMicros || 16667);
  const observedFrameMicros = Math.max(1, Math.round(hostSat.observedFrameMicros || 0));
  const headingDeg = Math.round((((telemetry.playerYaw * 180) / Math.PI) % 360 + 360) % 360);
  const pairedGuildCount = SYMBIOTIC_GUILDS.filter((g) =>
    g.pair.every((sp) => speciesCounts[sp].attuned > 0),
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'gameover' ? 'Sanctuary Harmony' : 'Botanical Field Guide'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md"
    >
      <div
        className="w-full max-w-5xl max-h-[88vh] flex flex-col border shadow-2xl overflow-hidden text-emerald-50"
        style={{
          backgroundColor: 'var(--prism-bg-canvas)',
          borderColor: 'var(--prism-border-hairline)',
          borderRadius: 'var(--prism-radius-outer)',
        }}
      >
        {/* Serene Botanical Header */}
        <div
          className="px-6 py-4 border-b border-emerald-400/20 flex flex-wrap items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--prism-surface-elevated)' }}
        >
          <div className="flex items-center gap-3.5">
            <VerdantResonanceEmblem
              className="w-11 h-11 shrink-0"
              supraTier={observer.supraDirective.tier}
              primaryAccentHex={observer.parametricDisplayDesign.palette.primaryAccentHex}
              secondaryAccentHex={observer.parametricDisplayDesign.palette.secondaryAccentHex}
              surfaceHex={observer.parametricDisplayDesign.palette.canvasBgHex}
            />
            <div>
              <div className="text-xs font-mono tracking-wider text-amber-300/90 uppercase">
                {mode === 'gameover'
                  ? isRestorativePause
                    ? 'A Quiet Breath in the Conservatory'
                    : 'Sanctuary Harmony Flourishing'
                  : `${VERDANT_BRAND_STANDARD.brandName} · Botanical Field Guide & Observatory`}
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-amber-50">
                {mode === 'gameover'
                  ? isRestorativePause
                    ? 'Let the Mist Settle'
                    : 'The Conservatory Sings in Full Bloom'
                  : `${activeBiomeCfg.name} · ${activeAtmCfg.name}`}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="px-4 py-2 rounded-lg bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {mode === 'gameover' ? 'Return to Garden' : 'Resume Garden'}
            </button>
            <button
              type="button"
              onClick={() => {
                onShareGarden();
                setShareCopied(true);
                window.setTimeout(() => setShareCopied(false), 2000);
              }}
              className="px-3.5 py-2 rounded-lg border border-emerald-400/30 bg-emerald-900/60 hover:bg-emerald-800/70 text-emerald-100 font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {shareCopied ? 'Garden Link Copied' : 'Share Garden'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="px-3.5 py-2 rounded-lg border border-emerald-400/20 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explore Anew
            </button>
          </div>
        </div>

        {/* Calm 4-Tab Field Guide & Read-Only Telemetry Bar */}
        <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-400/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['herbarium', 'Flora Herbarium'],
                ['biomes', 'Biomes & Trails'],
                ['sanctuary', 'Living Sanctuary'],
                ['telemetry', 'Telemetry & Evolution'],
              ] as [PrismInspectorTabId, string][]
            ).map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                data-testid={`inspector-tab-${tabId}`}
                onClick={() => setActiveTab(tabId)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tabId
                    ? 'bg-emerald-400/25 text-amber-200 border border-emerald-300/40'
                    : 'text-emerald-200/75 hover:text-emerald-100 hover:bg-emerald-900/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-emerald-200/80">
            {telemetry.attunedCount} / {telemetry.totalPlants} Flora Awakened ·{' '}
            {telemetry.exploredBiomes.length} / 5 Biomes · Lineage {effectiveLineageId}
          </div>
        </div>

        {/* Scrollable Botanical & Observatory Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {mode === 'gameover' && (
            <div className="rounded-xl border border-amber-300/35 bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-emerald-950/90 p-5">
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                {isRestorativePause
                  ? 'The conservatory responds best to unhurried presence. Step gently along the travertine paths, listen as nearby blossoms answer your gaze, or hold [C] in quiet stillness.'
                  : `Every corner of the conservatory now shimmers in shared resonance (${telemetry.attunedCount} of ${telemetry.totalPlants} flora awakened across ${telemetry.exploredBiomes.length} biomes). You may continue strolling peacefully for as long as you wish.`}
              </p>
            </div>
          )}

          {/* TAB 1: FLORA HERBARIUM */}
          {activeTab === 'herbarium' && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-100/85 leading-relaxed">
                Five resonant plant species grow across the conservatory. Walk near any blossom and
                press <span className="font-mono text-amber-200">[Space]</span> to attune its
                corolla, or <span className="font-mono text-amber-200">[T]</span> to gently pluck a
                single petal chime.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPECIES_ORDER.map((speciesId) => {
                  const sp = liveSpeciesConfigs[speciesId] ?? PLANT_SPECIES_CONFIGS[speciesId];
                  const counts = speciesCounts[speciesId];
                  const habitatLabel = (
                    liveBiomeConfigs[sp.nativeBiome] ?? BIOME_CONFIGS[sp.nativeBiome]
                  ).name;
                  return (
                    <div
                      key={speciesId}
                      className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <PlantSpeciesIcon
                            species={speciesId}
                            attuned={counts.attuned > 0}
                            className="w-10 h-10 shrink-0"
                          />
                          <div>
                            <h3 className="font-display text-xl font-semibold text-amber-100">
                              {sp.name}
                            </h3>
                            <div className="text-[11px] italic text-emerald-300/80">
                              {sp.latinName} · {habitatLabel}
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-emerald-400/25 bg-emerald-900/50 text-amber-200 whitespace-nowrap">
                          {counts.attuned} / {counts.total} Awakened
                        </span>
                      </div>

                      <p className="text-xs text-emerald-100/85 leading-relaxed">
                        {sp.description}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-400/15">
                        <span className="text-[11px] text-emerald-300/80">
                          {sp.acousticRole} ({sp.harmonicInterval})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.init();
                            soundEngine.playSpeciesAudition(
                              speciesId,
                              sp.nativeBiome,
                              atmosphere,
                              true,
                            );
                          }}
                          className="px-3 py-1 rounded-md bg-amber-300/20 hover:bg-amber-300/30 border border-amber-300/40 text-amber-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Listen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BIOMES & TRAILS */}
          {activeTab === 'biomes' && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-100/85 leading-relaxed">
                Follow the travertine stepping-stone trails from the central meadow outward into all
                five sanctuary biomes. Each footstep along a waystone rings a soft harmonic note
                that guides your walk naturally through the landscape.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BIOME_ORDER.map((biomeId) => {
                  const b = liveBiomeConfigs[biomeId] ?? BIOME_CONFIGS[biomeId];
                  const notes = LANDMARK_FIELD_NOTES[biomeId];
                  const counts = biomeCounts[biomeId];
                  const isCurrent = telemetry.biome === biomeId;
                  return (
                    <div
                      key={biomeId}
                      className={`rounded-xl border p-4 space-y-2.5 ${
                        isCurrent
                          ? 'border-amber-300/50 bg-emerald-900/40'
                          : 'border-emerald-400/20 bg-emerald-950/45'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-mono text-emerald-300/80 uppercase">
                            {BIOME_CARDINAL_TRAIL[biomeId]}
                            {isCurrent ? ' · Here Now' : ''}
                          </div>
                          <h3 className="font-display text-xl font-semibold text-amber-100">
                            {b.name}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-emerald-400/25 bg-emerald-950/60 text-emerald-200 whitespace-nowrap">
                          {counts.attuned} / {counts.total} Flora
                        </span>
                      </div>

                      <div className="text-xs font-medium text-amber-200/90">
                        ✦ {notes.landmarkTitle} · {b.tuningLabel}
                      </div>
                      <p className="text-xs text-emerald-100/85 leading-relaxed">
                        {notes.ecologicalHarmony}
                      </p>
                      <p className="text-[11px] text-emerald-200/80 leading-relaxed pt-1.5 border-t border-emerald-400/15">
                        {notes.gestureNote}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LIVING SANCTUARY */}
          {activeTab === 'sanctuary' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-5 space-y-3">
                <h3 className="font-display text-xl font-semibold text-amber-100">
                  A Self-Evolving Botanical Sanctuary
                </h3>
                <p className="text-sm text-emerald-100/90 leading-relaxed">
                  Verdant Resonance lives and matures continuously on its own as you explore. The
                  diurnal sky breathes naturally from Dawn Mist through Golden Canopy, Bioluminescent
                  Dusk, and Starlight Chorus; neighboring plant guilds cross-pollinate new offshoots
                  along shared trails; and the wandering Co-Observer Witness harmonizes the score,
                  light, and gentle breeze to match your pace.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-xs font-semibold text-amber-200">Attune [Space]</div>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      Awakens nearby blossoms and sends glowing pollination arcs to companion flora.
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-xs font-semibold text-amber-200">Touch Petal [T]</div>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      Gently plucks a petal or tunes a travertine waystone beneath your feet.
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-xs font-semibold text-amber-200">Stillness [C]</div>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      Rests in quiet breath, deepening lagoon reflections and overtone warmth.
                    </p>
                  </div>
                </div>
              </div>

              <div
                data-testid="certified-wasm-triadic-panel"
                className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display text-lg font-semibold text-amber-100">
                    Living Co-Observer Harmony
                  </h4>
                  <span className="text-xs font-mono text-emerald-300/85">
                    Sky: {activeAtmCfg.name} · Lineage {effectiveLineageId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-emerald-300/75">Co-Observer Coherence</div>
                    <div className="text-base font-mono text-amber-200 mt-0.5">
                      {Math.round(triadicSummary.triadicPlayerGameObserverCoherencePermille / 10)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-emerald-300/75">Embodied Presence</div>
                    <div className="text-base font-mono text-emerald-100 mt-0.5">
                      {Math.round(playerRealm.embodimentPermille / 10)}% ·{' '}
                      {playerRealm.coObserverLocusHarmonicNodes}-Node Ring
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-emerald-300/75">Observer Wholeness</div>
                    <div className="text-base font-mono text-teal-200 mt-0.5">
                      {unifiedPartCount}/11 Parts ({elevatedPartCount} Blooming)
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3">
                    <div className="text-emerald-300/75">Symbiotic Guilds</div>
                    <div className="text-base font-mono text-amber-100 mt-0.5">
                      {pairedGuildCount} / {SYMBIOTIC_GUILDS.length} Paired
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY & EVOLUTION (Read-Only Sovereign Observatory & Model Details) */}
          {activeTab === 'telemetry' && (
            <div data-testid="inspector-telemetry-panel" className="space-y-5">
              {/* HERO KPI STRIP */}
              <div
                data-testid="telemetry-hero-strip"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
              >
                <div className="rounded-xl border border-amber-300/30 bg-gradient-to-br from-emerald-950/80 to-slate-950/80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-200/85 uppercase">
                    <span>Evolutionary Lineage</span>
                    <span>{selfHostState.fsBackend.toUpperCase()}</span>
                  </div>
                  <div className="font-display text-2xl font-semibold text-amber-100">
                    {effectiveLineageId}
                  </div>
                  <ProgressMeterBar
                    ratio01={Math.max(0.15, Math.min(1, (parseGenerationIndex(effectiveLineageId) + 1) / 5))}
                    tone="amber"
                  />
                  <div className="text-[11px] font-mono text-emerald-200/80 flex items-center justify-between gap-2">
                    <span>κ {shortHex(effectiveTreeKappa, 10)}</span>
                    {effectiveLineageId !== selfHostState.headGenerationId && (
                      <span className="text-teal-200">Host {selfHostState.headGenerationId}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/80 to-slate-950/80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300/85 uppercase">
                    <span>Triadic Coherence</span>
                    <span>+{Math.max(0, liveCoEvo.triadicCoherencePermille - 760)}‰ vs Solo</span>
                  </div>
                  <div className="font-display text-2xl font-semibold text-emerald-100">
                    {(liveCoEvo.triadicCoherencePermille / 10).toFixed(1)}%{' '}
                    <span className="text-xs font-mono text-emerald-300/85">
                      ({liveCoEvo.triadicCoherencePermille}‰)
                    </span>
                  </div>
                  <ProgressMeterBar
                    ratio01={liveCoEvo.triadicCoherencePermille / 1000}
                    tone="emerald"
                  />
                  <div className="text-[11px] font-mono text-emerald-200/80">
                    Quality {(liveCoEvo.incumbentQualityPermille / 10).toFixed(1)}% · Dissonance{' '}
                    {liveCoEvo.incumbentDissonancePermille}‰
                  </div>
                </div>

                <div className="rounded-xl border border-teal-300/25 bg-gradient-to-br from-emerald-950/80 to-slate-950/80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-teal-200/85 uppercase">
                    <span>Multi-Modal Fidelity</span>
                    <span>{highestRes.resolutionRealizationPct}% Apex</span>
                  </div>
                  <div className="font-display text-2xl font-semibold text-teal-100">
                    {manifold.globalFidelityIndex.toFixed(3)}×{' '}
                    <span className="text-xs font-mono text-teal-300/85">
                      ({consolidatedPartCount}/11 Consolidated)
                    </span>
                  </div>
                  <ProgressMeterBar ratio01={multiModal.normalizedFidelity01} tone="teal" />
                  <div className="text-[11px] font-mono text-emerald-200/80">
                    {multiModal.bMeshRadialSubdivisions} B-Mesh · {multiModal.spectralBandCount} nm
                    Bands · {multiModal.barkMaskingHeadroomDb.toFixed(2)} dB
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/80 to-slate-950/80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-200/85 uppercase">
                    <span>Ecological Maturity</span>
                    <span>{telemetry.harmony}% Harmony</span>
                  </div>
                  <div className="font-display text-2xl font-semibold text-amber-50">
                    {telemetry.attunedCount} / {telemetry.totalPlants}{' '}
                    <span className="text-xs font-mono text-emerald-300/85">Flora</span>
                  </div>
                  <ProgressMeterBar
                    ratio01={telemetry.attunedCount / Math.max(1, telemetry.totalPlants)}
                    tone="amber"
                  />
                  <div className="text-[11px] font-mono text-emerald-200/80">
                    {ecologySnapshot.lifecycleCounts['mycelial-memory']} Elders ·{' '}
                    {ecologySnapshot.emergentCount} Offshoots ·{' '}
                    {ecologySnapshot.tunedWaystoneCount}/{ecologySnapshot.totalWaystones} Waystones
                  </div>
                </div>
              </div>

              {/* SECTION 1: AUTONOMOUS EVOLUTIONARY LINEAGE & HOST RUNTIME SATURATION */}
              <div
                data-testid="telemetry-lineage-card"
                className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-amber-300/85 uppercase tracking-wider">
                      Autonomous Browser Self-Hosting Lifecycle · UORC v1 Spore Engine
                    </div>
                    <h3 className="font-display text-xl font-semibold text-amber-100">
                      Evolutionary Lineage & Host Runtime Saturation
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-emerald-400/25 bg-slate-950/60 text-emerald-200">
                    {CERTIFIED_PRODUCTION_MANIFEST.roots.length} Certified Wasm Roots (
                    {CERTIFIED_PRODUCTION_MANIFEST.rustCoreNoStdRootCount} no_std +{' '}
                    {CERTIFIED_PRODUCTION_MANIFEST.rustStdRootCount} std)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hot-Compiled Generation Multipliers */}
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-200">
                        Active Hot-Projected Organism Parameters
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300/85">
                        {activeProjection.enhancementFocus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Prime Overtone Limit
                        </div>
                        <div className="text-sm text-amber-100 mt-0.5">
                          {activeProjection.primeHarmonicLimit}-Limit JI
                        </div>
                      </div>
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Phyllotaxis Spiral
                        </div>
                        <div className="text-sm text-amber-100 mt-0.5">
                          F_{activeProjection.phyllotaxisSpiral === 21 ? '8' : '7'} ={' '}
                          {activeProjection.phyllotaxisSpiral} Parastichies
                        </div>
                      </div>
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Acoustic Warmth Scale
                        </div>
                        <div className="text-sm text-teal-200 mt-0.5">
                          {activeProjection.warmthScale.toFixed(3)}×
                        </div>
                      </div>
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Player Locus Scale
                        </div>
                        <div className="text-sm text-emerald-200 mt-0.5">
                          {activeProjection.playerEmbodimentScale.toFixed(3)}×
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Browser Host API Saturation & Frame Budget */}
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-200">
                        Host Hardware & 60Hz Frame Budget
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300/85">
                        API Saturation {hostSat.apiSaturationPermille}‰
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-emerald-200/85">
                        <span>Reconciliation CPU Step</span>
                        <span>
                          {observedFrameMicros.toLocaleString()} /{' '}
                          {frameBudgetMicros.toLocaleString()} µs
                        </span>
                      </div>
                      <ProgressMeterBar
                        ratio01={Math.min(1, observedFrameMicros / frameBudgetMicros)}
                        tone="sky"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-100/85 pt-1">
                      <div>
                        Wasm Threads: {hostSat.activeThreads}/{hostSat.logicalThreads} (Pool{' '}
                        {hostSat.workerPoolSize})
                      </div>
                      <div>
                        Granule: {Math.round(hostSat.activeGranuleBytes / 1024)} KiB ({hostSat.wasmPages64KiB}{' '}
                        Pages)
                      </div>
                      <div>
                        OPFS: {hostSat.opfsMounted ? 'Mounted' : 'Memory'} · SW:{' '}
                        {hostSat.serviceWorkerActive ? 'Active' : 'Standby'}
                      </div>
                      <div>
                        AudioWorklet: {hostSat.audioWorkletActive ? '128-Frame Live' : 'WebAudio'} ·
                        Rollbacks: {selfHostState.rollbackCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generation Frontier Timeline */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-200">
                      Certified Generation Frontier ({selfHostState.frontier.length} Local
                      {archivedGenRank > liveGenRank
                        ? ` · Session Archive Evolved to ${archivedSessionMeta?.selfHostGenerationId}`
                        : ''}
                      )
                    </span>
                    {archivedSessionMeta?.merkleDigestHex && (
                      <span className="font-mono text-[11px] text-amber-200/85">
                        Anamnesis Merkle {shortHex(archivedSessionMeta.merkleDigestHex, 12)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {selfHostState.frontier.length > 0 ? (
                      selfHostState.frontier.map((rec) => (
                        <div
                          key={rec.generationId}
                          className={`rounded-lg border p-3 text-xs space-y-1 ${
                            rec.generationId === selfHostState.headGenerationId
                              ? 'border-amber-300/45 bg-emerald-900/35'
                              : 'border-emerald-400/15 bg-slate-950/45'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-semibold text-amber-200">{rec.generationId}</span>
                            <span className="text-[11px] text-emerald-300/80">
                              Telos {rec.telosLoss} · {rec.decideGatesPassed}/{rec.decideGatesTotal}{' '}
                              Gates
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-emerald-200/75">
                            {rec.compiledWasmBytes.toLocaleString()} B wasm32 · κ{' '}
                            {shortHex(rec.treeKappa, 8)}
                          </div>
                          <p className="text-[11px] text-emerald-100/80 line-clamp-2">
                            {rec.summary}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3 text-xs text-emerald-200/85">
                        Genesis spore ({selfHostState.headGenerationId}) mounted cleanly; autonomous
                        background promotion activates as you explore in resonant calm.
                      </div>
                    )}

                    {archivedGenRank > liveGenRank && archivedSessionMeta?.selfHostGenerationId && (
                      <div className="rounded-lg border border-amber-300/50 bg-amber-950/25 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-semibold text-amber-200">
                            {archivedSessionMeta.selfHostGenerationId} · Shared Session Archive
                          </span>
                          <span className="text-[11px] text-amber-200/85">UORC Restored</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-200/80">
                          Archive Tree κ {shortHex(archivedSessionMeta.selfHostTreeKappa, 12)}
                        </div>
                        <p className="text-[11px] text-emerald-100/85">
                          Restored from your shareable #uorc garden archive with full 22-model
                          synaptic weights and curated sanctuary memories.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: HOLISTIC 11-PART OBSERVER & EMBODIED PLAYER CO-EVOLUTION */}
              <div
                data-testid="telemetry-observer-card"
                className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-teal-300/85 uppercase tracking-wider">
                      Rule-30 × Theory-of-Mind Plasticity · 11-Part Holistic Observer
                    </div>
                    <h3 className="font-display text-xl font-semibold text-amber-100">
                      Observer Wholeness & Embodied Player Co-Evolution
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-teal-300/30 bg-slate-950/60 text-teal-200">
                    {affect.emotionLabel} · {affect.harmonyPermille}‰ Harmony : {affect.chaosPermille}‰
                    Aperiodic
                  </span>
                </div>

                {/* Co-Evolution Bar & Causal Why Banner */}
                <div className="rounded-lg border border-emerald-400/15 bg-slate-950/50 p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-amber-200">
                      Co-Evolution Bars: {liveCoEvo.barTickCount} ·{' '}
                      {all22ModelsAtCeiling
                        ? 'All 22 Models Consolidated at 16/16 Ceiling (Homeostasis Preserved)'
                        : `${liveCoEvo.admittedMutationCount} Weight Promotions Admitted`}
                    </span>
                    <span className="text-emerald-300/85">
                      Rule-30 {liveCoEvo.rule30RegisterHex} · Intent:{' '}
                      {liveCoEvo.playerTheoryOfMindIntent}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/85 leading-relaxed">
                    <span className="font-mono text-teal-200">
                      [{observer.latestWhyPacket.sourcePart} →{' '}
                      {observer.latestWhyPacket.bottleneckPart}]
                    </span>{' '}
                    {observer.latestWhyPacket.whyRationale}
                  </p>
                </div>

                {/* 11-Part Holistic Observer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {OBSERVER_PART_ORDER.map((partId: ObserverPartId) => {
                    const part = observer.parts[partId];
                    const niche = partNiches[partId];
                    const isPlayer = partId === 'player-user';
                    return (
                      <div
                        key={partId}
                        className={`rounded-lg border p-3 space-y-1.5 ${
                          isPlayer
                            ? 'border-amber-300/45 bg-emerald-900/35'
                            : 'border-emerald-400/15 bg-slate-950/45'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-amber-100 truncate">
                            {part.label}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-200 shrink-0">
                            p={niche?.basisPrime ?? 181} · {part.synapticWeight}/16
                          </span>
                        </div>
                        <ProgressMeterBar
                          ratio01={part.synapticWeight / 16}
                          tone={isPlayer ? 'amber' : part.synapticWeight >= 12 ? 'teal' : 'emerald'}
                        />
                        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300/80">
                          <span className="truncate">{niche?.nicheArchetypeTitle ?? part.roleInObserver}</span>
                          <span className="shrink-0">{part.fidelityMultiplier.toFixed(3)}×</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Three Created Cosmogenic Realms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-amber-300/25 bg-slate-950/50 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-200">Embodied Player Realm</span>
                      <span className="font-mono text-amber-100">
                        {(playerRealm.embodimentPermille / 10).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-200/85">
                      Walk {playerRealm.baseWalkSpeedMps.toFixed(2)} m/s · Eye{' '}
                      {playerRealm.eyeStatureMeters.toFixed(2)}m · Spring{' '}
                      {playerRealm.cameraSpringGraceMultiplier.toFixed(2)}×
                    </div>
                    <div className="text-[11px] text-emerald-100/80">
                      Co-Observer Locus: {playerRealm.coObserverLocusHarmonicNodes}-node harmonic
                      ring ({playerRealm.coObserverLocusOuterRadiusMeters.toFixed(2)}m radius).
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-400/20 bg-slate-950/50 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-200">Organic Biota Realm</span>
                      <span className="font-mono text-emerald-100">
                        {(organicRealm.organicVitalityPermille / 10).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-200/85">
                      {organicRealm.conservatoryTreeCount} Trees · Kuramoto{' '}
                      {organicRealm.kuramotoEntrainmentRadiusMeters.toFixed(1)}m · Chromophore{' '}
                      {organicRealm.bioluminescentChromophoreGain.toFixed(2)}×
                    </div>
                    <div className="text-[11px] text-emerald-100/80">
                      {(Object.keys(LIFECYCLE_LABELS) as BotanicalLifecycleStageId[])
                        .filter((st) => ecologySnapshot.lifecycleCounts[st] > 0)
                        .map((st) => `${ecologySnapshot.lifecycleCounts[st]} ${LIFECYCLE_LABELS[st]}`)
                        .join(' · ')}
                    </div>
                  </div>

                  <div className="rounded-lg border border-teal-300/20 bg-slate-950/50 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-teal-200">Inorganic Monument Realm</span>
                      <span className="font-mono text-teal-100">
                        {(inorganicRealm.inorganicScalePermille / 10).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-200/85">
                      {inorganicRealm.observerMonumentCount} Monuments ·{' '}
                      {inorganicRealm.steppingStoneHarmonicCount} Waystones · Sustain{' '}
                      {inorganicRealm.chimeSustainFactor.toFixed(2)}×
                    </div>
                    <div className="text-[11px] text-emerald-100/80">
                      Concert Pitch {observer.cosmogenesis.concertPitchHz.toFixed(1)} Hz · Seed α=
                      {observer.cosmogenesis.alphaSeed} · Ω{' '}
                      {(observer.cosmogenesis.omegaConvergenceRatio * 100).toFixed(1)}%.
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SUPRA-DIRECTIVE SYNTHESIS & 22 CANONICAL STANDARD MODELS */}
              <div
                data-testid="telemetry-models-card"
                className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-amber-300/85 uppercase tracking-wider">
                      {supra.tierLabel} · {audit22.totalStandardModels} Consecutive Prime Models (p=71..179)
                    </div>
                    <h3 className="font-display text-xl font-semibold text-amber-100">
                      Supra-Directive Synthesis & 22 Canonical Standard Models
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-emerald-400/25 bg-slate-950/60 text-emerald-200">
                    {audit22.totalVerifiedContextCells} Context Cells ·{' '}
                    {audit22.crossModelFunctorPathways} Functor Pathways
                  </span>
                </div>

                {/* Active Supra-Directive Model Card */}
                <div className="rounded-lg border border-amber-300/25 bg-slate-950/55 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-amber-200">
                      Active Synthesized Model: {supra.activeModel.modelName}{' '}
                      <span className="text-xs font-mono text-emerald-300/85">
                        ({supra.activeModel.origin} · {supra.runtimeSynthesizedModels.length}{' '}
                        Runtime Minted)
                      </span>
                    </div>
                    <span className="text-xs font-mono text-teal-200">
                      PointKey {supra.activeModel.uorPointKeyHex}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-emerald-100/90">
                    <div>B-Mesh: {supra.activeModel.radialSubdivisions} subdiv</div>
                    <div>Crown Petals: {supra.activeModel.harmonicCrownPetals}</div>
                    <div>Quartz Spires: {supra.activeModel.crystalFiligreeSpires}</div>
                    <div>Thin-Film: {supra.activeModel.thinFilmIridescenceSpanNm} nm</div>
                    <div>
                      Triad:{' '}
                      {supra.activeModel.supraOvertoneRatios.map((r) => r.toFixed(2)).join(' : ')}
                    </div>
                  </div>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    {supra.activeModel.whySynthesized}
                  </p>
                </div>

                {/* 22 Canonical Standard Models Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {standardModels.map((model) => {
                    const liveW = liveCoEvo.modelWeights22[model.modelKey] ?? model.synapticWeight;
                    const depthPct = Math.round(model.coherentDepthPpm / 10000);
                    return (
                      <div
                        key={model.modelKey}
                        className="rounded-lg border border-emerald-400/15 bg-slate-950/45 px-3 py-2 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <span className="font-medium text-emerald-50 truncate">
                            <span className="font-mono text-amber-300/85 mr-1">
                              #{String(model.modelIndex).padStart(2, '0')}
                            </span>
                            {model.displayName}
                          </span>
                          <span className="font-mono text-[11px] text-amber-200 shrink-0">
                            p={model.basisPrime} · {liveW}/16
                          </span>
                        </div>
                        <ProgressMeterBar
                          ratio01={liveW / 16}
                          tone={liveW >= 16 ? 'amber' : 'teal'}
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300/75">
                          <span className="truncate">SI: {model.siFormula}</span>
                          <span>Depth {depthPct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: 5W+H PARAMETRIC ONTOLOGY, LIVE SPATIAL/ACOUSTIC TELEMETRY & MEMORIES */}
              <div
                data-testid="telemetry-ontology-card"
                className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-teal-300/85 uppercase tracking-wider">
                      5W+H Self-Describing Ontology · {GENERATED_ONTOLOGY_5WH_LEDGER.groundedModuleCount}/
                      {GENERATED_ONTOLOGY_5WH_LEDGER.groundedModuleCount} Grounded Modules ·{' '}
                      {GENERATED_ONTOLOGY_5WH_LEDGER.totalStructureCount}/
                      {GENERATED_ONTOLOGY_5WH_LEDGER.totalStructureCount} Certified Structures
                    </div>
                    <h3 className="font-display text-xl font-semibold text-amber-100">
                      Parametric Ontology Coordinates, Live Acoustics & Curated Memories
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono border border-emerald-400/25 bg-slate-950/60 text-amber-200">
                    Telos Loss {liveCoEvo.ontologicalTelos.totalTelosLoss} · Opacity Debt{' '}
                    {liveCoEvo.ontologicalTelos.epistemicOpacityDebt} · Triad 2×3×5=
                    {liveCoEvo.ontologicalTelos.triadicAgencyProduct}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 5W+H Evolved Coordinates */}
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-200">
                        Evolved 16-Bit Parametric Ontology Coordinates
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300/80">
                        8 Strata (p=2..19)
                      </span>
                    </div>
                    {(
                      [
                        [
                          'Harmonic Simplicity',
                          liveCoEvo.ontologicalTelos.coordinates.harmonicSimplicity,
                        ],
                        [
                          'Phyllotaxis Clarity',
                          liveCoEvo.ontologicalTelos.coordinates.phyllotaxisClarity,
                        ],
                        [
                          'Wave Calm Damping',
                          liveCoEvo.ontologicalTelos.coordinates.waveCalmDamping,
                        ],
                        [
                          'Iridescence Legibility',
                          liveCoEvo.ontologicalTelos.coordinates.iridescenceLegibility,
                        ],
                        [
                          'Guild Offshoot Density',
                          liveCoEvo.ontologicalTelos.coordinates.guildOffshootDensity,
                        ],
                      ] as [string, number][]
                    ).map(([label, val]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-emerald-100/90">
                          <span>{label}</span>
                          <span>{val} / 16</span>
                        </div>
                        <ProgressMeterBar ratio01={val / 16} tone="emerald" />
                      </div>
                    ))}
                  </div>

                  {/* Live Conservatory Spatial & Acoustic Telemetry */}
                  <div className="rounded-lg border border-emerald-400/15 bg-slate-950/50 p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-teal-200">
                        Live Spatial, Acoustic & Score Telemetry
                      </span>
                      <span className="font-mono text-[11px] text-amber-200">
                        {telemetry.prismRule ?? 'PRISM'} · {telemetry.prismOutcome}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-100/85">
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Player Geodesic Pose
                        </div>
                        <div className="mt-0.5">
                          ({telemetry.playerX.toFixed(1)}m, {telemetry.playerZ.toFixed(1)}m) ·{' '}
                          {headingDeg}°
                        </div>
                      </div>
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Substrate & Occlusion
                        </div>
                        <div className="mt-0.5">
                          {telemetry.surfaceMaterial} · {Math.round(telemetry.acousticOcclusion * 100)}%
                          Occ
                        </div>
                      </div>
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          4-Stem Polyphonic Score
                        </div>
                        <div className="mt-0.5">
                          {telemetry.soundtrackScore.tempoBpm} BPM · Step{' '}
                          {telemetry.currentSoundtrackStep + 1}/16 ·{' '}
                          {Math.round(telemetry.soundtrackScore.curatedConsonancePurity01 * 100)}% JI
                        </div>
                      </div>
                      <div className="rounded bg-emerald-950/50 border border-emerald-400/10 p-2">
                        <div className="text-[10px] text-emerald-300/75 uppercase">
                          Immanent Witness
                        </div>
                        <div className="mt-0.5">
                          {observer.immanentPresence.communionState} (
                          {observer.immanentPresence.distanceToPlayerMeters.toFixed(1)}m)
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-emerald-200/80 pt-1">
                      Kernel Dispatch: &ldquo;{telemetry.prismRequest}&rdquo;
                    </div>
                  </div>
                </div>

                {/* Consolidated Merkle Conservatory Memories */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-200">
                      Consolidated Merkle Garden Memories ({consolidatedMemories.length})
                    </span>
                    <span className="font-mono text-[11px] text-emerald-300/80">
                      Lyapunov-Curated Sanctuary Milestones
                    </span>
                  </div>

                  {consolidatedMemories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {consolidatedMemories.map((mem) => (
                        <div
                          key={mem.memoryId}
                          className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-amber-100 truncate">
                              ✦ {mem.title}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-300/80 uppercase shrink-0">
                              {mem.biome}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-200/80">
                            <span>
                              Ratios [{mem.signatureRatios.map((r) => r.toFixed(2)).join(', ')}]
                            </span>
                            <span>
                              Tick {mem.consolidatedAtTick} · κ {shortHex(mem.memoryKappa, 8)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-400/15 bg-slate-950/45 p-3 text-xs text-emerald-200/80">
                      Walk through sanctuary biomes, attune companion guilds, or commune with the
                      Immanent Witness to consolidate permanent Merkle garden memories.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
