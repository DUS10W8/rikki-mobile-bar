import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ACTIVE_EVENT } from "./eventMenu";
import "./MenuDisplayPage.css";

// iPad on a stand at the event: a huge QR code (public/qr-codes/order-es.svg → rikkismobile.com/order?lang=es)
// with a short Spanish line. Open rikkismobile.com/menu-display. The menu itself lives on the guest's phone.

const CANVAS = { landscape: 1200, portrait: 840 };

const title = (ACTIVE_EVENT as { title_es?: string }).title_es ?? ACTIVE_EVENT.title;

function useScreenAwake() {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } };
    let sentinel: Sentinel | null = null;
    const request = () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      nav.wakeLock.request("screen").then((s) => { sentinel = s; }).catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    document.addEventListener("pointerdown", request);
    // Pick up changes from a new deploy without anyone touching the iPad.
    const reload = window.setInterval(() => { if (navigator.onLine) window.location.reload(); }, 20 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", request);
      document.removeEventListener("pointerdown", request);
      window.clearInterval(reload);
      void sentinel?.release().catch(() => {});
    };
  }, []);
}

export default function MenuDisplayPage() {
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const width = portrait ? CANVAS.portrait : CANVAS.landscape;

  useScreenAwake();

  useEffect(() => {
    document.documentElement.lang = "es";
    document.title = `${title} · Rikki's Mobile`;
  }, []);

  useLayoutEffect(() => {
    const fit = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setPortrait(isPortrait);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = isPortrait ? CANVAS.portrait : CANVAS.landscape;
      const h = canvas.offsetHeight || 1;
      setScale(Math.min(window.innerWidth / w, window.innerHeight / h));
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (canvasRef.current) observer.observe(canvasRef.current);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    void document.fonts?.ready.then(fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, [portrait]);

  return (
    <div className="menu-display" lang="es">
      <div
        ref={canvasRef}
        className={`menu-display__canvas ${portrait ? "is-portrait" : "is-landscape"}`}
        style={{ width, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="menu-display__text">
          <img className="menu-display__logo" src="/rikkis-logo.png" alt="Rikki's Mobile" />
          <p className="menu-display__eyebrow">{title}</p>
          <h1>¡Pide sin hacer fila!</h1>
          <p className="menu-display__kicker">Escanea para ver el menú y pedir desde tu lugar</p>
          <p className="menu-display__scan-hint">Paga con tu teléfono. Te avisamos cuando esté lista.</p>
          <p className="menu-display__fine">Mayores de 21 con pulsera</p>
        </div>
        <div className="menu-display__qr">
          <img src="/qr-codes/order-es.svg" alt="Código QR para ver el menú y pedir" />
        </div>
      </div>
    </div>
  );
}
