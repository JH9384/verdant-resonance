# Verdant Resonance

[![Deploy game to GitHub Pages](https://github.com/afflom/verdant-resonance/actions/workflows/pages.yml/badge.svg)](https://github.com/afflom/verdant-resonance/actions/workflows/pages.yml)

A peaceful, self-hosting first-person botanical conservatory and autonomous formal organism. Wander through five living acoustic biomes, attune interactive flora, witness a procedural polyphonic soundscape and thin-film iridescent world that respond to stillness and diurnal light, and inspect or evolve the organism's own formal specification directly inside your browser.

## Play

Published at <https://afflom.github.io/verdant-resonance/>.

## Run & Verify Locally

Requires Node.js 22 (and Rust + Lean 4.32 only when regenerating `.lex.tex` kernel proofs).

```sh
npm ci
npm run dev
```

To run the full mechanized verification, shrink-only ratchet, conformance, typecheck, test, and bundle homeostasis gate:

```sh
npm run prism:status
npm run prism:kpis
npm run prism:engine-tick
npm run prism:gate
```

## Controls

- **WASD / Arrow keys** — move through the conservatory
- **Mouse drag / Q and E** — look around
- **Space** — attune nearby flora; **T** — touch a petal; **C** — practice stillness; **G** — toggle guided stroll
- **L** — cycle diurnal sky (`dawn`, `golden`, `twilight`, `starlight`); **1–5** — travel to a biome sanctuary
- **P / Escape** — open or close the Botanical Field Guide & Atlas
- **O** — open the **5W+H Why** ontology inspector; **F** — open the **Browser Foundry** (`gen-0 -> gen-N`)
- **U** — copy a shareable `#uorc=` lossless `UORC\x01` garden link; **Drop `.vrspore.uorc`** — inhabit a shared organism spore
- **M** — mute/unmute; **R** — reset sanctuary; **H** — hide/show the bottom controls dock

## Self-Describing & Self-Hosting Architecture

- **Zero-Constant `{0, 1}` Parametric 5W+H Ontology**: Rooted in `prism/src/Foundation/Ontology/V1/Model.lex.tex`, constructing primes, powers of two, 8 causal strata, and certified 5W+H (`What`, `Who`, `When`, `Where`, `How`, `Why`) explanations across all `30` grounded LexLean modules and `172` structures with `0` `Classical.choice` axioms.
- **Certified `#![no_std]` WebAssembly Kernel**: `193` Lean-verified roots (`190` `#![no_std]` `rust-core` + `3` `rust-std`) compiled to `public/wasm/verdant_certified_runtime.wasm` (`0` pure TypeScript domain residue in `prism/lift-register.json`).
- **Browser-Resident Sovereign Foundry (`OPFS` + `.vrspore.uorc`)**: Unpacks `public/genesis/verdant_gen0_sources.uorc` into the browser's Origin Private File System (`OPFS`), saturates all `10/10` `Uorc.CapabilityContract` runtime probes with mandatory per-root falsifiers, compiles `.lex.tex -> wasm32` and zero-residue `.ts` in-browser, and couples evolved `gen-N` organisms into live WebGL iridescence, corolla bioluminescence, and `AudioWorklet` warmth with automatic watchdog rollback.
- **Epistemic Honesty Ledger**: Generated mechanically in [`CONFORMANCE.md`](CONFORMANCE.md) (`uor/template-contract/1`: `some-true` external authorities, `build` bijective test scenarios, and `open` measured horizons).

## Deployment

Pushing to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml) and the LexLean-projected certified engine workflow [`.github/workflows/engine.yml`](.github/workflows/engine.yml).
