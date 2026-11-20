import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { routeModules } from "./routes";
import "./index.css";
import { captureAttribution } from "./lib/attribution";

captureAttribution();

const modules = import.meta.glob<{ default: React.ComponentType }>([
  "./App.tsx", "./pages/**/*.tsx", "!./pages/MobileBarSite.tsx", "./bartender/BartenderPage.tsx", "./order/OrderPage.tsx",
]);
// Case-insensitive, so "/Pay" typed on a phone still works.
const routePath = window.location.pathname.replace(/\/+$/, "").toLowerCase();
const modulePath = routeModules[routePath] ?? "./pages/NotFoundPage.tsx";

async function start() {
  const { default: Root } = await modules[modulePath]();
  const container = document.getElementById("root")!;
  function Page() {
    React.useEffect(() => {
      if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        target?.scrollIntoView();
      }
    }, []);
    return <><Root /><Analytics /></>;
  }
  const app = <React.StrictMode><Page /></React.StrictMode>;
  // Keep the complete static page until its interactive module has downloaded.
  // This SPA mounts the same component rather than hydrating independently built HTML.
  ReactDOM.createRoot(container).render(app);
}

void start().catch(() => {
  const container = document.getElementById("root")!;
  const message = document.createElement("p");
  message.textContent = "Interactive features could not load. Please refresh, or call (509) 231-9354 to plan your event.";
  container.prepend(message);
});
