// "Play anywhere" surfaces the game can be played on. No photos — each is an
// original stylised surface + line treatment, so the caps read as being flicked
// on grass, a school desk, a wooden table, or a cement floor.

export type PitchTexture = "stripes" | "wood" | "concrete";

export type PitchStyle = {
  id: string;
  name: string;
  base: string; // primary surface fill
  base2: string; // secondary tone (mown stripe / wood grain / concrete mottle)
  edge: string; // darker tint for the depth vignette
  line: string; // markings colour
  lineAlpha: number; // markings opacity — 1 painted, lower reads as chalk/pencil
  texture: PitchTexture;
};

export const PITCH_STYLES: PitchStyle[] = [
  { id: "grass", name: "Grass", base: "#46cf6d", base2: "#3cbb61", edge: "#0a2814", line: "#f6fff9", lineAlpha: 1, texture: "stripes" },
  { id: "school", name: "School", base: "#e3b787", base2: "#d4a468", edge: "#7a4e22", line: "#fbf5ea", lineAlpha: 0.82, texture: "wood" },
  { id: "table", name: "Table", base: "#7d5636", base2: "#6a4527", edge: "#2c1a0d", line: "#f3e7d5", lineAlpha: 0.78, texture: "wood" },
  { id: "cement", name: "Cement", base: "#b7bcbd", base2: "#a6acad", edge: "#4c5254", line: "#fdf6d8", lineAlpha: 0.7, texture: "concrete" },
];

export const DEFAULT_PITCH_STYLE = "grass";

export const pitchStyleById = (id: string): PitchStyle =>
  PITCH_STYLES.find((s) => s.id === id) ?? PITCH_STYLES[0];
