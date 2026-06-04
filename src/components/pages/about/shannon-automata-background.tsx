import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  emitFromEdges,
  emitFromText,
  seedField,
  stepField,
} from "./automata/automata-evolution";
import { createAutomataState, viewportSize } from "./automata/automata-model";
import { drawField } from "./automata/automata-renderer";
import { refreshTextField } from "./automata/automata-text-field";

const STEP_INTERVAL_MS = 82;

export function ShannonAutomataBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!portalTarget) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const canvasElement = canvas;
    const canvasContext = context;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let lastFieldRefresh = 0;
    let lastStep = 0;
    let tick = 0;
    let state = createAutomataState(
      viewportSize().width,
      viewportSize().height,
    );

    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = viewportSize();

      canvasElement.width = Math.floor(viewport.width * pixelRatio);
      canvasElement.height = Math.floor(viewport.height * pixelRatio);
      canvasElement.style.removeProperty("width");
      canvasElement.style.removeProperty("height");
      canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      state = createAutomataState(viewport.width, viewport.height);
      refreshTextField(state);
      seedField(state);
      drawField(canvasContext, state, tick);
    }

    function animate(now: number) {
      if (now - lastFieldRefresh > 700) {
        refreshTextField(state);
        lastFieldRefresh = now;
      }

      if (!reducedMotion.matches && now - lastStep > STEP_INTERVAL_MS) {
        stepField(state);
        emitFromText(state, tick);
        emitFromEdges(state, tick);
        tick += 1;
        lastStep = now;
      }

      drawField(canvasContext, state, tick);
      animationFrame = window.requestAnimationFrame(animate);
    }

    resizeCanvas();
    animationFrame = window.requestAnimationFrame(animate);
    window.addEventListener("resize", resizeCanvas);
    reducedMotion.addEventListener("change", resizeCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      reducedMotion.removeEventListener("change", resizeCanvas);
    };
  }, [portalTarget]);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <canvas
      aria-hidden="true"
      className="automata-background"
      data-testid="shannon-automata-canvas"
      ref={canvasRef}
    />,
    portalTarget,
  );
}
