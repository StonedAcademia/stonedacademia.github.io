import {
  type CSSProperties,
  type RefObject,
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
  type Species,
} from "./specimen-species";

/** Horizontal side used for the tooltip relative to the specimen control. */
type TooltipSide = "left" | "right";

/** Controller values consumed by the specimen view component. */
type SpecimenController = {
  /** Canvas ref used by the animation loop. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** CSS custom properties applied to the focusable specimen control. */
  controlStyle: CSSProperties;
  /** Closes the explanatory tooltip. */
  hideTooltip: () => void;
  /** Opens the tooltip and recalculates its preferred side. */
  showTooltip: () => void;
  /** Currently displayed specimen metadata. */
  species: Species;
  /** Stable id for `aria-describedby`. */
  tooltipId: string;
  /** Whether the tooltip is visible. */
  tooltipOpen: boolean;
  /** Side chosen for the tooltip to avoid viewport overflow. */
  tooltipSide: TooltipSide;
};

/**
 * Owns animation, cycling, tooltip, and canvas state for `AutomataSpecimen`.
 *
 * @remarks
 * React state only tracks UI-visible values; mutable simulation and visual
 * buffers live in refs so animation frames do not rerender the component.
 */
export function useSpecimenController(): SpecimenController {
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

  /** Advances to the next species while keeping the ref and React state aligned. */
  const advanceSpecies = useCallback(() => {
    const next = (speciesIndexRef.current + 1) % SPECIES.length;
    speciesIndexRef.current = next;
    setSpeciesIndex(next);
  }, []);

  /** Keeps timer callbacks aware of tooltip state without resubscribing. */
  useEffect(() => {
    tooltipOpenRef.current = tooltipOpen;

    if (tooltipOpen) {
      clearTimeout(fadeTimeoutRef.current);
      setCanvasOpacity(1);
    }
  }, [tooltipOpen]);

  /** Initializes the canvas for the active species and runs its animation loop. */
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

    // Backing pixels are scaled for crisp canvas rendering on high-DPI displays.
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

    /** Draws every frame and advances Conway generations when motion is allowed. */
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

  /** Cycles specimens automatically, pausing while the tooltip is being read. */
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

  /** Opens the tooltip on the side with the most viewport space. */
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

/** Chooses the tooltip side that is less likely to overflow the viewport. */
function tooltipSideFor(canvas: HTMLCanvasElement | null): TooltipSide {
  const rect = canvas
    ?.closest<HTMLElement>("[data-automata-blocker='spawner']")
    ?.getBoundingClientRect();

  if (!rect) {
    return "right";
  }

  return window.innerWidth - rect.right >= rect.left ? "right" : "left";
}
