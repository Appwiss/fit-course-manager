import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => console.log("✅ Service Worker enregistré:", reg.scope))
      .catch((err) => console.error("❌ Erreur enregistrement SW:", err));
  });
}
