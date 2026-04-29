import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import OrderPage from "./order/OrderPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import TipPage from "./pages/TipPage";
import "./index.css"; // <-- this pulls in Tailwind (via @import "tailwindcss")

const routePath = window.location.pathname.replace(/\/+$/, "");
const Root =
  routePath === "/tip"
    ? TipPage
    : routePath === "/order"
      ? OrderPage
      : routePath === "/privacy"
        ? PrivacyPage
        : routePath === "/terms"
          ? TermsPage
          : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
