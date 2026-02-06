import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { TracePage } from "./pages/TracePage.jsx";
import { Playground } from "./dev/Playground.jsx";
import "./immanence.css";
import "./index.css";

// DEV: ensure no stale SW/caches (Edge commonly keeps old PWA assets)
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => keys.forEach((k) => caches.delete(k)))
      .catch(() => {});
  }
}

// Simple path-based routing (no React Router needed)
const getRoute = () => {
  const path = window.location.pathname;
  if (import.meta.env.DEV && path === "/__playground") {
    return "playground";
  }
  // Handle both /Immanence/trace and /trace
  if (path.endsWith('/trace') || path.endsWith('/trace/')) {
    return 'trace';
  }
  return 'app';
};

const RootComponent = () => {
  const route = getRoute();

  if (route === 'trace') {
    return <TracePage />;
  }
  if (route === "playground") {
    return <Playground />;
  }

  return <App />;
};

const container = document.getElementById("root");
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}
window._root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
