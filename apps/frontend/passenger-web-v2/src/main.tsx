import { createRoot } from "react-dom/client";
import { configureApiClients } from "./lib/api/setup";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

initSentry();
configureApiClients();

createRoot(document.getElementById("root")!).render(<App />);
