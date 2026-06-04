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
} from "react";

import { cn } from "@/lib/utils";

type MeasuredTextElement =
  | "div"
  | "footer"
  | "h1"
  | "h2"
  | "h3"
  | "li"
  | "p"
  | "span";

type PretextMetrics = {
  height: number;
  lineCount: number;
  ready: boolean;
};

type AutomataTextProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  animation?: "body" | "heading" | "meta";
  as?: MeasuredTextElement;
  index?: number;
  reserveHeight?: boolean;
  text: string;
  whiteSpace?: PrepareOptions["whiteSpace"];
};

export function AutomataText({
  animation = "body",
  as = "p",
  className,
  index = 0,
  reserveHeight = true,
  style,
  text,
  whiteSpace = "normal",
  ...props
}: AutomataTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const metrics = usePretextMetrics(ref, text, whiteSpace);
  const measuredStyle = {
    ...style,
    "--item-index": index,
    "--pretext-height": `${metrics.height}px`,
    "--pretext-lines": metrics.lineCount,
  } as CSSProperties;

  const chars = [...text].map((char, i) => (
    <span key={i} data-automata-char={String(i)}>
      {char}
    </span>
  ));

  return createElement(
    as,
    {
      ...props,
      className: cn("pretext-text", `pretext-text-${animation}`, className),
      "data-pretext-ready": metrics.ready ? "true" : undefined,
      "data-pretext-reserve": reserveHeight ? "true" : undefined,
      ref,
      style: measuredStyle,
    },
    chars,
  );
}

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
        ].join(" ");

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

function canvasFont(styles: CSSStyleDeclaration) {
  return [
    styles.fontStyle,
    styles.fontVariant,
    styles.fontWeight,
    styles.fontSize,
    styles.fontFamily,
  ].join(" ");
}

function lineHeightPixels(styles: CSSStyleDeclaration) {
  const lineHeight = pixelValue(styles.lineHeight);

  if (Number.isFinite(lineHeight)) {
    return lineHeight;
  }

  return pixelValue(styles.fontSize) * 1.45;
}

function pixelValue(value: string) {
  return Number.parseFloat(value);
}
