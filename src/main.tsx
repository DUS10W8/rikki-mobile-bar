import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { routeModules } from "./routes";
import "./index.css";

const modules = import.meta.glob<{ default: React.ComponentType }>([
  "./App.tsx", "./pages/**/*.tsx", "!./pages/MobileBarSite.tsx", "./bartender/BartenderPage.tsx", "./order/OrderPage.tsx",
]);
const routePath = window.location.pathname.replace(/\/+$/, "");
const modulePath = routeModules[routePath] ?? "./pages/NotFoundPage.tsx";

async function start() {
  const { default: Root } = await modules[modulePath]();
  const container = document.getElementById("root")!;
  const app = <React.StrictMode><Root /><Analytics /></React.StrictMode>;
  if (container.dataset.prerendered === "true") ReactDOM.hydrateRoot(container, app, {
    onRecoverableError: (error, info) => console.error("Page hydration:", error, info.componentStack),
  });
  else ReactDOM.createRoot(container).render(app);
}

void start().catch(() => {
  const container = document.getElementById("root")!;
  const message = document.createElement("p");
  message.textContent = "Interactive features could not load. Please refresh, or call (509) 231-9354 to plan your event.";
  container.prepend(message);
});
