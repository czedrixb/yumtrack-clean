import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Capture install prompt early, before React components mount
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  console.log('Install prompt captured globally');
});

createRoot(document.getElementById("root")!).render(<App />);
