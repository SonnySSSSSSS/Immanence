// Modern compatibility gate for production dev panel.
// App.jsx expects: `getDevPanelProdGate()`
//
// This bridges to the current devtools gate so we don’t reintroduce legacy behavior.
import { isDevtoolsEnabled } from "../dev/uiDevtoolsGate.js";

export function getDevPanelProdGate() {
  try {
    return !!isDevtoolsEnabled();
  } catch {
    return false;
  }
}
