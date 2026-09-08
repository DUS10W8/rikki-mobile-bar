import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import BartenderPage from "./bartender/BartenderPage";
import OrderPage from "./order/OrderPage";
import ConnectPage from "./pages/ConnectPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import TipPage from "./pages/TipPage";
import WeddingBartenderTriCitiesPage from "./pages/seo/WeddingBartenderTriCitiesPage";
import MobileBarTriCitiesPage from "./pages/seo/MobileBarTriCitiesPage";
import MobileBarWallaWallaPage from "./pages/seo/MobileBarWallaWallaPage";
import LicensedMobileBarPage from "./pages/seo/LicensedMobileBarPage";
import BlogIndexPage from "./pages/blog/BlogIndexPage";
import WeddingBartenderCostPage from "./pages/blog/WeddingBartenderCostPage";
import AlcoholFor100GuestsPage from "./pages/blog/AlcoholFor100GuestsPage";
import MobileBarVsBartenderPage from "./pages/blog/MobileBarVsBartenderPage";
import WeddingBarChecklistPage from "./pages/blog/WeddingBarChecklistPage";
import "./index.css"; // <-- this pulls in Tailwind (via @import "tailwindcss")

const routePath = window.location.pathname.replace(/\/+$/, "");

const routes: Record<string, React.ComponentType> = {
  "/tip": TipPage,
  "/order": OrderPage,
  "/bartender": BartenderPage,
  "/connect": ConnectPage,
  "/privacy": PrivacyPage,
  "/terms": TermsPage,
  "/wedding-bartender-tri-cities-wa": WeddingBartenderTriCitiesPage,
  "/mobile-bar-tri-cities-wa": MobileBarTriCitiesPage,
  "/mobile-bar-walla-walla-wa": MobileBarWallaWallaPage,
  "/licensed-mobile-bar-washington": LicensedMobileBarPage,
  "/blog": BlogIndexPage,
  "/blog/wedding-bartender-cost-washington": WeddingBartenderCostPage,
  "/blog/how-much-alcohol-for-100-wedding-guests": AlcoholFor100GuestsPage,
  "/blog/mobile-bar-vs-bartender": MobileBarVsBartenderPage,
  "/blog/wedding-bar-checklist": WeddingBarChecklistPage,
};

const Root = routes[routePath] ?? App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
    <Analytics />
  </React.StrictMode>
);
