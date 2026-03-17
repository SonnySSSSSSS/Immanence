import { driver } from 'driver.js';

function toDriverSide(placement) {
  if (placement === 'center') return 'over';
  return placement || 'over';
}

export function createDriverInstance(step, handlers = {}) {
  return driver({
    animate: true,
    smoothScroll: true,
    stagePadding: 12,
    stageRadius: 16,
    overlayColor: 'rgba(5, 12, 18, 0.78)',
    overlayOpacity: 0.72,
    allowClose: step?.canSkip !== false,
    allowKeyboardControl: step?.canSkip !== false,
    overlayClickBehavior: step?.canSkip === false ? undefined : 'close',
    disableActiveInteraction: step?.allowInteraction !== true,
    showButtons: [],
    showProgress: false,
    popoverClass: 'immanence-driver-popover',
    onCloseClick: handlers.onClose,
  });
}

export function createDriverStep(step, element, handlers = {}) {
  return {
    element: element || undefined,
    disableActiveInteraction: step?.allowInteraction !== true,
    popover: {
      title: ' ',
      description: ' ',
      side: toDriverSide(step?.placement),
      align: 'center',
      showButtons: [],
      showProgress: false,
      popoverClass: 'immanence-driver-popover',
      onCloseClick: handlers.onClose,
      onPopoverRender: handlers.onPopoverRender,
    },
  };
}
