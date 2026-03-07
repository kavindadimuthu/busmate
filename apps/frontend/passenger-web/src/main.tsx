import { createRoot } from "react-dom/client";
import { configureApiClients } from "./lib/api/setup";
import App from "./App.tsx";
import "./index.css";

configureApiClients();

createRoot(document.getElementById("root")!).render(<App />);
