import { memo } from "react";
import bubbleImg from "../assets/bubble.png";

type Props = {
  x: number;
  y: number;
  size: number;
  popped: boolean;
  driftDelay: number;
  onPop: () => void;
};

/** One glossy plastic bubble. Uses a shared PNG for the realistic look. */
export const Bubble = memo(function Bubble({
  x,
  y,
  size,
  popped,
  driftDelay,
  onPop,
}: Props) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        if (!popped) onPop();
      }}
      className="absolute select-none touch-manipulation focus:outline-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: popped ? "scale(1.4)" : "scale(1)",
        opacity: popped ? 0 : 1,
        transition:
          "transform 180ms cubic-bezier(.34,1.56,.64,1), opacity 180ms ease-out",
        pointerEvents: popped ? "none" : "auto",
        animation: popped
          ? undefined
          : `bubbleFloat 4s ease-in-out ${driftDelay}s infinite`,
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label="Pop bubble"
    >
      <img
        src={bubbleImg}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.12))",
          pointerEvents: "none",
        }}
      />
    </button>
  );
});