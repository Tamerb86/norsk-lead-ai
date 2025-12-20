import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  try {
    createRoot(root).render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering App:", error);
    root.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error}</div>`;
  }
} else {
  console.error("Root element not found!");
}
