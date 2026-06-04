import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type { AutomataState } from "../automata/automata-model";
import {
  captureVisualGeneration,
  type AutomataVisualState,
} from "../automata/rendering/automata-visual-state";
import {
  createSpecimenVisualState,
  createSpecimenState,
  drawSpecimen,
  seedSpecies,
  stepSpecimen,
} from "./specimen-simulation";
import {
  CYCLE_INTERVAL_MS,
  FADE_DURATION_MS,
  SPECIES,
  SPECIMEN_CELL_SIZE,
  SPECIMEN_COLS,
  SPECIMEN_ROWS,
  STEP_INTERVAL_MS,
} from "./specimen-species";

type TooltipSide = "left" | "right";

export function useSpecimenController() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<AutomataState>(createSpecimenState());
  const visualStateRef = useRef<AutomataVisualState>(
    createSpecimenVisualState(stateRef.current),
  );
  const speciesIndexRef = useRef(0);
  const tooltipOpenRef = useRef(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const tooltipId = useId();
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [speciesIndex, setSpeciesIndex] = useState(0);
  const [tooltipSide, setTooltipSide] = useState<TooltipSide>("right");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const species = SPECIES[speciesIndex];

  const advanceSpecies = useCallback(() => {
    const next = (speciesIndexRef.current + 1) % SPECIES.length;
    speciesIndexRef.current = next;
    setSpeciesIndex(next);
  }, []);

  useEffect(() => {
    tooltipOpenRef.current = tooltipOpen;

    if (tooltipOpen) {
      clearTimeout(fadeTimeoutRef.current);
      setCanvasOpacity(1);
    }
  }, [tooltipOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const canvasContext = context;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let lastRender = performance.now();
    let lastStep = 0;

    canvas.width = Math.floor(
      SPECIMEN_COLS * SPECIMEN_CELL_SIZE * pixelRatio,
    );
    canvas.height = Math.floor(
      SPECIMEN_ROWS * SPECIMEN_CELL_SIZE * pixelRatio,
    );
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    stateRef.current = createSpecimenState();
    seedSpecies(stateRef.current, species);
    visualStateRef.current = createSpecimenVisualState(stateRef.current);

    function animate(now: number) {
      const deltaMs = Math.min(now - lastRender, 48);
      lastRender = now;

      if (!reducedMotion.matches && now - lastStep > STEP_INTERVAL_MS) {
        stepSpecimen(stateRef.current);
        captureVisualGeneration(visualStateRef.current, stateRef.current);
        lastStep = now;
      }

      drawSpecimen(
        canvasContext,
        stateRef.current,
        visualStateRef.current,
        reducedMotion.matches ? 1000 / 300 : deltaMs,
      );
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [species]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = setInterval(() => {
      if (tooltipOpenRef.current) {
        return;
      }

      if (reducedMotion.matches) {
        advanceSpecies();
        return;
      }

      setCanvasOpacity(0);
      fadeTimeoutRef.current = setTimeout(() => {
        if (tooltipOpenRef.current) {
          setCanvasOpacity(1);
          return;
        }

        advanceSpecies();
        setCanvasOpacity(1);
      }, FADE_DURATION_MS);
    }, CYCLE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimeoutRef.current);
    };
  }, [advanceSpecies]);

  const showTooltip = useCallback(() => {
    setTooltipSide(tooltipSideFor(canvasRef.current));
    setTooltipOpen(true);
  }, []);

  return {
    canvasRef,
    controlStyle: {
      "--specimen-opacity": canvasOpacity,
    } as CSSProperties,
    hideTooltip: () => setTooltipOpen(false),
    showTooltip,
    species,
    tooltipId,
    tooltipOpen,
    tooltipSide,
  };
}

function tooltipSideFor(canvas: HTMLCanvasElement | null): TooltipSide {
  const rect = canvas
    ?.closest<HTMLElement>("[data-automata-blocker='spawner']")
    ?.getBoundingClientRect();

  if (!rect) {
    return "right";
  }

  return window.innerWidth - rect.right >= rect.left ? "right" : "left";
}
