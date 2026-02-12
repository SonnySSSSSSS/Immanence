const TARGET_ATTR = 'data-ui-target';
const ID_ATTR = 'data-ui-id';
const SCOPE_ATTR = 'data-ui-scope';
const ROLE_GROUP_ATTR = 'data-ui-role-group';
const SURFACE_ATTR = 'data-ui-fx-surface';

const ROLE_GROUP_ALLOWLIST = new Set(['homeHub', 'practice', 'dailyPractice']);

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function cssEscape(value) {
  const v = String(value ?? '');
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(v);
  return v.replace(/["\\]/g, '\\$&');
}

function safeClassName(el) {
  if (!(el instanceof Element)) return '';
  return typeof el.className === 'string' ? el.className.trim() : '';
}

function nthOfType(el) {
  if (!(el instanceof Element) || !el.parentElement) return 1;
  const tag = el.tagName;
  let idx = 0;
  for (const sib of Array.from(el.parentElement.children)) {
    if (!(sib instanceof Element)) continue;
    if (sib.tagName === tag) idx += 1;
    if (sib === el) return idx || 1;
  }
  return 1;
}

function elLocator(el) {
  if (!(el instanceof Element)) return 'unknown';
  const tag = String(el.tagName || '').toLowerCase() || 'element';
  const cls = safeClassName(el)
    ? `.${safeClassName(el).split(/\s+/g).slice(0, 3).join('.')}`
    : '';
  const nth = nthOfType(el);
  return `${tag}${cls}:nth-of-type(${nth})`;
}

export function buildViolationKey({ code, el, roleGroupHint = null }) {
  const group = roleGroupHint || (el instanceof Element ? el.getAttribute(ROLE_GROUP_ATTR) : null) || 'unknown';
  return `${code}@${group}/${elLocator(el)}`;
}

export function findUiTargetRootFromEventTarget(target) {
  const t = target instanceof Element ? target : null;
  if (!t) return null;
  return t.closest?.(`[${TARGET_ATTR}="true"]`) || null;
}

export function resolveFxSurface(root) {
  if (!(root instanceof Element)) {
    return { ok: false, surfaceEl: null, surfaceIsRoot: false, reason: 'no-root' };
  }
  const rootIsSurface = root.hasAttribute(SURFACE_ATTR);
  const descSurfaces = root.querySelectorAll?.(`[${SURFACE_ATTR}="true"]`) || [];
  if (rootIsSurface && descSurfaces.length === 0) {
    return { ok: true, surfaceEl: root, surfaceIsRoot: true, reason: null };
  }
  if (!rootIsSurface && descSurfaces.length === 1) {
    const s = descSurfaces[0];
    return { ok: true, surfaceEl: s instanceof Element ? s : null, surfaceIsRoot: false, reason: null };
  }
  return {
    ok: false,
    surfaceEl: null,
    surfaceIsRoot: false,
    reason: rootIsSurface ? 'root-and-desc-surface' : (descSurfaces.length === 0 ? 'missing-surface' : 'multiple-surfaces'),
  };
}

export function validateUiTargetRoot(root) {
  if (!hasDom()) {
    return { ok: false, violationKey: 'NO_DOM', reasons: ['no-dom'], rootId: null, roleGroup: null, scope: null, surfaceEl: null, surfaceIsRoot: false };
  }
  if (!(root instanceof Element)) {
    return { ok: false, violationKey: buildViolationKey({ code: 'NO_ROOT', el: root }), reasons: ['no-root'], rootId: null, roleGroup: null, scope: null, surfaceEl: null, surfaceIsRoot: false };
  }

  const reasons = [];
  const rootId = root.getAttribute(ID_ATTR);
  const scope = root.getAttribute(SCOPE_ATTR);
  const roleGroup = root.getAttribute(ROLE_GROUP_ATTR);

  if (!rootId || !String(rootId).trim()) reasons.push('missing-id');
  if (scope !== 'role' && scope !== 'instance') reasons.push('invalid-scope');

  if (scope === 'role') {
    if (!roleGroup || !String(roleGroup).trim()) reasons.push('missing-role-group');
    if (roleGroup && !ROLE_GROUP_ALLOWLIST.has(roleGroup)) reasons.push('role-group-not-allowlisted');
    if (roleGroup && rootId && !String(rootId).startsWith(`${roleGroup}:`)) reasons.push('role-id-not-namespaced');
  }

  // Nested targets are forbidden in Phase A.
  const ancestorTarget = root.parentElement?.closest?.(`[${TARGET_ATTR}="true"]`) || null;
  if (ancestorTarget) reasons.push('nested-in-ancestor-target');
  const descTarget = root.querySelector?.(`[${TARGET_ATTR}="true"]`) || null;
  if (descTarget) reasons.push('contains-descendant-target');

  const surface = resolveFxSurface(root);
  if (!surface.ok) reasons.push(`surface:${surface.reason}`);

  // Instance id must be unique in the DOM.
  if (scope === 'instance' && rootId) {
    try {
      const matches = document.querySelectorAll?.(`[${ID_ATTR}="${cssEscape(rootId)}"]`) || [];
      if (matches.length > 1) reasons.push('duplicate-instance-id');
    } catch {
      // ignore escape/query errors
    }
  }

  if (reasons.length > 0) {
    const code = reasons.includes('missing-id') ? 'MISSING_ID' : 'INVALID_TARGET';
    const violationKey = buildViolationKey({ code, el: root, roleGroupHint: roleGroup });
    return {
      ok: false,
      violationKey,
      reasons,
      rootId: rootId || null,
      roleGroup: roleGroup || null,
      scope: scope || null,
      surfaceEl: null,
      surfaceIsRoot: false,
    };
  }

  return {
    ok: true,
    violationKey: null,
    reasons: [],
    rootId,
    roleGroup: roleGroup || null,
    scope,
    surfaceEl: surface.surfaceEl,
    surfaceIsRoot: surface.surfaceIsRoot,
  };
}
