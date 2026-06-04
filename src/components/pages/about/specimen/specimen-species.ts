import {
  BLINKER,
  BLOCK,
  GLIDER,
  LIGHTWEIGHT_SPACESHIP,
  PULSAR,
  type Pattern,
} from "../automata/automata-model";

export const SPECIMEN_CELL_SIZE = 7;
export const SPECIMEN_COLS = 17;
export const SPECIMEN_ROWS = 17;
export const STEP_INTERVAL_MS = 82;
export const CYCLE_INTERVAL_MS = 5000;
export const FADE_DURATION_MS = 600;

export type SpeciesVariable = {
  meaning: string;
  symbol: string;
};

export type Species = {
  explanation: string;
  figureNumber: number;
  formula: string;
  name: string;
  originX: number;
  originY: number;
  pattern: Pattern;
  variables: readonly SpeciesVariable[];
};

export const SPECIES: ReadonlyArray<Species> = [
  {
    explanation: "A diagonal traveler that advances one cell every four ticks.",
    figureNumber: 1,
    formula: String.raw`v = \dfrac{c}{4}`,
    name: "glider",
    originX: 6,
    originY: 6,
    pattern: GLIDER,
    variables: [
      { symbol: "v", meaning: "velocity of the moving pattern" },
      { symbol: "c", meaning: "one cell per tick, the natural grid speed" },
    ],
  },
  {
    explanation: "An orthogonal spaceship moving at half the grid speed.",
    figureNumber: 2,
    formula: String.raw`v = \dfrac{c}{2}`,
    name: "lightweight spaceship",
    originX: 4,
    originY: 7,
    pattern: LIGHTWEIGHT_SPACESHIP,
    variables: [
      { symbol: "v", meaning: "velocity of the moving pattern" },
      { symbol: "c", meaning: "one cell per tick, the natural grid speed" },
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

export function figureLabel(species: Species) {
  return `Fig.${species.figureNumber} ${species.name}`;
}
