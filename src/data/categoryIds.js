export const CATEGORY_IDS = Object.freeze([
  'breathwork',
  'awareness',
  'body_scan',
  'visualization',
  'sound',
  'ritual',
  'wisdom',
  // 'movement', // enable only when UI supports it as first-class
  'circuit_training',
]);

export function isCategoryId(v) {
  return typeof v === 'string' && CATEGORY_IDS.includes(v);
}
