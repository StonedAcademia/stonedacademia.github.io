import {
  layout,
  prepare,
  type PreparedText,
  type PrepareOptions,
} from "@chenglou/pretext";
import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/** HTML elements this wrapper can safely measure and create dynamically. */
type MeasuredTextElement =
  | "div"
  | "footer"
  | "h1"
  | "h2"
  | "h3"
  | "li"
  | "p"
  | "span";

/** Layout information exported to CSS so text motion reserves stable space. */
type PretextMetrics = {
  /** Pixel height computed from pretext line layout. */
  height: number;
  /** Number of wrapped lines at the element's current width. */
  lineCount: number;
  /** Indicates that the first browser measurement has completed. */
  ready: boolean;
};

/** Props for measured text that can animate with the site's motion classes. */
type PretextTextProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Motion timing variant, reflected in the generated CSS class. */
  animation?: "body" | "heading" | "meta";
  /** Element tag to create while retaining one measurement implementation. */
  as?: MeasuredTextElement;
  /** Optional rendered content when Markdown children differ from raw text. */
  children?: ReactNode;
  /** Stagger index exposed as `--item-index`. */
  index?: number;
  /** Whether CSS should reserve the measured text height before reveal. */
  reserveHeight?: boolean;
  /** Plain text used for measurement and as default children. */
  text: string;
  /** Whitespace mode passed through to `@chenglou/pretext`. */
  whiteSpace?: PrepareOptions["whiteSpace"];
};

/**
 * Renders text with precomputed line metrics for stable reveal animations.
 *
 * @remarks
 * The component keeps semantic markup flexible through `as`, but always exports
 * the same CSS custom properties expected by the motion styles.
 */
export function PretextText({
  animation = "body",
  as = "p",
  children,
  className,
  index = 0,
  reserveHeight = true,
  style,
  text,
  whiteSpace = "normal",
  ...props
}: PretextTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const metrics = usePretextMetrics(ref, text, whiteSpace);
  const measuredStyle = {
    ...style,
    "--item-index": index,
    "--pretext-height": `${metrics.height}px`,
    "--pretext-lines": metrics.lineCount,
  } as CSSProperties;

  return createElement(
    as,
    {
      ...props,
      className: cn(
        "pretext-text",
        `pretext-text-${animation}`,
        className,
      ),
      "data-pretext-ready": metrics.ready ? "true" : undefined,
      "data-pretext-reserve": reserveHeight ? "true" : undefined,
      ref,
      style: measuredStyle,
    },
    children ?? text,
  );
}

/**
 * Measures a text node with pretext whenever its width, font, or content changes.
 *
 * @remarks
 * Browser layout provides width, computed styles provide the canvas font, and
 * the Font Loading API triggers a second pass after web fonts settle.
 */
function usePretextMetrics(
  ref: React.RefObject<HTMLElement | null>,
  text: string,
  whiteSpace: PrepareOptions["whiteSpace"],
): PretextMetrics {
  const [metrics, setMetrics] = useState<PretextMetrics>({
    height: 0,
    lineCount: 1,
    ready: false,
  });

  useEffect(() => {
    const element = ref.current;

    if (!element || !text || typeof Intl.Segmenter === "undefined") {
      return;
    }

    let animationFrame = 0;
    let prepared: PreparedText | undefined;
    let preparedKey = "";

    /** Batches expensive measurement work into the next animation frame. */
    function update(widthHint?: number) {
      cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const element = ref.current;

        if (!element) {
          return;
        }

        const width = Math.floor(widthHint ?? element.clientWidth);

        if (width <= 0) {
          return;
        }

        const styles = window.getComputedStyle(element);
        const lineHeight = lineHeightPixels(styles);
        const letterSpacing = pixelValue(styles.letterSpacing);
        const options: PrepareOptions = { whiteSpace };

        if (Number.isFinite(letterSpacing)) {
          options.letterSpacing = letterSpacing;
        }
        const font = styles.font || canvasFont(styles);
        const nextPreparedKey = [
          text,
          font,
          options.whiteSpace,
          options.letterSpacing ?? 0,
        ].join("\u0000");

        if (!prepared || preparedKey !== nextPreparedKey) {
          prepared = prepare(text, font, options);
          preparedKey = nextPreparedKey;
        }

        const result = layout(prepared, width, lineHeight);

        setMetrics({
          height: Math.max(1, result.lineCount) * lineHeight,
          lineCount: Math.max(1, result.lineCount),
          ready: true,
        });
      });
    }

    const observer = new ResizeObserver((entries) => {
      update(entries[0]?.contentRect.width);
    });
    observer.observe(element);
    update();

    const fontSet = (
      document as Document & { fonts?: { ready: Promise<unknown> } }
    ).fonts;
    void fontSet?.ready.then(() => update());

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [ref, text, whiteSpace]);

  return metrics;
}

/** Builds a canvas-compatible font shorthand when `computedStyle.font` is empty. */
function canvasFont(styles: CSSStyleDeclaration) {
  return [
    styles.fontStyle,
    styles.fontVariant,
    styles.fontWeight,
    styles.fontSize,
    styles.fontFamily,
  ].join(" ");
}

/** Resolves CSS line-height to pixels, with a readable fallback for `normal`. */
function lineHeightPixels(styles: CSSStyleDeclaration) {
  const lineHeight = pixelValue(styles.lineHeight);

  if (Number.isFinite(lineHeight)) {
    return lineHeight;
  }

  return pixelValue(styles.fontSize) * 1.45;
}

/** Parses a CSS pixel-like numeric value. */
function pixelValue(value: string) {
  return Number.parseFloat(value);
}
