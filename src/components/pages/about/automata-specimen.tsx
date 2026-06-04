import katex from "katex";

import { useSpecimenController } from "./specimen/use-specimen-controller";
import {
  SPECIMEN_CELL_SIZE,
  SPECIMEN_COLS,
  SPECIMEN_ROWS,
  figureLabel,
} from "./specimen/specimen-species";

export function AutomataSpecimen() {
  const specimen = useSpecimenController();
  const { species } = specimen;
  const formulaHtml = katex.renderToString(species.formula, {
    displayMode: false,
    throwOnError: false,
  });

  return (
    <div className="automata-spawner-shell mx-auto w-fit space-y-5 pt-14 sm:pt-16">
      <div className="automata-spawner-stage">
        <div
          aria-describedby={specimen.tooltipOpen ? specimen.tooltipId : undefined}
          aria-label={`${figureLabel(species)} automata specimen`}
          className="automata-specimen-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          data-automata-blocker="spawner"
          onBlur={specimen.hideTooltip}
          onFocus={specimen.showTooltip}
          onMouseEnter={specimen.showTooltip}
          onMouseLeave={specimen.hideTooltip}
          style={specimen.controlStyle}
          tabIndex={0}
        >
          <div className="automata-specimen-figure-label">
            {figureLabel(species)}
          </div>
          <div className="automata-specimen-body">
            <canvas
              aria-hidden="true"
              ref={specimen.canvasRef}
              style={{
                display: "block",
                height: `${SPECIMEN_ROWS * SPECIMEN_CELL_SIZE}px`,
                width: `${SPECIMEN_COLS * SPECIMEN_CELL_SIZE}px`,
              }}
            />
          </div>
          <div
            aria-hidden="true"
            className="automata-specimen-formula"
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
        </div>

        {specimen.tooltipOpen ? (
          <div
            className="automata-specimen-tooltip motion-popover"
            data-side={specimen.tooltipSide}
            id={specimen.tooltipId}
            role="tooltip"
          >
            <div
              className="automata-specimen-tooltip-formula"
              dangerouslySetInnerHTML={{ __html: formulaHtml }}
            />
            <p>{species.explanation}</p>
            <dl>
              {species.variables.map((variable) => (
                <div key={variable.symbol}>
                  <dt>{variable.symbol}</dt>
                  <dd>{variable.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
