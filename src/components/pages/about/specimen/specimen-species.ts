import {
  BLINKER,
  BLOCK,
  GLIDER,
  LIGHTWEIGHT_SPACESHIP,
  PULSAR,
  type Pattern,
} from "../automata/automata-model";

/** Pixel size for cells in the specimen canvas. */
export const SPECIMEN_CELL_SIZE = 7;
/** Fixed specimen canvas columns. */
export const SPECIMEN_COLS = 17;
/** Fixed specimen canvas rows. */
export const SPECIMEN_ROWS = 17;
/** Delay between Conway generations in the specimen canvas. */
export const STEP_INTERVAL_MS = 110;
/** Delay between automatic specimen changes. */
export const CYCLE_INTERVAL_MS = 6500;
/** Fade duration used when transitioning between specimens. */
export const FADE_DURATION_MS = 900;

/** Formula variable explanation shown inside the specimen tooltip. */
export type SpeciesVariable = {
  /** Human-readable meaning for the symbol. */
  meaning: string;
  /** KaTeX-compatible symbol label. */
  symbol: string;
};

/** Metadata and seed position for a named Life specimen. */
export type Species = {
  /** Short prose explanation shown in the tooltip. */
  explanation: string;
  /** Figure number used by the visible specimen label. */
  figureNumber: number;
  /** KaTeX formula summarizing the specimen's behavior. */
  formula: string;
  /** Display name. */
  name: string;
  /** Pattern origin x coordinate inside the fixed specimen grid. */
  originX: number;
  /** Pattern origin y coordinate inside the fixed specimen grid. */
  originY: number;
  /** Relative live-cell coordinates to stamp into the specimen grid. */
  pattern: Pattern;
  /** Variables referenced by the displayed formula. */
  variables: readonly SpeciesVariable[];
};

/** Ordered carousel of specimens shown by the about-page mini-canvas. */
export const SPECIES: ReadonlyArray<Species> = [
  {
    explanation:
      "A diagonal traveler whose phase repeats after translating one cell every four ticks.",
    figureNumber: 1,
    formula: String.raw`\sigma(t+4)=T_{(1,1)}\sigma(t)`,
    name: "glider",
    originX: 6,
    originY: 6,
    pattern: GLIDER,
    variables: [
      { symbol: "sigma(t)", meaning: "the live-cell pattern at tick t" },
      {
        symbol: "T_(a,b)",
        meaning: "translation by a cells over and b cells down",
      },
    ],
  },
  {
    explanation:
      "An orthogonal spaceship whose phase repeats after translating two cells every four ticks.",
    figureNumber: 2,
    formula: String.raw`\sigma(t+4)=T_{(2,0)}\sigma(t)`,
    name: "lightweight spaceship",
    originX: 4,
    originY: 7,
    pattern: LIGHTWEIGHT_SPACESHIP,
    variables: [
      { symbol: "sigma(t)", meaning: "the live-cell pattern at tick t" },
      {
        symbol: "T_(a,b)",
        meaning: "translation by a cells over and b cells down",
      },
    ],
  },
  {
    explanation: "A period-two oscillator returning to itself every two ticks.",
    figureNumber: 3,
    formula: String.raw`\sigma(t+2) = \sigma(t)`,
    name: "blinker",
    originX: 7,
    originY: 8,
    pattern: BLINKER,
    variables: [
      { symbol: "sigma(t)", meaning: "cell state at tick t" },
      { symbol: "t", meaning: "the current discrete time step" },
    ],
  },
  {
    explanation: "A period-three oscillator with a larger repeating orbit.",
    figureNumber: 4,
    formula: String.raw`\sigma(t+3) = \sigma(t)`,
    name: "pulsar",
    originX: 2,
    originY: 2,
    pattern: PULSAR,
    variables: [
      { symbol: "sigma(t)", meaning: "cell state at tick t" },
      { symbol: "t", meaning: "the current discrete time step" },
    ],
  },
  {
    explanation: "A still life whose cells remain unchanged after each tick.",
    figureNumber: 5,
    formula: String.raw`\sigma(t+1) = \sigma(t)`,
    name: "block",
    originX: 7,
    originY: 7,
    pattern: BLOCK,
    variables: [
      { symbol: "sigma(t)", meaning: "cell state at tick t" },
      { symbol: "t", meaning: "the current discrete time step" },
    ],
  },
];

/** Formats the compact label used by both the control and its ARIA label. */
export function figureLabel(species: Species) {
  return `Fig.${species.figureNumber} ${species.name}`;
}
