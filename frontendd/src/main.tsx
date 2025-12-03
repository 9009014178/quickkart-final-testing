import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Get the root element from index.html
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Create React root
const root = createRoot(rootElement);

// Render the app
root.render(<App />);