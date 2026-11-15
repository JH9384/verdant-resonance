import React from 'react';
import {createRoot} from 'react-dom/client';
import {
  initCertifiedWasmRuntime,
  isCertifiedWasmReady,
} from './game/generatedCertifiedWasmBridge';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class SanctuaryErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[SanctuaryErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-[#0b1612] text-emerald-50 p-6 text-center">
          <h1 className="font-display text-3xl text-amber-200 mb-2">Verdant Resonance</h1>
          <p className="text-sm text-emerald-200/80 max-w-md mb-5">
            The conservatory viewport encountered an unexpected graphics interruption and can be
            restored immediately.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-amber-400 text-emerald-950 font-medium text-sm hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Restore Conservatory
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

async function bootCertifiedConservatory(): Promise<void> {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  const root = createRoot(rootEl);
  try {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const wasmUrl = `${cleanBase}wasm/verdant_certified_runtime.wasm`;
    const ok = await initCertifiedWasmRuntime(wasmUrl);
    if (!ok || !isCertifiedWasmReady()) {
      root.render(
        <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-[#0b1612] text-emerald-50 p-6 text-center">
          <h1 className="font-display text-3xl text-amber-200 mb-2">NoCertifiedRoot</h1>
          <p className="text-sm text-emerald-200/80 max-w-md">
            Certified WebAssembly runtime (verdant_certified_runtime.wasm) is required before
            mounting the conservatory.
          </p>
        </div>,
      );
      return;
    }
    const {initVerdantEngineSubstrate} = await import('./selfhost/verdantEngineSubstrate');
    await initVerdantEngineSubstrate(`${cleanBase}wasm/verdant_engine.wasm`);
    const {default: App} = await import('./App.tsx');
    root.render(
      <SanctuaryErrorBoundary>
        <App />
      </SanctuaryErrorBoundary>,
    );
    if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
    }
    window.setTimeout(() => {
      void import('./selfhost/browserSelfHostEngine')
        .then((mod) => mod.bootBrowserSelfHostOrganism(cleanBase))
        .catch((err) => console.warn('[selfhost] Non-fatal background organism boot warning:', err));
    }, 32);
  } catch (err) {
    console.error('[bootCertifiedConservatory]', err);
    root.render(
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-[#0b1612] text-emerald-50 p-6 text-center">
        <h1 className="font-display text-3xl text-amber-200 mb-2">Verdant Resonance</h1>
        <p className="text-sm text-emerald-200/80 max-w-md mb-4">
          {err instanceof Error ? err.message : 'Unexpected conservatory boot error.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-lg bg-amber-400 text-emerald-950 font-medium text-sm hover:bg-amber-300 transition-colors cursor-pointer"
        >
          Reload Conservatory
        </button>
      </div>,
    );
  }
}

void bootCertifiedConservatory();
