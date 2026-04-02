import { useEffect, useRef, useState } from "react";
import { useDisplayModeStore } from "../../state/displayModeStore.js";
import { DisplayModeToggle } from "../DisplayModeToggle.jsx";
import { HEADER_BRAND, HEADER_USER_NAME } from "./headerTokens.js";
import { Button } from "../ui/button.jsx";
import { Tooltip } from "../ui/tooltip.jsx";
import { Dialog } from "../ui/dialog.jsx";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "../ui/command.jsx";
import { Separator } from "../ui/separator.jsx";
import { Badge } from "../ui/badge.jsx";

export function AppHeader({
  isLight,
  isHub,
  onNavigate,
  devPanelGateEnabled,
  showDevPanel,
  setShowDevPanel,
  onVersionClick,
  versionLabel,
  userMode,
}) {
  const [isHelpToastOpen, setIsHelpToastOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const helpToastRef = useRef(null);

  const { colorScheme, toggleColorScheme } = useDisplayModeStore();
  const isCurrentLight = colorScheme === "light";


  useEffect(() => {
    const onKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setIsCommandOpen(true);
      }

      if (event.key === "Escape") {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isHelpToastOpen) return;
    const timer = window.setTimeout(() => setIsHelpToastOpen(false), 10000);
    return () => window.clearTimeout(timer);
  }, [isHelpToastOpen]);

  useEffect(() => {
    if (!isHelpToastOpen) return;
    const handleDocumentClick = (event) => {
      if (helpToastRef.current && !helpToastRef.current.contains(event.target)) {
        setIsHelpToastOpen(false);
      }
    };
    window.addEventListener("mousedown", handleDocumentClick);
    return () => window.removeEventListener("mousedown", handleDocumentClick);
  }, [isHelpToastOpen]);

  const commandActions = [
    { id: "practice", label: "Go to Practice", action: () => onNavigate("practice") },
    { id: "wisdom", label: "Go to Wisdom", action: () => onNavigate("wisdom") },
    { id: "application", label: "Go to Application", action: () => onNavigate("application") },
    { id: "navigation", label: "Go to Navigation", action: () => onNavigate("navigation") },
    { id: "theme", label: "Toggle Theme", action: () => toggleColorScheme() },
    { id: "help", label: "Open Help", action: () => setIsHelpToastOpen(true) },
  ];

  const runCommand = (action) => {
    setIsCommandOpen(false);
    action();
  };

  const onVersionButtonClick = (e) => {
    if (typeof onVersionClick === "function") {
      onVersionClick(e);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full px-4 py-2 app-header-shell ${isHub ? "app-header-shell--hub" : "app-header-shell--section"}`}
      style={{
        background: isLight
          ? "linear-gradient(180deg, rgba(210,195,175,0.18) 0%, rgba(210,195,175,0.06) 70%, transparent 100%)"
          : "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.2) 100%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: isLight ? "1px solid rgba(140,120,90,0.2)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[430px] items-center justify-between gap-3">
        {/* Left zone: Brand identity */}
        <div className="flex items-center gap-2">
          <div className={`type-label font-black tracking-wider ${isCurrentLight ? "text-slate-900" : "text-yellow-200"}`}>{HEADER_BRAND}</div>
        </div>

        {/* Center zone: identity token */}
        <div className={`flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isCurrentLight ? "bg-slate-100 text-slate-800" : "bg-white/10 text-white"}`}>
          <span>{HEADER_USER_NAME}</span>
          <Separator orientation="vertical" />
          <span className="font-semibold">{userMode ? userMode : "Explorer"}</span>
        </div>

        {/* Right zone: utilities */}
        <div className="flex items-center gap-2">
          <Tooltip content="Toggle theme">
            <Button variant="ghost" onClick={toggleColorScheme} aria-label="Toggle theme">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2" />
                <path d="M12 21v2" />
                <path d="M4.22 4.22l1.42 1.42" />
                <path d="M18.36 18.36l1.42 1.42" />
                <path d="M1 12h2" />
                <path d="M21 12h2" />
                <path d="M4.22 19.78l1.42-1.42" />
                <path d="M18.36 5.64l1.42-1.42" />
              </svg>
            </Button>
          </Tooltip>

          <Tooltip content="Open help">
            <Button variant="ghost" onClick={() => setIsHelpToastOpen(true)} aria-label="Help">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 9a3 3 0 1 1 6 0c0 3-3 3-3 6" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </Tooltip>

          <Tooltip content="Quick actions (Ctrl+K / ⌘K)">
            <Button variant="ghost" onClick={() => setIsCommandOpen(true)} aria-label="Command palette">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18" />
                <path d="M12 3v18" />
                <path d="M6 6l12 12" />
                <path d="M6 18l12-12" />
              </svg>
            </Button>
          </Tooltip>

          <Separator orientation="vertical" />

          <Tooltip content="Version (tap 7x for devtools)">
            <Button
              variant="ghost"
              onClick={onVersionButtonClick}
              className="text-[10px] font-semibold opacity-70 hover:opacity-100"
              aria-label="App version"
            >
              {versionLabel}
            </Button>
          </Tooltip>

          {devPanelGateEnabled && (
            <Tooltip content="Dev Panel (Ctrl+Shift+D)">
              <Button
                variant="ghost"
                onClick={() => setShowDevPanel((v) => !v)}
                aria-label="Dev Panel"
                className={showDevPanel ? "text-cyan-300" : ""}
              >
                🎨
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Help toast */}
      {isHelpToastOpen && (
        <div className="fixed inset-x-4 top-16 z-50 flex justify-center">
          <div
            ref={helpToastRef}
            className="w-full max-w-[420px] rounded-lg border border-white/15 bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm text-white/90">
                <div>Use the command palette (Ctrl+K / ⌘K) to jump sections and toggle theme.</div>
                <div>Tap version 7 times (within 3s) to unlock devtools when available.</div>
              </div>
              <Button variant="subtle" onClick={() => setIsHelpToastOpen(false)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      {/* Command dialog */}
      <Dialog open={isCommandOpen} onOpenChange={setIsCommandOpen} title="Quick actions" description="Type or select a command.">
        <Command>
          <CommandInput placeholder="Type a command…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {commandActions.map((item) => (
              <CommandItem key={item.id} onSelect={() => runCommand(item.action)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </Dialog>
    </header>
  );
}
