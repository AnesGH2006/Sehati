import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")!).render(<App />);
