/**
 * TEMPORARY evaluation switcher — 6 candidate Pop-for-Fun playfield backgrounds
 * (all realistic bubble-wrap, pushed behind the interactive bubbles in different
 * tones/treatments). Lets Leandro flip between them live on device and pick the
 * one where the poppable bubbles read best. Once a winner is chosen we lock it as
 * the default and remove this toggle. Only the SELECTED field image is decoded
 * (the imports are just URL strings; the browser fetches an image when it becomes
 * a background). Also a small interactive-bubble style toggle for pairing.
 */
import dimblurNeutral from "../assets/scene/fields/dimblur-neutral.webp";
import dimblurAqua from "../assets/scene/fields/dimblur-aqua.webp";
import ghostWhite from "../assets/scene/fields/ghost-white.webp";
import ghostCream from "../assets/scene/fields/ghost-cream.webp";
import crispNeutral from "../assets/scene/fields/crisp-neutral.webp";
import crispAqua from "../assets/scene/fields/crisp-aqua.webp";

export type FieldStyle = { id: string; name: string; img: string };
export const FIELDS: FieldStyle[] = [
  { id: "dimblur-neutral", name: "dimblur-neutral", img: dimblurNeutral },
  { id: "dimblur-aqua", name: "dimblur-aqua", img: dimblurAqua },
  { id: "ghost-white", name: "ghost-white", img: ghostWhite },
  { id: "ghost-cream", name: "ghost-cream", img: ghostCream },
  { id: "crisp-neutral", name: "crisp-neutral", img: crispNeutral },
  { id: "crisp-aqua", name: "crisp-aqua", img: crispAqua },
];

const FKEY = "zb_field_style";
export function getFieldIndex(): number {
  try {
    const v = parseInt(localStorage.getItem(FKEY) || "0", 10);
    return Number.isFinite(v) ? ((v % FIELDS.length) + FIELDS.length) % FIELDS.length : 0;
  } catch {
    return 0;
  }
}
export function setFieldIndex(i: number): void {
  try {
    localStorage.setItem(FKEY, String(((i % FIELDS.length) + FIELDS.length) % FIELDS.length));
  } catch {
    /* ignore */
  }
}

export const BUBBLE_STYLES = ["plain", "shadow", "frost", "rim"] as const;
export type BubbleStyle = (typeof BUBBLE_STYLES)[number];

const BKEY = "zb_bubble_style";
export function getBubbleStyle(): BubbleStyle {
  try {
    const v = localStorage.getItem(BKEY);
    return (BUBBLE_STYLES as readonly string[]).includes(v || "") ? (v as BubbleStyle) : "plain";
  } catch {
    return "plain";
  }
}
export function setBubbleStyle(s: BubbleStyle): void {
  try {
    localStorage.setItem(BKEY, s);
  } catch {
    /* ignore */
  }
}
