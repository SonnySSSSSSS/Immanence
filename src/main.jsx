import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./immanence.css";  // <- ADD THIS, FIRST
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);