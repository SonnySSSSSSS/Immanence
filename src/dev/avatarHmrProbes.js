const DEV_HMR_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

const OWNER_KIND = 'owner';
const HOST_KIND = 'host';
const SUBSTRATE_KIND = 'substrate';
const DERIVATION_KIND = 'derivation';

const CONTEXT_KEYS = {
  [OWNER_KIND]: '__avatarHmrOwnerProbe__',
  [HOST_KIND]: '__avatarHmrHostProbe__',
  [SUBSTRATE_KIND]: '__avatarHmrSubstrateProbe__',
  [DERIVATION_KIND]: '__avatarHmrDerivationProbe__',
};

const PROBE_LABELS = {
  [OWNER_KIND]: '[PROBE:avatar-hmr-owner]',
  [HOST_KIND]: '[PROBE:avatar-hmr-host]',
  [SUBSTRATE_KIND]: '[PROBE:avatar-hmr-substrate]',
  [DERIVATION_KIND]: '[PROBE:avatar-hmr-derivation]',
};

function createDefaultContext(kind) {
  if (kind === OWNER_KIND) {
    return {
      eventSeq: 0,
      renderSeq: 0,
      mainEvalSeq: 0,
      mainMountSeq: 0,
    };
  }
  if (kind === HOST_KIND) {
    return {
      eventSeq: 0,
      appMountSeq: 0,
      sectionViewMountSeq: 0,
      homeHubMountSeq: 0,
      avatarV3MountSeq: 0,
    };
  }
  if (kind === SUBSTRATE_KIND) {
    return {
      eventSeq: 0,
      mountSeq: 0,
      nextElementId: 0,
      elementIds: new WeakMap(),
      lastDescriptorSignature: null,
      lastInstanceSignature: null,
    };
  }
  if (kind === DERIVATION_KIND) {
    return {
      eventSeq: 0,
      events: [],
    };
  }
  return { eventSeq: 0 };
}

function getProbeContext(kind) {
  if (!DEV_HMR_ENABLED || typeof window === 'undefined') return null;
  const contextKey = CONTEXT_KEYS[kind];
  if (!contextKey) return null;
  const probe = window[contextKey] ?? createDefaultContext(kind);
  if (kind === SUBSTRATE_KIND && !(probe.elementIds instanceof WeakMap)) {
    probe.elementIds = new WeakMap();
  }
  window[contextKey] = probe;
  return probe;
}

export function isAvatarHmrProbeEnabled() {
  return DEV_HMR_ENABLED;
}

export function logAvatarHmrProbe(kind, source, event, detail = {}) {
  const probe = getProbeContext(kind);
  if (!probe) return;
  probe.eventSeq += 1;
  const payload = {
    seq: probe.eventSeq,
    source,
    event,
    timestamp: new Date().toISOString(),
    detail,
  };
  if (kind === DERIVATION_KIND) {
    probe.events.push(payload);
    if (probe.events.length > 400) {
      probe.events.shift();
    }
  }
  console.info(PROBE_LABELS[kind] || '[PROBE:avatar-hmr]', payload);
}

export function incrementAvatarHmrProbeCounter(kind, counterName) {
  const probe = getProbeContext(kind);
  if (!probe || typeof counterName !== 'string' || !counterName) return null;
  const current = Number(probe[counterName] || 0);
  const next = current + 1;
  probe[counterName] = next;
  return next;
}

export function getAvatarHmrProbeElementId(node, label) {
  const probe = getProbeContext(SUBSTRATE_KIND);
  if (!probe || !node) return null;
  if (!probe.elementIds.has(node)) {
    probe.nextElementId += 1;
    probe.elementIds.set(node, `${label}-${probe.nextElementId}`);
  }
  return probe.elementIds.get(node);
}

export function compareAndStoreAvatarHmrSubstrateSignatures(descriptorSignature, instanceSignature) {
  const probe = getProbeContext(SUBSTRATE_KIND);
  if (!probe) {
    return {
      descriptorStableVsPrevious: false,
      instanceStableVsPrevious: false,
    };
  }
  const result = {
    descriptorStableVsPrevious: probe.lastDescriptorSignature === descriptorSignature,
    instanceStableVsPrevious: probe.lastInstanceSignature === instanceSignature,
  };
  probe.lastDescriptorSignature = descriptorSignature;
  probe.lastInstanceSignature = instanceSignature;
  return result;
}

