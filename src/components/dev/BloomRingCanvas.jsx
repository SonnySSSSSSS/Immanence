// src/components/dev/BloomRingCanvas.jsx
// Thin re-export wrapper — delegates all rendering to the shared BloomRingRenderer.
// Accepts the same flat props interface as before so existing callers are unaffected.
// Core rendering logic lives in: src/components/bloomRing/BloomRingRenderer.jsx

import BloomRingRenderer from '../bloomRing/BloomRingRenderer.jsx';

export default function BloomRingCanvas({ width, height, accentColor, mode = 'lab', ...rest }) {
  return (
    <BloomRingRenderer
      params={{ width, height, ...rest }}
      accentColor={accentColor}
      mode={mode}
    />
  );
}
