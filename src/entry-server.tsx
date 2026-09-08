import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { SeoCollector, type SeoMeta } from "./lib/seo";
import { routeModules } from "./routes";

const modules = import.meta.glob<{ default: ComponentType }>([
  "./App.tsx", "./pages/seo/*.tsx", "./pages/blog/*.tsx", "./pages/ConnectPage.tsx", "./pages/NotFoundPage.tsx",
], { eager: true });

export function render(route: string) {
  const modulePath = route === "404" ? "./pages/NotFoundPage.tsx" : routeModules[route ? `/${route}` : ""];
  const Root = modules[modulePath]?.default;
  if (!Root) throw new Error(`No prerender component for ${route}`);
  let meta: SeoMeta | undefined;
  const body = renderToString(createElement(SeoCollector.Provider, { value: (value: SeoMeta) => { meta = value; } }, createElement(Root)));
  return { body, meta };
}
