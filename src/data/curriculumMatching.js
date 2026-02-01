export const MATCH_POLICY = Object.freeze({
  EXACT_PRACTICE: 'exact_practice',
  ANY_IN_CATEGORY: 'any_in_category',
});

export function isMatchPolicy(v) {
  return v === MATCH_POLICY.EXACT_PRACTICE || v === MATCH_POLICY.ANY_IN_CATEGORY;
}
