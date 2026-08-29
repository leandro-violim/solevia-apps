import { useEffect, useRef } from "react";
import { attachCanvas, detachCanvas, resizeCanvas } from "../lib/pop-particles";

/**
 * The pop-burst canvas overlay. Sits above the bubbles inside the play field
 * (pointer-events:none so it never blocks a tap) and stays sized to the field
 * via a ResizeObserver. All particle animation happens in pop-particles.ts on a
 * single rAF loop — this component only owns the canvas element's lifecycle, so
 * particle updates never trigger a React re-render.
 */
export function PopParticles({ fieldRef }: { fieldRef: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const field = fieldRef.current;
    if (!cv || !field) return;
    attachCanvas(cv);
    const doResize = () => resizeCanvas(field.clientWidth, field.clientHeight);
    doResize();
    const ro = new ResizeObserver(doResize);
    ro.observe(field);
    return () => {
      ro.disconnect();
      detachCanvas(cv);
    };
  }, [fieldRef]);

  return (
    <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
  );
}
