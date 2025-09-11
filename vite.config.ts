import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use your repo name here (case-sensitive)
  base: "/rikki-mobile-bar/",
});
