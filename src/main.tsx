// ============================================================
// main.tsx — the FRONTEND's ignition switch.
//
// index.html is just an empty page with <div id="root"></div>.
// This file finds that empty box and tells React to render the
// whole app (<App />) into it.
// ============================================================
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find the application root.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
