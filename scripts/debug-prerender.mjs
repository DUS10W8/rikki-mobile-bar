import { createServer } from "vite";
import { readFile } from "node:fs/promises";

const server = await createServer({
  server: { host: "127.0.0.1", port: 5174 },
  plugins: [{ name: "debug-prerender", configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/" && req.url !== "/wedding-bartender-tri-cities-wa") return next();
      let html = await readFile(req.url === "/" ? "dist/index.html" : "dist/wedding-bartender-tri-cities-wa/index.html", "utf8");
      html = html.replace(/<script type="module"[^>]*><\/script>/g, '<script type="module" src="/src/main.tsx"></script>');
      html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");
      res.setHeader("Content-Type", "text/html");
      res.end(await server.transformIndexHtml("/", html));
    });
  } }],
});
await server.listen();
server.printUrls();
