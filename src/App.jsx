import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
// Test CI lane enforcement - trivial comment
import { StageTitle } from "./components/StageTitle.jsx";
import { PracticeSection } from "./components/PracticeSection.jsx";
import { HomeHub } from "./components/HomeHub.jsx";

// Lazy load heavy sections for better initial performance
// Named exports need to be wrapped for React.lazy
const WisdomSection = lazy(() => import("./components/WisdomSection.jsx").then(m => ({ default: m.WisdomSection })));
const ApplicationSection = lazy(() => import("./components/ApplicationSection.jsx").then(m => ({ default: m.ApplicationSection })));
import { NavigationSection } from "./components/NavigationSection.jsx";
import { NavigationRitualLibrary } from "./components/NavigationRitualLibrary.jsx";
import { Background } from "./components/Background.jsx";
import { CurriculumCompletionReport } from "./components/CurriculumCompletionReport.jsx";
const DevPanel = lazy(() => import("./components/DevPanel.jsx").then(m => ({ default: m.DevPanel })));
const PracticeButtonElectricBorderOverlay = lazy(() => import("./components/dev/PracticeButtonElectricBorderOverlay.jsx").then(m => ({ default: m.PracticeButtonElectricBorderOverlay })));
const SelectedCardElectricBorderOverlay = lazy(() => import("./components/dev/SelectedCardElectricBorderOverlay.jsx").then(m => ({ default: m.SelectedCardElectricBorderOverlay })));
const SelectedControlElectricBorderOverlay = lazy(() => import("./components/dev/SelectedControlElectricBorderOverlay.jsx").then(m => ({ default: m.SelectedControlElectricBorderOverlay })));
const SelectedPlateOverlay = lazy(() => import("./components/dev/SelectedPlateOverlay.jsx").then(m => ({ default: m.SelectedPlateOverlay })));
import { DisplayModeToggle } from "./components/DisplayModeToggle.jsx";
import { WidthToggle } from "./components/WidthToggle.jsx";
import { useDisplayModeStore } from "./state/displayModeStore.js";
import { useUserModeStore } from "./state/userModeStore.js";
import { useUiStore } from "./state/uiStore.js";
import { useCurriculumStore } from "./state/curriculumStore.js";
import { useDevOverrideStore } from "./dev/devOverrideStore.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { startImagePreloading } from "./utils/imagePreloader.js";
import { InstallPrompt } from "./components/InstallPrompt.jsx";
import { HardwareGuide } from "./components/HardwareGuide.jsx";
import { useWakeLock } from "./hooks/useWakeLock.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { PhoticCirclesOverlay } from "./components/PhoticCirclesOverlay.jsx";
import { SettingsPanel } from "./components/SettingsPanel.jsx";
import { TutorialOverlay } from "./components/tutorial/TutorialOverlay.jsx";
import { ShadowScanOverlay } from "./components/debug/ShadowScanOverlay.jsx";
import { getDebugFlagValue, parseDebugBool, toggleDebugFlag as toggleDebugFlagLs } from "./components/debug/debugFlags.js";
import { useTutorialStore } from "./state/tutorialStore.js";
import { TUTORIALS } from "./tutorials/tutorialRegistry.js";
import { hasDevtoolsQueryFlag, isDevtoolsEnabled, isDevtoolsUnlocked, setDevtoolsUnlocked } from "./dev/uiDevtoolsGate.js";
import { DISABLE_POSTPROCESS, ENABLE_CANVAS_INVENTORY_LOGGER, DISABLE_UI_CONTROLS_CAPTURE } from "./config/renderProbeFlags.js";
// import { VerificationGallery } from "./components/avatar/VerificationGallery.jsx"; // Dev tool - not used
import "./App.css";
import AuthGate from "./components/auth/AuthGate";

const DISABLE_SELECTION = false;

function SectionView({ section, isPracticing, currentPracticeId, onPracticingChange, breathState, onBreathStateChange, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, showFxGallery, onNavigate, onOpenHardwareGuide, onRitualComplete, onOpenPhotic, hideCards, isActiveBreathSession = false }) {
  // NOTE: Previously had a special vipassana branch that rendered PracticeSection without wrapper divs.
  // This caused unmount/remount when transitioning to vipassana practices because the tree structure changed.
  // REMOVED: The vipassana InsightMeditationPortal uses createPortal to render to document.body,
  // so wrapper divs don't affect its fullscreen rendering. Keeping consistent tree structure prevents
  // the unmount/remount bug that was resetting sessions.
  
  return (
    <div className="w-full flex flex-col items-center section-enter" style={{ overflow: 'visible' }}>
      <div className="w-full relative z-10 px-4 transition-all duration-500" style={{ overflow: 'visible' }}>
        {section === "practice" && !hideCards && (
          <PracticeSection 
            onPracticingChange={onPracticingChange} 
            onBreathStateChange={onBreathStateChange}
            avatarPath={previewPath} 
            showCore={previewShowCore}
            showFxGallery={showFxGallery} 
            isActiveBreathSession={isActiveBreathSession}
            onNavigate={onNavigate} 
            onOpenPhotic={onOpenPhotic}
          />
        )}

        {section === "wisdom" && !hideCards && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="type-label normal-case text-white/50">Loading Wisdom...</div>
            </div>
          }>
            <WisdomSection />
          </Suspense>
        )}

        {section === "application" && !hideCards && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="type-label normal-case text-white/50">Loading Application...</div>
            </div>
          }>
            <ApplicationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} previewAttention={previewAttention} onNavigate={onNavigate} />
          </Suspense>
        )}

        {section === "navigation" && !hideCards && <NavigationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} previewAttention={previewAttention} onNavigate={onNavigate} onOpenHardwareGuide={onOpenHardwareGuide} isPracticing={isPracticing} />}
      </div>
    </div>
  );
}


