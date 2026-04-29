import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import TipPage from "./pages/TipPage";
import "./index.css"; // <-- this pulls in Tailwind (via @import "tailwindcss")

const isTipRoute = window.location.pathname.replace(/\/+$/, "") === "/tip";
const Root = isTipRoute ? TipPage : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
