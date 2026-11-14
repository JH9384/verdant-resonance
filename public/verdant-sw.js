/**
 * Verdant Resonance — Sovereign Browser Self-Hosting ServiceWorker (`gen-0 .. gen-N`)
 * (`public/verdant-sw.js`)
 *
 * Caches the conservatory runtime, certified WebAssembly kernel, AudioWorklet, and
 * canonical `verdant_gen0_sources.uorc` spore archive so Verdant lives autonomously
 * inside the user's browser even completely offline.
 */

const CACHE_NAME = 'verdant-selfhost-v2';
const CORE_PRECACHE_PATHS = [
  './',
  './index.html',
  './wasm/verdant_certified_runtime.wasm',
  './wasm/verdant_certified_manifest.json',
  './genesis/verdant_gen0_sources.uorc',
  './genesis/verdant_gen0_manifest.json',
  './verdant-audio-worklet.js',
];

const virtualGenerationStore = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(CORE_PRECACHE_PATHS.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((oldKey) => caches.delete(oldKey)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (
    (data.type === 'STAGE_GENERATION_ARTIFACT' || data.type === 'VERDANT_STAGE_GEN_ARTIFACT') &&
    typeof data.path === 'string'
  ) {
    virtualGenerationStore.set(data.path, {
      body: data.bytes || data.body,
      contentType: data.contentType || 'application/wasm',
    });
    event.source?.postMessage({
      type: 'GENERATION_ARTIFACT_STAGED',
      path: data.path,
    });
  } else if (data.type === 'QUERY_SW_STATUS') {
    event.source?.postMessage({
      type: 'SW_STATUS_REPORT',
      cacheName: CACHE_NAME,
      stagedArtifactCount: virtualGenerationStore.size,
    });
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Vite dev-server HMR, virtual modules, or unbundled /src/ transforms
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.search.includes('import') ||
    url.search.includes('t=')
  ) {
    return;
  }

  const genIdx = url.pathname.indexOf('/__verdant_gen__/');
  if (genIdx !== -1) {
    const virtualKey = url.pathname.slice(genIdx);
    const staged = virtualGenerationStore.get(virtualKey);
    if (staged) {
      event.respondWith(
        new Response(staged.body, {
          status: 200,
          headers: { 'Content-Type': staged.contentType },
        }),
      );
      return;
    }
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200) {
          void cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        throw new Error(`Offline cache miss for ${url.pathname}`);
      }
    }),
  );
});