function App({ playgroundMode = false, playgroundBottomLayer = true }) {
  // Display mode (sanctuary/hearth) and color scheme (dark/light)
  const displayMode = useDisplayModeStore((s) => s.mode);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const overrideStage = useDevOverrideStore((s) => s.stage);
  const overridePath = useDevOverrideStore((s) => s.avatarPath);
  const setOverrideStage = useDevOverrideStore((s) => s.setStage);
  const setOverridePath = useDevOverrideStore((s) => s.setAvatarPath);
  const userMode = useUserModeStore((s) => s.userMode);
  const hasChosenUserMode = useUserModeStore((s) => s.hasChosenUserMode);
  const setUserMode = useUserModeStore((s) => s.setUserMode);
  const practiceLaunchContext = useUiStore((s) => s.practiceLaunchContext);
  const onboardingComplete = useCurriculumStore((s) => s.onboardingComplete);
  const practiceTimeSlots = useCurriculumStore((s) => s.practiceTimeSlots);
  const needsSetup = !onboardingComplete && (!practiceTimeSlots || practiceTimeSlots.length === 0);
  const isLight = colorScheme === 'light';

  const outerBackground = isLight
    ? 'linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)'
    : '#000';

  // Disable browser scroll restoration (fixes Edge loading Home scrolled down)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;
    root.classList.toggle('hearth-viewport', displayMode === 'hearth');
    return () => root.classList.remove('hearth-viewport');
  }, [displayMode]);

  // Curriculum completion report (manually triggered only, never auto-shown)
  const [showCurriculumReport, setShowCurriculumReport] = useState(false);

  // Load default view preference (defaulting to hub)
  const getDefaultView = () => {
    try {
      const stored = localStorage.getItem('immanenceOS.defaultView');
      return stored || 'hub'; // 'hub' or 'navigation'
    } catch {
      return 'hub';
    }
  };

  const [defaultView] = useState(getDefaultView());
  const [activeSection, setActiveSection] = useState(() => {
    if (playgroundMode) return null;
    // If default view is 'navigation', start there
    return defaultView === 'navigation' ? 'navigation' : null;
  });
  const [isPracticing, setIsPracticing] = useState(false);
  const [breathState, setBreathState] = useState({ phase: 'rest', progress: 0, isPracticing: false });
  const [avatarStage, setAvatarStage] = useState("Seedling"); // Track avatar stage name for theme
  const showFxGallery = true; // FX Gallery dev mode
  const [showDevPanel, setShowDevPanel] = useState(false); // Dev Panel (🎨 button)
  const [devtoolsGateTick, setDevtoolsGateTick] = useState(0);
  const [showSettings, setShowSettings] = useState(false); // Settings panel
  const [hideCards, setHideCards] = useState(false); // Dev mode: hide cards to view wallpaper
  // GRAVEYARD: Top layer removed
  // const [showBackgroundTopLayer, setShowBackgroundTopLayer] = useState(true);
  const [showBackgroundBottomLayer, setShowBackgroundBottomLayer] = useState(true); // Dev: toggle bottom wallpaper layer
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);
  const [isPhoticOpen, setIsPhoticOpen] = useState(false);
  const [isMinimized] = useState(false);
  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
  const isDev = import.meta.env.DEV;
  const devtoolsEnabled = isDevtoolsEnabled();
  const selectionEnabled = !DISABLE_SELECTION;
  const devtoolsTapRef = useRef({ count: 0, firstTs: 0 });
  const probeAppMarkerRef = useRef("app:init");
  const stressRunnerActiveRef = useRef(false);
  const stressRunnerAbortRef = useRef(false);
  const probeUiStateRef = useRef({
    route: "/",
    displayMode: "unknown",
    activeSection: "home",
    isDevPanelOpen: false,
  });

  useEffect(() => {
    const route = (typeof window !== "undefined" && window.location?.pathname) ? window.location.pathname : "/";
    probeUiStateRef.current = {
      route,
      displayMode,
      activeSection: activeSection ?? "home",
      isDevPanelOpen: showDevPanel,
    };
    probeAppMarkerRef.current = `section:${activeSection ?? "home"}|devpanel:${showDevPanel ? "open" : "closed"}`;
  }, [displayMode, activeSection, showDevPanel]);

  useEffect(() => {
    probeAppMarkerRef.current = isPracticing ? "practice:running" : "practice:idle";
  }, [isPracticing]);

  useEffect(() => {
    if (!selectionEnabled || !devtoolsEnabled) {
      if (showDevPanel) setShowDevPanel(false);
    }
  }, [selectionEnabled, devtoolsEnabled, showDevPanel, devtoolsGateTick]);

  useEffect(() => {
    if (!selectionEnabled || !devtoolsEnabled) return undefined;
    const onKeyDown = (event) => {
      const key = String(event.key || '').toLowerCase();
      if (event.ctrlKey && event.shiftKey && key === 'd') {
        event.preventDefault();
        setShowDevPanel((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectionEnabled, devtoolsEnabled, devtoolsGateTick]);

  useEffect(() => {
    if (!isDev || typeof window === "undefined" || typeof document === "undefined") return undefined;

    stressRunnerAbortRef.current = false;

    const sleep = (ms) => new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
    const isAborted = () => stressRunnerAbortRef.current === true;

    const runDevPanelToggleStep = async () => {
      for (let i = 0; i < 10; i += 1) {
        if (isAborted()) return;
        setShowDevPanel((prev) => !prev);
        console.log(`[StressRunner] devpanel toggle ${i + 1}/10`);
        await sleep(500);
      }
    };

    const runRingPresetSwitchStep = async () => {
      const hasPresetSwitchHook = (
        typeof window.dispatchEvent === "function"
        && typeof KeyboardEvent !== "undefined"
        && Boolean(document.querySelector("canvas"))
      );
      if (!hasPresetSwitchHook) {
        console.log("[StressRunner] no preset switch hook");
        return;
      }
      for (let i = 0; i < 10; i += 1) {
        if (isAborted()) return;
        window.dispatchEvent(new KeyboardEvent("keydown", {
          key: "F2",
          bubbles: true,
          cancelable: true,
        }));
        console.log(`[StressRunner] ring preset switch ${i + 1}/10`);
        await sleep(400);
      }
    };

    const runResizeThrashStep = async () => {
      const canDispatchResize = typeof window.dispatchEvent === "function" && typeof Event !== "undefined";
      if (canDispatchResize) {
        for (let i = 0; i < 20; i += 1) {
          if (isAborted()) return;
          window.dispatchEvent(new Event("resize"));
          await sleep(150);
        }
        return;
      }

      const appFrame = document.querySelector("[data-app-frame]");
      if (!(appFrame instanceof HTMLElement)) {
        console.log("[StressRunner] no resize handler");
        return;
      }

      for (let i = 0; i < 20; i += 1) {
        if (isAborted()) return;
        appFrame.classList.toggle("stress-resize-small");
        appFrame.classList.toggle("stress-resize-large");
        await sleep(150);
      }
      appFrame.classList.remove("stress-resize-small");
      appFrame.classList.remove("stress-resize-large");
    };

    const runStressRunner = async () => {
      if (stressRunnerActiveRef.current) {
        console.info("[StressRunner] already running");
        return;
      }
      if (typeof window.__PROBE6_RESET_FIRST_LOSS__ === "function") {
        try {
          window.__PROBE6_RESET_FIRST_LOSS__();
        } catch {
          // ignore reset failures
        }
      }
      stressRunnerActiveRef.current = true;
      const scheduledDumpIds = [];
      const scheduleDump = (ms, label) => {
        const id = window.setTimeout(() => {
          if (isAborted()) return;
          console.info(`[StressRunner] timed dump ${label}`);
          dumpProbeState();
        }, ms);
        scheduledDumpIds.push(id);
      };
      dumpProbeState();
      scheduleDump(2000, "2s");
      scheduleDump(4000, "4s");
      scheduleDump(8000, "8s");
      scheduleDump(16000, "16s");
      console.info("[StressRunner] start");
      try {
        await runDevPanelToggleStep();
        await runRingPresetSwitchStep();
        await runResizeThrashStep();
        if (!isAborted()) {
          console.info("[StressRunner] completed");
          dumpProbeState();
        }
      } catch (error) {
        console.error("[StressRunner] failed", error);
      } finally {
        scheduledDumpIds.forEach((id) => window.clearTimeout(id));
        stressRunnerActiveRef.current = false;
      }
    };

    const dumpProbeState = () => {
      console.log("[Probe6] DUMP __PROBE3_DIAGNOSTICS__", window.__PROBE3_DIAGNOSTICS__ || null);
      let firstLoss = window.__FIRST_WEBGL_LOSS__;
      if (!firstLoss) {
        try {
          const raw = window.sessionStorage?.getItem("__PROBE6_FIRST_WEBGL_LOSS__");
          if (raw) firstLoss = JSON.parse(raw);
        } catch {
          // ignore storage parse issues
        }
      }
      console.log("[Probe6] DUMP __FIRST_WEBGL_LOSS__", firstLoss || "none");
    };
    window.__PROBE6_DUMP__ = dumpProbeState;
    window.__PROBE6_RUN_STRESS__ = runStressRunner;
    console.info("[Probe6] dump ready: window.__PROBE6_DUMP__()");

    const onKeyDown = (event) => {
      if (!event.ctrlKey) return;
      const key = String(event.key || "").toLowerCase();
      const code = String(event.code || "");
      const isStressShortcut = (
        event.shiftKey
        && (
        code === "Digit9"
        || code === "Numpad9"
        || key === "9"
        || key === "("
        )
      );
      const isDumpShortcut = (
        code === "Digit0"
        || code === "Numpad0"
        || key === "0"
        || key === ")"
        || (event.shiftKey && (key === "x" || code === "KeyX"))
        || (event.altKey && (key === "0" || key === ")" || code === "Digit0" || code === "Numpad0"))
      );

      if (isStressShortcut) {
        event.preventDefault();
        runStressRunner();
        return;
      }
      if (isDumpShortcut) {
        event.preventDefault();
        dumpProbeState();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (stressRunnerActiveRef.current) {
        console.warn("[StressRunner] aborted reason=app_cleanup");
        dumpProbeState();
      }
      stressRunnerAbortRef.current = true;
      window.removeEventListener("keydown", onKeyDown);
      delete window.__PROBE6_DUMP__;
      delete window.__PROBE6_RUN_STRESS__;
    };
  }, [isDev]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    console.log(`[Probe3] postprocess ${DISABLE_POSTPROCESS ? "disabled" : "enabled"}`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    const inventoryEnabled = Boolean(isDev && ENABLE_CANVAS_INVENTORY_LOGGER);
    const forensicsEnabled = Boolean(isDev);
    if (forensicsEnabled) {
      if (typeof window.__FIRST_WEBGL_LOSS__ === "undefined" || window.__FIRST_WEBGL_LOSS__ == null) {
        try {
          const raw = window.sessionStorage?.getItem("__PROBE6_FIRST_WEBGL_LOSS__");
          window.__FIRST_WEBGL_LOSS__ = raw ? JSON.parse(raw) : null;
        } catch {
          window.__FIRST_WEBGL_LOSS__ = null;
        }
      }
    }
    let mountCount = 0;
    let unmountCount = 0;
    let contextLossCount = 0;
    let contextRestoreCount = 0;
    let inventoryIntervalId = null;
    let probe6SamplerIntervalId = null;
    let lastMultiCanvasSignature = null;
    let lastInventoryCount = null;
    let lastInventoryLogAt = 0;
    let firstLossSaved = false;
    const knownCanvases = new Set();
    const contextListeners = new Map();
    const typeCache = new WeakMap();
    const ownerCache = new WeakMap();
    const resizeObserverCache = new WeakMap();
    const resizeSizeCache = new WeakMap();
    const removalCleanupTimers = new Map();
    const observedCanvases = new Set();
    const probe6PatchedGl = new WeakSet();
    const probe6OriginalFns = new WeakMap();
    const probe6RegistrationByCanvas = new Map();
    const probe6ByGl = new WeakMap();
    const PROBE6_METHODS = [
      "readPixels",
      "bindFramebuffer",
      "framebufferTexture2D",
      "framebufferRenderbuffer",
      "checkFramebufferStatus",
      "useProgram",
      "bindTexture",
      "texImage2D",
      "texSubImage2D",
      "bindBuffer",
      "bufferData",
      "drawArrays",
      "drawElements",
    ];

    const syncGlobalCounts = () => {
      window.__PROBE2_CANVAS_COUNTS__ = { mountCount, unmountCount };
      window.__PROBE3_DIAGNOSTICS__ = {
        postprocessDisabled: DISABLE_POSTPROCESS,
        uiControlsCaptureDisabled: DISABLE_UI_CONTROLS_CAPTURE,
        contextLossCount,
        contextRestoreCount,
        mountCount,
        unmountCount,
      };
    };

    const getFirstClass = (el) => {
      if (!(el instanceof Element)) return "-";
      if (typeof el.className === "string" && el.className.trim()) {
        const first = el.className.trim().split(/\s+/)[0];
        return first || "-";
      }
      return "-";
    };

    const describeNode = (el) => {
      if (!(el instanceof Element)) return "-";
      const tag = String(el.tagName || "UNKNOWN").toUpperCase();
      const idPart = el.id ? `#${el.id}` : "";
      const firstClass = getFirstClass(el);
      const classPart = firstClass !== "-" ? `.${firstClass}` : "";
      return `${tag}${idPart}${classPart}`;
    };

    const buildOwnerHint = (canvasEl) => {
      if (!(canvasEl instanceof Element)) return "-";
      const nodes = [];
      let node = canvasEl;
      for (let i = 0; i < 3 && node instanceof Element; i += 1) {
        nodes.push(node);
        node = node.parentElement;
      }
      const hint = nodes.reverse().map(describeNode).join(" > ") || "-";
      ownerCache.set(canvasEl, hint);
      return hint;
    };

    const getCachedCanvasType = (canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return "unknown";
      const datasetType = canvasEl.dataset?.probeType;
      if (datasetType && datasetType.trim()) {
        const normalized = datasetType.trim();
        typeCache.set(canvasEl, normalized);
        canvasEl.__probeType = normalized;
        return normalized;
      }

      const directCachedType = canvasEl.__probeType;
      if (typeof directCachedType === "string" && directCachedType.trim()) {
        const normalized = directCachedType.trim();
        typeCache.set(canvasEl, normalized);
        try {
          canvasEl.dataset.probeType = normalized;
        } catch {
          // Ignore dataset write failures.
        }
        return normalized;
      }
      const weakMapType = typeCache.get(canvasEl);
      if (weakMapType) return weakMapType;
      return null;
    };

    const formatGlError = (code) => {
      if (!code) return "0x0:NO_ERROR";
      const codeNum = Number(code) || 0;
      const hex = `0x${codeNum.toString(16)}`;
      const knownNames = {
        1280: "INVALID_ENUM",
        1281: "INVALID_VALUE",
        1282: "INVALID_OPERATION",
        1285: "OUT_OF_MEMORY",
        1286: "INVALID_FRAMEBUFFER_OPERATION",
        37442: "CONTEXT_LOST_WEBGL",
      };
      return `${hex}:${knownNames[codeNum] || "UNKNOWN"}`;
    };

    const getCanvasType = (canvasEl, { allowDetect = true } = {}) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return "unknown";

      const cachedType = getCachedCanvasType(canvasEl);
      if (cachedType) return cachedType;
      if (!allowDetect || !canvasEl.isConnected) {
        typeCache.set(canvasEl, "unknown");
        canvasEl.__probeType = "unknown";
        return "unknown";
      }

      // Last resort detection: single-shot per canvas, cached immediately.
      let detectedType = "unknown";
      try {
        const webgl2Ctx = canvasEl.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
        if (webgl2Ctx) {
          detectedType = (typeof webgl2Ctx.isContextLost === "function" && webgl2Ctx.isContextLost())
            ? "unknown"
            : "webgl2";
        } else {
          const webglCtx = canvasEl.getContext("webgl");
          if (webglCtx) {
            detectedType = (typeof webglCtx.isContextLost === "function" && webglCtx.isContextLost())
              ? "unknown"
              : "webgl";
          } else {
            const twoDCtx = canvasEl.getContext("2d");
            detectedType = twoDCtx ? "2d" : "unknown";
          }
        }
      } catch {
        detectedType = "unknown";
      }

      typeCache.set(canvasEl, detectedType);
      canvasEl.__probeType = detectedType;
      try {
        canvasEl.dataset.probeType = detectedType;
      } catch {
        // Ignore dataset write failures.
      }
      return detectedType;
    };

    const getCanvasIndex = (canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return null;
      const list = Array.from(document.querySelectorAll("canvas"));
      const idx = list.indexOf(canvasEl);
      return idx >= 0 ? idx + 1 : null;
    };

    const describeCanvasMeta = (canvasEl, index = null, options = {}) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return "i=- id=- class=- size=0x0 type=unknown owner=-";
      const { allowDetect = true, typeOverride = null, ownerOverride = null } = options;
      const idx = index == null ? "-" : String(index);
      const id = canvasEl.id || "-";
      const firstClass = getFirstClass(canvasEl);
      const size = `${canvasEl.width || 0}x${canvasEl.height || 0}`;
      const type = typeOverride || getCanvasType(canvasEl, { allowDetect });
      const owner = ownerOverride || ownerCache.get(canvasEl) || (canvasEl.isConnected ? buildOwnerHint(canvasEl) : "-");
      return `i=${idx} id=${id} class=${firstClass} size=${size} type=${type} owner=${owner}`;
    };

    const getGlErrorName = (code) => {
      const codeNum = Number(code) || 0;
      const knownNames = {
        1280: "INVALID_ENUM",
        1281: "INVALID_VALUE",
        1282: "INVALID_OPERATION",
        1285: "OUT_OF_MEMORY",
        1286: "INVALID_FRAMEBUFFER_OPERATION",
        37442: "CONTEXT_LOST_WEBGL",
      };
      return knownNames[codeNum] || "UNKNOWN";
    };

    const summarizeProbe6Arg = (arg) => {
      if (arg == null) return String(arg);
      if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
      if (typeof arg === "string") return arg.length > 24 ? `${arg.slice(0, 24)}…` : arg;
      if (ArrayBuffer.isView(arg)) return `${arg.constructor?.name || "TypedArray"}(${arg.length ?? 0})`;
      if (arg instanceof ArrayBuffer) return `ArrayBuffer(${arg.byteLength})`;
      if (typeof arg === "object") {
        if ("width" in arg && "height" in arg) {
          return `${arg.constructor?.name || "Object"}(${arg.width}x${arg.height})`;
        }
        if ("id" in arg && typeof arg.id !== "undefined") return `${arg.constructor?.name || "Object"}#${String(arg.id)}`;
        return arg.constructor?.name || "Object";
      }
      return typeof arg;
    };

    const summarizeProbe6Args = (args = []) => {
      return args
        .slice(0, 4)
        .map((arg) => summarizeProbe6Arg(arg))
        .join(", ");
    };

    const getRendererSnapshot = (gl) => {
      const renderInfo = gl?.info?.render || {};
      const memoryInfo = gl?.info?.memory || {};
      const programsRaw = gl?.info?.programs;
      const programs = Array.isArray(programsRaw)
        ? programsRaw.length
        : (typeof programsRaw?.length === "number" ? programsRaw.length : null);
      return {
        calls: Number.isFinite(renderInfo.calls) ? renderInfo.calls : null,
        textures: Number.isFinite(memoryInfo.textures) ? memoryInfo.textures : null,
        programs,
      };
    };

    const saveFirstLoss = (payload, source) => {
      if (!forensicsEnabled || firstLossSaved) return;
      if (window.__FIRST_WEBGL_LOSS__) {
        firstLossSaved = true;
        return;
      }
      const snapshot = {
        ts: new Date().toISOString(),
        source: source || "unknown",
        payload,
        lastOp: payload?.lastOp || "-",
        lastArgsSummary: payload?.lastArgsSummary || "-",
        rendererSnapshot: payload?.renderer || null,
      };
      window.__FIRST_WEBGL_LOSS__ = snapshot;
      try {
        window.sessionStorage?.setItem("__PROBE6_FIRST_WEBGL_LOSS__", JSON.stringify(snapshot));
      } catch {
        // ignore storage write failures
      }
      firstLossSaved = true;
      console.warn("[Probe6] FIRST_LOSS_SAVED window.__FIRST_WEBGL_LOSS__");
      console.log("[Probe6] DUMP __PROBE3_DIAGNOSTICS__", window.__PROBE3_DIAGNOSTICS__ || null);
      console.log("[Probe6] DUMP __FIRST_WEBGL_LOSS__", snapshot);
    };
    const resetFirstLoss = () => {
      firstLossSaved = false;
      window.__FIRST_WEBGL_LOSS__ = null;
      try {
        window.sessionStorage?.removeItem("__PROBE6_FIRST_WEBGL_LOSS__");
      } catch {
        // ignore storage clear failures
      }
      console.info("[Probe6] first-loss reset");
    };
    window.__PROBE6_RESET_FIRST_LOSS__ = resetFirstLoss;

    const getProbe6State = (context) => {
      if (!context) return null;
      let state = probe6ByGl.get(context);
      if (state) return state;
      state = {
        lastError: 0,
        lastErrorAtMs: 0,
        lastOp: "-",
        lastArgsSummary: "-",
        lastOpAtMs: 0,
        lastContextLost: false,
      };
      probe6ByGl.set(context, state);
      return state;
    };

    const patchProbe6RendererForceLoss = () => {
      // Disabled: do not wrap or trigger renderer.forceContextLoss during churn probe/fix runs.
    };

    const unpatchProbe6RendererForceLoss = () => {};

    const patchProbe6Context = (context) => {
      if (!context || probe6PatchedGl.has(context)) return;
      const originals = new Map();

      PROBE6_METHODS.forEach((methodName) => {
        const original = context[methodName];
        if (typeof original !== "function") return;
        const bound = original.bind(context);
        try {
          context[methodName] = (...args) => {
            const state = getProbe6State(context);
            if (state) {
              state.lastOp = methodName;
              state.lastArgsSummary = summarizeProbe6Args(args);
              state.lastOpAtMs = performance.now();
            }
            return bound(...args);
          };
          originals.set(methodName, bound);
        } catch {
          // Ignore patch failures for non-writable methods.
        }
      });

      if (originals.size === 0) {
        return;
      }

      probe6OriginalFns.set(context, originals);
      probe6PatchedGl.add(context);
      getProbe6State(context);
    };

    const unpatchProbe6Context = (context) => {
      if (!context) return;
      const originals = probe6OriginalFns.get(context);
      if (originals) {
        originals.forEach((fn, methodName) => {
          try {
            context[methodName] = fn;
          } catch {
            // ignore restore failures.
          }
        });
      }
      probe6OriginalFns.delete(context);
      probe6PatchedGl.delete(context);
      probe6ByGl.delete(context);
    };

    const registerProbe6Gl = (registration = {}) => {
      const renderer = registration?.gl;
      if (!renderer || typeof renderer.getContext !== "function") return;
      const canvas = registration?.canvas ?? renderer.domElement;
      if (!(canvas instanceof HTMLCanvasElement)) return;

      const context = renderer.getContext();
      if (!context) return;
      const typeHint = (typeof WebGL2RenderingContext !== "undefined" && context instanceof WebGL2RenderingContext)
        ? "webgl2"
        : "webgl";

      typeCache.set(canvas, typeHint);
      canvas.__probeType = typeHint;
      try {
        canvas.dataset.probeType = typeHint;
      } catch {
        // Ignore dataset write failures.
      }

      patchProbe6Context(context);
      patchProbe6RendererForceLoss(renderer, canvas, context);
      probe6RegistrationByCanvas.set(canvas, {
        renderer,
        context,
        source: registration?.source || "r3f",
      });
    };

    const logContextForensics = (eventName, canvasEl, canvasType) => {
      if (!forensicsEnabled) return;
      const uiState = probeUiStateRef.current || {};
      const registration = probe6RegistrationByCanvas.get(canvasEl);
      const probe6State = registration?.context ? getProbe6State(registration.context) : null;
      const lastErr = probe6State?.lastError ?? 0;
      const lastErrAt = probe6State?.lastErrorAtMs ? new Date(probe6State.lastErrorAtMs).toISOString() : "-";
      const rect = canvasEl?.getBoundingClientRect?.();
      const rendererSnapshot = registration?.renderer ? getRendererSnapshot(registration.renderer) : null;
      const meta = describeCanvasMeta(canvasEl, getCanvasIndex(canvasEl), { allowDetect: false, typeOverride: canvasType });
      const timestamp = new Date().toISOString();
      const dpr = Number(window.devicePixelRatio || 1).toFixed(2);
      const payload = {
        event: eventName,
        timestamp,
        route: uiState.route || "/",
        view: uiState.displayMode || "unknown",
        section: uiState.activeSection || "home",
        devPanelOpen: Boolean(uiState.isDevPanelOpen),
        appMarker: probeAppMarkerRef.current || "-",
        dpr,
        canvasCss: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)}` : "-",
        canvasBacking: `${canvasEl.width || 0}x${canvasEl.height || 0}`,
        lastGlError: formatGlError(lastErr),
        lastGlErrorAt: lastErrAt,
        lastOp: probe6State?.lastOp || "-",
        lastArgsSummary: probe6State?.lastArgsSummary || "-",
        renderer: rendererSnapshot,
        isContextLost: registration?.context && typeof registration.context.isContextLost === "function"
          ? registration.context.isContextLost()
          : null,
        canvasMeta: meta,
      };
      if (eventName === "webglcontextlost") {
        saveFirstLoss(payload, "webglcontextlost");
      }
      console.warn("[Probe6] CONTEXT_EVENT", payload);
    };

    const detachResizeObserver = (canvasEl) => {
      const observer = resizeObserverCache.get(canvasEl);
      if (!observer) return;
      observer.disconnect();
      observedCanvases.delete(canvasEl);
      resizeSizeCache.delete(canvasEl);
    };

    const attachResizeObserver = (canvasEl) => {
      if (!inventoryEnabled) return;
      if (!(canvasEl instanceof HTMLCanvasElement)) return;
      if (resizeObserverCache.has(canvasEl)) return;
      if (typeof ResizeObserver !== "function") return;

      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (!(target instanceof HTMLCanvasElement)) return;
          const nextSize = `${target.width || 0}x${target.height || 0}`;
          const prevSize = resizeSizeCache.get(target);
          if (prevSize === nextSize) return;
          resizeSizeCache.set(target, nextSize);
          const index = getCanvasIndex(target);
          const meta = describeCanvasMeta(target, index, { allowDetect: false });
          console.log(`[Probe4] CANVAS RESIZE ${meta}`);
        });
      });

      observer.observe(canvasEl);
      resizeObserverCache.set(canvasEl, observer);
      observedCanvases.add(canvasEl);
      resizeSizeCache.set(canvasEl, `${canvasEl.width || 0}x${canvasEl.height || 0}`);
    };

    const warnMultipleCanvases = (canvasList, source) => {
      if (!inventoryEnabled) return;
      if (!Array.isArray(canvasList) || canvasList.length <= 1) {
        lastMultiCanvasSignature = null;
        return;
      }

      const signatureParts = canvasList
        .map((canvasEl) => {
          const owner = ownerCache.get(canvasEl) || buildOwnerHint(canvasEl);
          const type = getCanvasType(canvasEl);
          return `${owner}|${canvasEl.width || 0}x${canvasEl.height || 0}|${type}`;
        })
        .sort();
      const signature = `N=${canvasList.length}|${signatureParts.join("||")}`;

      if (signature === lastMultiCanvasSignature) return;
      lastMultiCanvasSignature = signature;
      console.warn(`[Probe4] WARNING: MULTIPLE CANVASES DETECTED (N=${canvasList.length}) source=${source}`);
    };

    const logInventoryBlock = (source, { force = false } = {}) => {
      if (!inventoryEnabled) return;
      const canvasList = Array.from(document.querySelectorAll("canvas"));
      const now = Date.now();
      const shouldLog = force || canvasList.length !== lastInventoryCount || (now - lastInventoryLogAt >= 5000);
      warnMultipleCanvases(canvasList, source);
      if (!shouldLog) return;

      lastInventoryCount = canvasList.length;
      lastInventoryLogAt = now;
      const lines = [`[Probe4][Inventory] total canvases: ${canvasList.length} source=${source}`];
      canvasList.forEach((canvasEl, i) => {
        lines.push(`  ${describeCanvasMeta(canvasEl, i + 1, { allowDetect: true })}`);
      });
      console.log(lines.join("\n"));
    };

    const detachContextListeners = (canvasEl) => {
      const listeners = contextListeners.get(canvasEl);
      if (!listeners) return;
      canvasEl.removeEventListener("webglcontextlost", listeners.onLost);
      canvasEl.removeEventListener("webglcontextrestored", listeners.onRestored);
      contextListeners.delete(canvasEl);
    };

    const attachContextListeners = (canvasEl) => {
      if (contextListeners.has(canvasEl)) return;

      const onLost = (event) => {
        event.preventDefault();
        contextLossCount += 1;
        console.warn(`[Probe3] webglcontextlost #${contextLossCount}`);
        const canvasType = getCanvasType(canvasEl, { allowDetect: false });
        if (canvasType === "webgl2" || canvasType === "webgl") {
          logContextForensics("webglcontextlost", canvasEl, canvasType);
        }
        syncGlobalCounts();
      };
      const onRestored = () => {
        contextRestoreCount += 1;
        console.info(`[Probe3] webglcontextrestored #${contextRestoreCount}`);
        const canvasType = getCanvasType(canvasEl, { allowDetect: false });
        if (canvasType === "webgl2" || canvasType === "webgl") {
          logContextForensics("webglcontextrestored", canvasEl, canvasType);
        }
        syncGlobalCounts();
      };

      canvasEl.addEventListener("webglcontextlost", onLost, false);
      canvasEl.addEventListener("webglcontextrestored", onRestored, false);
      contextListeners.set(canvasEl, { onLost, onRestored });
    };

    const onCanvasAdded = (canvasEl, reason) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return;
      if (knownCanvases.has(canvasEl)) return;
      const pendingCleanupId = removalCleanupTimers.get(canvasEl);
      if (pendingCleanupId != null) {
        window.clearTimeout(pendingCleanupId);
        removalCleanupTimers.delete(canvasEl);
      }

      knownCanvases.add(canvasEl);
      buildOwnerHint(canvasEl);
      getCanvasType(canvasEl, { allowDetect: true });
      attachContextListeners(canvasEl);
      attachResizeObserver(canvasEl);
      mountCount += 1;
      console.log(`Canvas mount #${mountCount}`);
      if (inventoryEnabled) {
        const index = getCanvasIndex(canvasEl);
        console.log(`[Probe4] CANVAS ADD ${describeCanvasMeta(canvasEl, index, { allowDetect: false })} reason=${reason}`);
      }
      syncGlobalCounts();
    };

    const onCanvasRemoved = (canvasEl, reason) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return;
      if (!knownCanvases.has(canvasEl) && !inventoryEnabled) return;

      const owner = ownerCache.get(canvasEl) || (canvasEl.isConnected ? buildOwnerHint(canvasEl) : "-");
      const type = getCachedCanvasType(canvasEl) || "unknown";
      probe6RegistrationByCanvas.delete(canvasEl);
      const wasKnown = knownCanvases.delete(canvasEl);

      if (wasKnown) {
        unmountCount += 1;
        console.log(`Canvas unmount #${unmountCount}`);
      }
      if (inventoryEnabled) {
        console.log(`[Probe4] CANVAS REMOVE ${describeCanvasMeta(canvasEl, null, { allowDetect: false, ownerOverride: owner, typeOverride: type })} reason=${reason}`);
      }
      syncGlobalCounts();

      const priorTimer = removalCleanupTimers.get(canvasEl);
      if (priorTimer != null) {
        window.clearTimeout(priorTimer);
      }
      const cleanupTimerId = window.setTimeout(() => {
        const removedRegistration = probe6RegistrationByCanvas.get(canvasEl);
        if (removedRegistration?.context) {
          let lostOnRemove = false;
          try {
            lostOnRemove = typeof removedRegistration.context.isContextLost === "function"
              ? removedRegistration.context.isContextLost()
              : false;
          } catch {
            lostOnRemove = false;
          }
          if (lostOnRemove) {
            const uiState = probeUiStateRef.current || {};
            const payload = {
              timestamp: new Date().toISOString(),
              route: uiState.route || "/",
              view: uiState.displayMode || "unknown",
              section: uiState.activeSection || "home",
              devPanelOpen: Boolean(uiState.isDevPanelOpen),
              appMarker: probeAppMarkerRef.current || "-",
              dpr: Number(window.devicePixelRatio || 1).toFixed(2),
              canvasBacking: `${canvasEl.width || 0}x${canvasEl.height || 0}`,
              renderer: removedRegistration?.renderer ? getRendererSnapshot(removedRegistration.renderer) : null,
              isContextLost: true,
              canvasMeta: describeCanvasMeta(canvasEl, null, {
                allowDetect: false,
                ownerOverride: owner,
                typeOverride: type,
              }),
            };
            saveFirstLoss(payload, "canvas_remove_context_lost");
            console.warn("[Probe6] CONTEXT_LOST_ON_REMOVE", payload);
          }
          unpatchProbe6Context(removedRegistration.context);
        }
        if (removedRegistration?.renderer) {
          unpatchProbe6RendererForceLoss(removedRegistration.renderer);
        }
        probe6RegistrationByCanvas.delete(canvasEl);
        detachResizeObserver(canvasEl);
        detachContextListeners(canvasEl);
        removalCleanupTimers.delete(canvasEl);
      }, 3000);
      removalCleanupTimers.set(canvasEl, cleanupTimerId);
    };

    const collectCanvasesFromNode = (node, bucket) => {
      if (!node || !bucket) return;
      if (node instanceof HTMLCanvasElement) {
        bucket.add(node);
      }
      if (node instanceof Element || node instanceof DocumentFragment) {
        if (typeof node.querySelectorAll === "function") {
          node.querySelectorAll("canvas").forEach((canvasEl) => {
            if (canvasEl instanceof HTMLCanvasElement) bucket.add(canvasEl);
          });
        }
      }
    };

    const previousProbe6Register = window.__PROBE6_REGISTER_GL__;
    window.__PROBE6_REGISTER_GL__ = (registration) => {
      try {
        registerProbe6Gl(registration);
      } catch {
        // ignore probe registration failures.
      }
      if (
        typeof previousProbe6Register === "function"
        && previousProbe6Register !== window.__PROBE6_REGISTER_GL__
      ) {
        try {
          previousProbe6Register(registration);
        } catch {
          // ignore chained callback failures.
        }
      }
    };

    // Prime with canvases already present on first mount.
    Array.from(document.querySelectorAll("canvas")).forEach((canvasEl) => {
      onCanvasAdded(canvasEl, "initial");
    });
    syncGlobalCounts();

    const observer = new MutationObserver((mutations) => {
      const addedCanvases = new Set();
      const removedCanvases = new Set();

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => collectCanvasesFromNode(node, addedCanvases));
        mutation.removedNodes.forEach((node) => collectCanvasesFromNode(node, removedCanvases));
      });

      if (addedCanvases.size === 0 && removedCanvases.size === 0) return;

      addedCanvases.forEach((canvasEl) => onCanvasAdded(canvasEl, "mutation:add"));
      removedCanvases.forEach((canvasEl) => {
        if (canvasEl.isConnected) return;
        onCanvasRemoved(canvasEl, "mutation:remove");
      });

      logInventoryBlock("mutation");
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const onGlobalContextLostCapture = (event) => {
      const canvasEl = event?.target;
      if (!(canvasEl instanceof HTMLCanvasElement)) return;
      const uiState = probeUiStateRef.current || {};
      const registration = probe6RegistrationByCanvas.get(canvasEl);
      const context = registration?.context;
      const state = context ? getProbe6State(context) : null;
      const rect = canvasEl.getBoundingClientRect?.();
      const canvasType = getCachedCanvasType(canvasEl) || getCanvasType(canvasEl, { allowDetect: false });
      const payload = {
        timestamp: new Date().toISOString(),
        route: uiState.route || "/",
        view: uiState.displayMode || "unknown",
        section: uiState.activeSection || "home",
        devPanelOpen: Boolean(uiState.isDevPanelOpen),
        appMarker: probeAppMarkerRef.current || "-",
        lastOp: state?.lastOp || "-",
        lastArgsSummary: state?.lastArgsSummary || "-",
        dpr: Number(window.devicePixelRatio || 1).toFixed(2),
        canvasCss: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)}` : "-",
        canvasBacking: `${canvasEl.width || 0}x${canvasEl.height || 0}`,
        renderer: registration?.renderer ? getRendererSnapshot(registration.renderer) : null,
        isContextLost: context && typeof context.isContextLost === "function" ? context.isContextLost() : null,
        canvasMeta: describeCanvasMeta(canvasEl, getCanvasIndex(canvasEl), {
          allowDetect: false,
          typeOverride: canvasType,
        }),
      };
      saveFirstLoss(payload, "global_capture_webglcontextlost");
      console.warn("[Probe6] GLOBAL_CONTEXT_EVENT", payload);
      try {
        event.preventDefault?.();
      } catch {
        // ignore
      }
    };
    const onGlobalContextRestoredCapture = (event) => {
      const canvasEl = event?.target;
      if (!(canvasEl instanceof HTMLCanvasElement)) return;
      const uiState = probeUiStateRef.current || {};
      console.info("[Probe6] GLOBAL_CONTEXT_RESTORED", {
        timestamp: new Date().toISOString(),
        route: uiState.route || "/",
        view: uiState.displayMode || "unknown",
        section: uiState.activeSection || "home",
        canvasMeta: describeCanvasMeta(canvasEl, getCanvasIndex(canvasEl), { allowDetect: false }),
      });
    };
    document.addEventListener("webglcontextlost", onGlobalContextLostCapture, true);
    document.addEventListener("webglcontextrestored", onGlobalContextRestoredCapture, true);
    if (inventoryEnabled) {
      console.info("[Probe4] observer attached subtree=documentElement");
      logInventoryBlock("load", { force: true });
      inventoryIntervalId = window.setInterval(() => {
        logInventoryBlock("interval");
      }, 500);
    }
    if (forensicsEnabled) {
      probe6SamplerIntervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible") return;

        Array.from(knownCanvases).forEach((canvasEl) => {
          const registration = probe6RegistrationByCanvas.get(canvasEl);
          const context = registration?.context;
          if (!context) return;
          const state = getProbe6State(context);
          if (!state) return;

          let errorCode = 0;
          try {
            errorCode = context.getError();
          } catch {
            return;
          }

          const previousError = state.lastError ?? 0;
          const uiState = probeUiStateRef.current || {};
          const rect = canvasEl.getBoundingClientRect?.();
          const rendererSnapshot = registration?.renderer ? getRendererSnapshot(registration.renderer) : null;
          const canvasType = getCachedCanvasType(canvasEl) || getCanvasType(canvasEl, { allowDetect: false });
          const lastOpAgeMs = state.lastOpAtMs ? Math.max(0, Math.round(performance.now() - state.lastOpAtMs)) : null;
          let contextLostNow = false;
          try {
            contextLostNow = typeof context.isContextLost === "function" ? context.isContextLost() : false;
          } catch {
            contextLostNow = false;
          }
          const previousContextLost = Boolean(state.lastContextLost);
          if (!previousContextLost && contextLostNow) {
            const payload = {
              timestamp: new Date().toISOString(),
              route: uiState.route || "/",
              view: uiState.displayMode || "unknown",
              section: uiState.activeSection || "home",
              devPanelOpen: Boolean(uiState.isDevPanelOpen),
              appMarker: probeAppMarkerRef.current || "-",
              lastOp: state.lastOp || "-",
              lastArgsSummary: state.lastArgsSummary || "-",
              lastOpAgeMs,
              dpr: Number(window.devicePixelRatio || 1).toFixed(2),
              canvasCss: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)}` : "-",
              canvasBacking: `${canvasEl.width || 0}x${canvasEl.height || 0}`,
              renderer: rendererSnapshot,
              isContextLost: true,
              canvasMeta: describeCanvasMeta(canvasEl, getCanvasIndex(canvasEl), {
                allowDetect: false,
                typeOverride: canvasType,
              }),
            };
            saveFirstLoss(payload, "is_context_lost_transition");
            console.warn("[Probe6] CONTEXT_LOST_STATE", payload);
          }
          state.lastContextLost = contextLostNow;

          if (previousError === 0 && errorCode !== 0) {
            const payload = {
              timestamp: new Date().toISOString(),
              err: formatGlError(errorCode),
              errName: getGlErrorName(errorCode),
              lastOp: state.lastOp || "-",
              lastArgsSummary: state.lastArgsSummary || "-",
              lastOpAgeMs,
              route: uiState.route || "/",
              view: uiState.displayMode || "unknown",
              section: uiState.activeSection || "home",
              devPanelOpen: Boolean(uiState.isDevPanelOpen),
              appMarker: probeAppMarkerRef.current || "-",
              dpr: Number(window.devicePixelRatio || 1).toFixed(2),
              canvasCss: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)}` : "-",
              canvasBacking: `${canvasEl.width || 0}x${canvasEl.height || 0}`,
              renderer: rendererSnapshot,
              isContextLost: contextLostNow,
              canvasMeta: describeCanvasMeta(canvasEl, getCanvasIndex(canvasEl), {
                allowDetect: false,
                typeOverride: canvasType,
                }),
            };
            saveFirstLoss(payload, "gl_error_transition");
            console.warn("[Probe6] GL_ERROR_TRANSITION", payload);
          } else if (previousError !== 0 && errorCode === 0) {
            console.info("[Probe6] GL_ERROR_CLEARED", {
              timestamp: new Date().toISOString(),
              previousErr: formatGlError(previousError),
              route: uiState.route || "/",
              view: uiState.displayMode || "unknown",
              appMarker: probeAppMarkerRef.current || "-",
            });
          }

          state.lastError = errorCode;
          if (errorCode !== 0) state.lastErrorAtMs = Date.now();
        });
      }, 1000);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("webglcontextlost", onGlobalContextLostCapture, true);
      document.removeEventListener("webglcontextrestored", onGlobalContextRestoredCapture, true);
      if (previousProbe6Register) {
        window.__PROBE6_REGISTER_GL__ = previousProbe6Register;
      } else {
        delete window.__PROBE6_REGISTER_GL__;
      }
      if (inventoryIntervalId != null) {
        window.clearInterval(inventoryIntervalId);
      }
      if (probe6SamplerIntervalId != null) {
        window.clearInterval(probe6SamplerIntervalId);
      }
      Array.from(removalCleanupTimers.values()).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      removalCleanupTimers.clear();
      Array.from(probe6RegistrationByCanvas.values()).forEach((registration) => {
        if (registration?.context) unpatchProbe6Context(registration.context);
        if (registration?.renderer) unpatchProbe6RendererForceLoss(registration.renderer);
      });
      probe6RegistrationByCanvas.clear();
      Array.from(observedCanvases).forEach((canvasEl) => detachResizeObserver(canvasEl));
      Array.from(contextListeners.keys()).forEach((canvasEl) => detachContextListeners(canvasEl));
      knownCanvases.clear();
      delete window.__PROBE6_RESET_FIRST_LOSS__;
      syncGlobalCounts();
    };
  }, []);

  const handleClosePhotic = useCallback(() => {
    setIsPhoticOpen(false);

    // Best-effort cleanup for browsers that support it.
    try {
      if (screen?.orientation?.unlock) screen.orientation.unlock();
    } catch {
      // Ignore unlock failures.
    }

    try {
      if (document?.fullscreenElement && document?.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit failures.
    }
  }, []);

  const handleOpenPhotic = useCallback(async () => {
    // Best-effort: request fullscreen (improves chance of orientation lock working).
    try {
      if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // Ignore fullscreen failures (unsupported browser, permissions, etc.).
    }

    // Best-effort: lock orientation to landscape (not supported on iOS Safari).
    try {
      if (screen?.orientation?.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch {
      // Ignore lock failures (unsupported browser, not fullscreen, permissions).
    }

    // Even if lock fails (or OS orientation is fixed), the photic overlay itself renders in a
    // landscape coordinate system (rotated in portrait viewports).
    setIsPhoticOpen(true);
  }, []);

  // Debug flags for visual investigations (dev-only; ignored in prod builds).
  const getDevFlag = useCallback((key) => {
    if (!isDev) return null;
    return getDebugFlagValue(key, { allowUrl: true });
  }, [isDev]);

  const debugDisableDailyCard = isDev && parseDebugBool(getDevFlag('disableDailyCard'));
  const [debugBuildProbe, setDebugBuildProbe] = useState(false);
  const [debugShadowScan, setDebugShadowScan] = useState(false);
  const debugDailyCardShadowOff = isDev && parseDebugBool(getDevFlag('dailyCardShadowOff'));
  const debugDailyCardBlurOff = isDev && parseDebugBool(getDevFlag('dailyCardBlurOff'));
  const debugDailyCardBorderOff = isDev && parseDebugBool(getDevFlag('dailyCardBorderOff'));
  const debugDailyCardMaskOff = isDev && parseDebugBool(getDevFlag('dailyCardMaskOff'));

  const toggleDebugFlag = useCallback((key) => {
    if (!isDev) return;
    toggleDebugFlagLs(key);
  }, [isDev]);

  const toggleShadowScan = useCallback(() => {
    if (!isDev) return;
    // Session-only: starts disabled on each page load by default.
    setDebugShadowScan(v => !v);
  }, [isDev]);

  const toggleBuildProbe = useCallback(() => {
    if (!isDev) return;
    // Session-only: starts disabled on each page load by default.
    setDebugBuildProbe(v => !v);
  }, [isDev]);

  useEffect(() => {
    if (!isDev) return undefined;

    const onProbeEvent = (e) => {
      const enabled = e?.detail?.enabled;
      if (typeof enabled === 'boolean') setDebugBuildProbe(enabled);
      else setDebugBuildProbe(v => !v);
    };

    window.addEventListener('debug:buildProbe', onProbeEvent);
    return () => window.removeEventListener('debug:buildProbe', onProbeEvent);
  }, [isDev]);
  const effectiveShowBackgroundBottomLayer = playgroundMode
    ? Boolean(playgroundBottomLayer)
    : showBackgroundBottomLayer;

  // Screen Wake Lock when in Vigilance Mode
  useWakeLock(isMinimized);

  // Scroll to top when Home is shown (initial load or navigation back to Home)
  const isHub = activeSection === null;
  useEffect(() => {
    if (isHub) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [isHub]);

  // Listen for dev panel events (hide cards for wallpaper viewing)
  useEffect(() => {
    const handleHideCards = (e) => {
      console.log('App: hideCards event received, detail:', e.detail);
      setHideCards(e.detail);
    };
    // GRAVEYARD: Top layer removed
    // const handleTopLayer = (e) => {
    //   console.log('App: background-top event received, detail:', e.detail);
    //   setShowBackgroundTopLayer(e.detail);
    // };
    const handleBottomLayer = (e) => {
      console.log('App: background-bottom event received, detail:', e.detail);
      setShowBackgroundBottomLayer(e.detail);
    };
    const handleAvatarStage = (e) => {
      if (playgroundMode) return;
      console.log('App: dev-avatar-stage event received, detail:', e.detail);
      const stageName = e.detail.stage;
      setAvatarStage(stageName);
    };
    window.addEventListener('dev-hide-cards', handleHideCards);
    // window.addEventListener('dev-background-top', handleTopLayer);
    window.addEventListener('dev-background-bottom', handleBottomLayer);
    if (!playgroundMode) {
      window.addEventListener('dev-avatar-stage', handleAvatarStage);
    }
    return () => {
      window.removeEventListener('dev-hide-cards', handleHideCards);
      // window.removeEventListener('dev-background-top', handleTopLayer);
      window.removeEventListener('dev-background-bottom', handleBottomLayer);
      if (!playgroundMode) {
        window.removeEventListener('dev-avatar-stage', handleAvatarStage);
      }
    };
  }, [playgroundMode]);

  // Preview state (lifted from AvatarPreview to persist and apply to all avatars)
  const [previewStage, setPreviewStage] = useState('Seedling');
  const [previewPath, setPreviewPath] = useState(null);
  const [previewShowCore, setPreviewShowCore] = useState(true);
  const [previewAttention, setPreviewAttention] = useState('none');

  const effectivePreviewStage = playgroundMode ? overrideStage : previewStage;
  const effectivePreviewPath = playgroundMode ? overridePath : previewPath;
  const effectiveAvatarStage = playgroundMode ? overrideStage : avatarStage;

  const handlePreviewStageChange = useCallback((nextStage) => {
    if (playgroundMode) {
      setOverrideStage(nextStage);
      return;
    }
    setPreviewStage(nextStage);
  }, [playgroundMode, setOverrideStage]);

  const handlePreviewPathChange = useCallback((nextPath) => {
    if (playgroundMode) {
      setOverridePath(nextPath);
      return;
    }
    setPreviewPath(nextPath);
  }, [playgroundMode, setOverridePath]);

  const handleAvatarStageSelection = useCallback((stageName) => {
    if (playgroundMode) {
      setOverrideStage(stageName);
      return;
    }
    setAvatarStage(stageName);
    setPreviewStage(stageName);
  }, [playgroundMode, setOverrideStage]);

  const handleSectionSelect = useCallback((section) => {
    if (playgroundMode) {
      setActiveSection(null);
      return;
    }
    if (userMode !== 'student') {
      setActiveSection(section);
      return;
    }
    if (section === null) {
      setActiveSection(null);
      return;
    }
    if (section === 'navigation') {
      if (needsSetup) {
        setActiveSection('navigation');
      }
      return;
    }
    if (section === 'practice') {
      if (practiceLaunchContext) {
        setActiveSection('practice');
      }
      return;
    }
  }, [needsSetup, playgroundMode, practiceLaunchContext, userMode]);

  // Sync avatarStage with previewStage so theme colors update
  useEffect(() => {
    if (playgroundMode) return;
    setAvatarStage(previewStage);
  }, [playgroundMode, previewStage]);

  // Preload critical images on app start
  useEffect(() => {
    startImagePreloading(import.meta.env.BASE_URL);
  }, []);

  // Initialize viewport resize listener
  const initViewportListener = useDisplayModeStore((s) => s.initViewportListener);
  useEffect(() => {
    initViewportListener();
  }, [initViewportListener]);

  // DISABLED: Never auto-show completion report
  // User can manually access from HomeHub or CurriculumHub if needed
  // useEffect(() => {
  //   if (curriculumOnboardingComplete && isCurriculumComplete()) {
  //     setShowCurriculumReport(true);
  //   }
  // }, [curriculumOnboardingComplete, isCurriculumComplete]);


  // v3.27.196 - feat(NeonWireRingRND): exaggeration pass A — darker OFF, HDR ON, inner-core disc, bloom active

  // Practice identification
  const [activePracticeId, setActivePracticeId] = useState(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState(null);
  const [isFullscreenExperience, setIsFullscreenExperience] = useState(false);

  const handlePracticingChange = (val, pid = null, requiresFullscreen = false, selectedId = null) => {
    setIsPracticing(val);
    if (pid) setActivePracticeId(pid);
    else if (!val) setActivePracticeId(null);
    if (selectedId) setSelectedPracticeId(selectedId);
    // Set fullscreen experience based on practice metadata
    setIsFullscreenExperience(val && requiresFullscreen);
  };
  const runningPracticeId =
    typeof activePracticeId === "string" && activePracticeId.length > 0
      ? activePracticeId
      : null;
  const menuPracticeId =
    typeof selectedPracticeId === "string" && selectedPracticeId.length > 0
      ? selectedPracticeId
      : null;
  const effectivePracticeId = runningPracticeId || menuPracticeId;
  const isActiveBreathSession =
    isPracticing === true &&
    activeSection === 'practice' &&
    activePracticeId === 'breath';
  const resolvedPracticeTutorialId = effectivePracticeId ? `practice:${effectivePracticeId}` : null;
  const practiceTutorialId =
    resolvedPracticeTutorialId && TUTORIALS[resolvedPracticeTutorialId]
      ? resolvedPracticeTutorialId
      : 'page:practice';
  const headerTutorialId = (() => {
    // Photonic (embedded or overlay) should always route to the photic beginner guide
    if (
      activeSection === 'practice' &&
      (effectivePracticeId === 'photic' || activePracticeId === 'photic')
    ) {
      return 'page:photic-beginner';
    }

    if (isPhoticOpen) return 'page:photic-beginner';

    if (!activeSection) return 'page:home';
    if (activeSection === 'practice') return practiceTutorialId;
    if (activeSection === 'wisdom') return 'page:wisdom';
    if (activeSection === 'application') return 'page:application';
    if (activeSection === 'navigation') return 'page:navigation';
    return 'page:home';
  })();

  const handleAuthChange = useCallback((event, session) => {
    if (event === "SIGNED_OUT") {
      setShowSettings(false);
      setActiveSection(null);
      return;
    }

    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
      setShowSettings(false);
      setActiveSection(null);
    }
  }, []);

  return (
    <AuthGate onAuthChange={handleAuthChange}>
    <ThemeProvider currentStage={effectiveAvatarStage}>

      {/* Curriculum Completion Report */}
      {showCurriculumReport && (
        <CurriculumCompletionReport
          onDismiss={() => setShowCurriculumReport(false)}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSignedOut={() => {
          setShowSettings(false);
          setActiveSection(null);
        }}
      />

      {/* Dev Panel (🎨 button or Ctrl+Shift+D) */}
      {selectionEnabled && devtoolsEnabled && (
        <Suspense fallback={null}>
          <DevPanel
            isOpen={showDevPanel}
            onClose={() => setShowDevPanel(false)}
            avatarStage={effectivePreviewStage}
            setAvatarStage={handlePreviewStageChange}
            avatarPath={effectivePreviewPath}
            setAvatarPath={handlePreviewPathChange}
            showCore={previewShowCore}
            setShowCore={setPreviewShowCore}
            avatarAttention={previewAttention}
            setAvatarAttention={setPreviewAttention}
          />
        </Suspense>
      )}

      {selectionEnabled && (
        <Suspense fallback={null}>
          <PracticeButtonElectricBorderOverlay />
          <SelectedControlElectricBorderOverlay />
          <SelectedPlateOverlay />
          {import.meta.env.DEV && <SelectedCardElectricBorderOverlay />}
        </Suspense>
      )}

      {/* Outer Layout Container - Adapts to display mode */}
      <div
        className="min-h-screen w-full flex justify-center overflow-visible transition-colors duration-500 relative"
        style={{
          background: outerBackground,
        }}
      >
        {/* Side mask - left side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 left-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: displayMode === 'sanctuary'
              ? 'calc((100vw - min(100vw, 820px)) / 2)'
              : 'calc((100vw - min(100vw, 430px)) / 2)',
            background: outerBackground,
          }}
        />

        {/* Side mask - right side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 right-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: displayMode === 'sanctuary'
              ? 'calc((100vw - min(100vw, 820px)) / 2)'
              : 'calc((100vw - min(100vw, 430px)) / 2)',
            background: outerBackground,
          }}
        />

        {/* Full-viewport Background (wallpaper fills entire screen) */}
        <Background stage={effectivePreviewStage} showBottomLayer={effectiveShowBackgroundBottomLayer} />

        <PhoticCirclesOverlay
          isOpen={isPhoticOpen}
          onClose={handleClosePhotic}
          autoStart={true}
        />

        {/* Inner App Container */}
        <div
          data-app-frame
          className={`relative min-h-screen flex flex-col items-center overflow-visible transition-all duration-500 ${isLight ? 'text-[#3D3425]' : 'text-white'}`}
          style={displayMode === 'sanctuary' ? {
            // Sanctuary: iPad width (820px)
            width: '100%',
            maxWidth: '820px',
            boxShadow: 'none',
            overflowX: 'hidden',
            overflowY: 'visible',
            zIndex: 1,
          } : {
            // Hearth: Phone width (430px)
            width: '100%',
            maxWidth: '430px',
            // Keep frame shadow off; rectangular frame-glow reads as square corner artifacts near glass cards.
            boxShadow: 'none',
            overflowX: 'hidden',
            overflowY: 'visible',
            zIndex: 1,
          }}
        >

          <div className='relative z-10 w-full flex flex-col overflow-x-hidden overflow-y-visible' style={isFirefox ? { transform: 'translateZ(0)' } : undefined}>
            {/* Fixed Dark Header Bar */}
            <header
              className={`sticky top-0 z-50 w-full px-6 py-3 transition-colors duration-500${isActiveBreathSession ? ' header--breath-active' : ''}`}
              style={{
                background: isFirefox
                  ? (isLight ? 'rgba(200,185,165,0.95)' : 'rgba(10,10,15,0.95)')
                  : (isLight
                    ? 'linear-gradient(180deg, rgba(200,185,165,0.1) 0%, rgba(210,195,175,0.05) 60%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)'),
                backdropFilter: isFirefox ? 'none' : 'blur(8px)',
                WebkitBackdropFilter: isFirefox ? 'none' : 'blur(8px)',
                borderBottom: isLight
                  ? '1px solid rgba(140,120,90,0.15)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-between w-full h-full relative">
                {/* Left: Branding */}
                <div className="flex-1 flex items-center justify-start">
                  <div
                    className={`type-label app-header-brand ${isLight ? 'text-[#5A4D3C]/70' : 'text-white/60'}`}
                  >
                    IMMANENCE OS
                  </div>
                </div>

                {/* Right: Controls & Home Button */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  <div className="flex items-center gap-3 app-header-control-cluster">
                    <WidthToggle />
                    <DisplayModeToggle />
                    <button
                      type="button"
                      onClick={() => setShowSettings(v => !v)}
                      className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                      title="Settings"
                      style={{ color: showSettings ? 'var(--accent-color)' : undefined }}
                    >
                      ⚙️
                    </button>
                    {selectionEnabled && devtoolsEnabled && (
                      <button
                        type="button"
                        onClick={() => setShowDevPanel(v => !v)}
                        className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                        title="Dev Panel (Ctrl+Shift+D)"
                        style={{ color: showDevPanel ? 'var(--accent-color)' : undefined }}
                      >
                        🎨
                      </button>
                    )}
                    <button
                      type="button"
                      data-tutorial="global-tutorial-button"
                      onClick={() => {
                        const tutorialStore = useTutorialStore.getState();
                        tutorialStore.openTutorial(headerTutorialId);
                      }}
                      className={`type-label font-medium px-2 py-1 rounded-lg transition-colors ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                      title="Tutorial"
                    >
                      ?
                    </button>
                    <div className={`type-caption uppercase tracking-wide app-header-version ${isLight ? 'text-[#5A4D3C]/50' : 'text-white/40'}`}>
                      <button
                        type="button"
                        className="cursor-default app-header-version-button"
                        title="Debug: Alt+Shift+Click toggles buildProbe. Alt+Ctrl+Click toggles disableDailyCard."
                        onClick={(e) => {
                          if (e.altKey && e.shiftKey) toggleBuildProbe();
                          if (e.altKey && (e.ctrlKey || e.metaKey)) toggleDebugFlag('disableDailyCard');
                          if (!hasDevtoolsQueryFlag()) return;
                          const now = Date.now();
                          const state = devtoolsTapRef.current;
                          if (!state.firstTs || (now - state.firstTs) > 3000) {
                            state.firstTs = now;
                            state.count = 0;
                          }
                          state.count += 1;
                          if (state.count >= 7) {
                            state.count = 0;
                            state.firstTs = 0;
                            if (!isDevtoolsUnlocked()) {
                              setDevtoolsUnlocked(true);
                              setDevtoolsGateTick(t => t + 1);
                              console.info('[devtools] unlocked');
                            }
                          }
                        }}
                        style={{ background: 'transparent' }}
                      >
                        v3.27.196
                      </button>
                    </div>
                  </div>

                  {!isHub && !playgroundMode && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className={`type-label font-medium px-2 py-1 rounded-lg transition-colors app-header-home ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    >
                      Home
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Main content - hide when minimized */}
            <div
              style={{
                opacity: isMinimized ? 0 : 1,
                pointerEvents: isMinimized ? 'none' : 'auto',
                transition: 'opacity 0.7s ease'
              }}
              inert={isMinimized ? "" : undefined}
            >
              {!hasChosenUserMode ? (
                <div className="min-h-screen w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setUserMode('student')}
                      className="px-4 py-2 rounded border border-white/20"
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserMode('explorer')}
                      className="px-4 py-2 rounded border border-white/20"
                    >
                      Explorer
                    </button>
                  </div>
                </div>
              ) : (isHub || playgroundMode) ? (
                <div key="hub" className="section-enter">
                  {(debugBuildProbe && debugShadowScan) && (
                    <div
                      className="mx-6 mt-3 mb-2 rounded-lg px-3 py-2 text-[11px] uppercase tracking-[0.12em]"
                      style={{
                        border: '1px dashed rgba(255, 80, 80, 0.65)',
                        background: isLight ? 'rgba(250, 246, 238, 0.10)' : 'rgba(0,0,0,0.10)',
                        color: isLight ? 'rgba(60, 50, 35, 0.75)' : 'rgba(255,255,255,0.75)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ userSelect: 'text' }}>
                          BUILD_PROBE: App debug flags | disableDailyCard:{String(debugDisableDailyCard)} | shadowScan:{String(debugShadowScan)} | dailyCardShadowOff:{String(debugDailyCardShadowOff)} | dailyCardBlurOff:{String(debugDailyCardBlurOff)} | dailyCardBorderOff:{String(debugDailyCardBorderOff)} | dailyCardMaskOff:{String(debugDailyCardMaskOff)} | href:{typeof window !== 'undefined' ? String(window.location.href) : 'n/a'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start', maxWidth: '100%' }}>
                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('disableDailyCard')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDisableDailyCard ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle disableDailyCard (reloads)"
                          >
                            toggle disableDailyCard
                          </button>

                          <button
                            type="button"
                            onClick={toggleShadowScan}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugShadowScan ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle shadowScan overlay (session only)"
                          >
                            toggle shadowScan
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardShadowOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardShadowOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardShadowOff (reloads)"
                          >
                            toggle card shadowOff
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardBlurOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardBlurOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardBlurOff (reloads)"
                          >
                            toggle card blurOff
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardBorderOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardBorderOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardBorderOff (reloads)"
                          >
                            toggle card borderOff
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardMaskOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardMaskOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardMaskOff (reloads)"
                          >
                            toggle card maskOff
                          </button>

                          <button
                            type="button"
                            onClick={toggleBuildProbe}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle buildProbe (session only)"
                          >
                            hide probe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {!hideCards && (
                    <HomeHub
                      onSelectSection={handleSectionSelect}
                      activeSection={activeSection}
                      onStageChange={(hsl, stageName) => handleAvatarStageSelection(stageName)}
                      isPracticing={isPracticing}
                      currentStage={effectivePreviewStage}
                      previewPath={effectivePreviewPath}
                      previewShowCore={previewShowCore}
                      previewAttention={previewAttention}
                      onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                      lockToHub={playgroundMode}
                      debugDisableDailyCard={debugDisableDailyCard}
                      debugBuildProbe={debugBuildProbe && debugShadowScan}
                      debugShadowScan={debugShadowScan}
                      debugDailyCardShadowOff={debugDailyCardShadowOff}
                      debugDailyCardBlurOff={debugDailyCardBlurOff}
                      debugDailyCardBorderOff={debugDailyCardBorderOff}
                      debugDailyCardMaskOff={debugDailyCardMaskOff}
                    />
                  )}
                </div>
              ) : (
                <SectionView
                  section={activeSection}
                  isPracticing={isPracticing}
                  currentPracticeId={activePracticeId}
                  isFullscreenExperience={isFullscreenExperience}
                  isActiveBreathSession={isActiveBreathSession}
                  onPracticingChange={handlePracticingChange}
                  breathState={breathState}
                  onBreathStateChange={setBreathState}
                  onStageChange={(hsl, stageName) => handleAvatarStageSelection(stageName)}
                  currentStage={effectivePreviewStage}
                  previewPath={effectivePreviewPath}
                  previewShowCore={previewShowCore}
                  previewAttention={previewAttention}
                  showFxGallery={showFxGallery}
                  onNavigate={handleSectionSelect}
                  onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                  onRitualComplete={() => handleSectionSelect(null)}
                  onOpenPhotic={handleOpenPhotic}
                  hideCards={hideCards}
                />
              )}
            </div>
          </div>

          <HardwareGuide
            isOpen={isHardwareGuideOpen}
            onClose={() => setIsHardwareGuideOpen(false)}
          />

          <InstallPrompt />

          {/* Tutorial overlay system */}
          <TutorialOverlay />

          {/* Debug overlay: identifies the actual element owning shadows/filters/backdrop when enabled */}
          <ShadowScanOverlay enabled={isDev && debugShadowScan} />
        </div >
      </div >
    </ThemeProvider >
    </AuthGate>
  );
}

function AppWithBoundary(props) {
  return (
    <ErrorBoundary>
      <App {...props} />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;
