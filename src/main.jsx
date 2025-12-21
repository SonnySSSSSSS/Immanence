import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { TracePage } from "./pages/TracePage.jsx";
import "./immanence.css";
import "./index.css";

// Simple path-based routing (no React Router needed)
const getRoute = () => {
  const path = window.location.pathname;
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
