import { createRoot } from "react-dom/client";
import Landing from "./pages/Landing";
import "./index.css";

console.log("main_test2.tsx loading...");

const root = document.getElementById("root");
if (root) {
  try {
    console.log("Attempting to render Landing...");
    createRoot(root).render(<Landing />);
    console.log("Landing rendered successfully");
  } catch (error) {
    console.error("Error rendering Landing:", error);
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
      <h2>Error Loading App</h2>
      <pre>${error}</pre>
    </div>`;
  }
} else {
  console.error("Root element not found!");
}
