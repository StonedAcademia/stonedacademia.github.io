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
import {
  captureVisualGeneration,
  createVisualState,
} from "./automata/rendering/automata-visual-state";
import { refreshTextField } from "./automata/automata-text-field";
import { AutomataTextBridge } from "./automata/text/automata-text-bridge";

/** Delay between Conway generations for the background field. */
const STEP_INTERVAL_MS = 110;

/**
 * Full-viewport canvas that lets Conway-style patterns interact with page text.
 *
 * @remarks
 * The canvas is portaled to `document.body` so it can sit behind every page
 * section while the component remains owned by the about page.
 */
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
    let lastRender = performance.now();
    let lastStep = 0;
    let tick = 0;
    const bridge = new AutomataTextBridge();
    let state = createAutomataState(
      viewportSize().width,
      viewportSize().height,
    );
    let visualState = createVisualState(state);

    /**
     * Rebuilds canvas backing pixels, simulation arrays, text masks, and visuals.
     */
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
      bridge.init(state);
      seedField(state);
      visualState = createVisualState(state);
      lastRender = performance.now();
      lastStep = performance.now();
      drawField(canvasContext, state, tick, visualState, 1000 / 300);
    }

    /** Runs render frames continuously and simulation steps at a lower cadence. */
    function animate(now: number) {
      const deltaMs = Math.min(now - lastRender, 48);
      lastRender = now;

      if (now - lastFieldRefresh > 700) {
        refreshTextField(state);
        bridge.init(state);
        captureVisualGeneration(visualState, state);
        lastFieldRefresh = now;
      }

      if (!reducedMotion.matches && now - lastStep > STEP_INTERVAL_MS) {
        stepField(state);
        bridge.update(state, tick);
        emitFromText(state, tick);
        emitFromEdges(state, tick);
        captureVisualGeneration(visualState, state);
        tick += 1;
        lastStep = now;
      }

      drawField(
        canvasContext,
        state,
        tick,
        visualState,
        reducedMotion.matches ? 1000 / 300 : deltaMs,
      );
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
      bridge.destroy();
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
