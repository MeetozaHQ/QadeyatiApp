console.log("main.tsx: Script evaluation started...");
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles.css";

console.log("main.tsx: Rendering App component into #root...");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
console.log("main.tsx: Render call finished!");
