export function useDevPanelGate(isOpen, devtoolsEnabled) {
  return Boolean(isOpen && devtoolsEnabled);
}

export default useDevPanelGate;
