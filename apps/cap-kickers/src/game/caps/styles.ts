// Generic, original bottle-cap styles the player can choose from. No real
// brands — each is an original color + shape treatment.

export type CapPattern = "crown" | "ribbed" | "ring" | "nub" | "plain";

export type CapStyle = {
  id: string;
  name: string;
  base: string; // main body color
  rim: string; // lighter crimped-rim color
  shade: string; // darker edge/shade color
  top: string; // accent color for the top marking
  pattern: CapPattern;
};

export const CAP_STYLES: CapStyle[] = [
  { id: "soda-blue", name: "Soda", base: "#2f7bff", rim: "#a9cbff", shade: "#1f57c8", top: "#ffffff", pattern: "ribbed" },
  { id: "crown-red", name: "Crown", base: "#ff5a3c", rim: "#ffb7a8", shade: "#c8341c", top: "#ffe08a", pattern: "crown" },
  { id: "spring-teal", name: "Spring", base: "#18c2b4", rim: "#a6f0e9", shade: "#0e8f85", top: "#ffffff", pattern: "ring" },
  { id: "sport-orange", name: "Sport", base: "#ff9f1c", rim: "#ffd79a", shade: "#d67d00", top: "#3a2400", pattern: "nub" },
  { id: "retro-gold", name: "Retro", base: "#e0b64a", rim: "#f6e2a3", shade: "#a9832a", top: "#7a5a15", pattern: "ring" },
  { id: "neon-pink", name: "Neon", base: "#ff3db5", rim: "#ffb0e0", shade: "#c81f86", top: "#fff0fb", pattern: "crown" },
  { id: "grape-purple", name: "Grape", base: "#8b5cf6", rim: "#cdb8fb", shade: "#6a3fd0", top: "#ffffff", pattern: "ribbed" },
  { id: "lime-green", name: "Lime", base: "#57c927", rim: "#bcf29a", shade: "#3d9614", top: "#0f3a00", pattern: "nub" },
  // Matches the real brass beer cap the icon is built from.
  { id: "brass-gold", name: "Gold", base: "#d4b24e", rim: "#f4e3a0", shade: "#9a7526", top: "#5a3f0a", pattern: "crown" },
];

export const DEFAULT_PLAYER_STYLE = "soda-blue";
export const DEFAULT_OPPONENT_STYLE = "crown-red";

export const styleById = (id: string): CapStyle =>
  CAP_STYLES.find((s) => s.id === id) ?? CAP_STYLES[0];

/** A contrasting opponent cap for the player's chosen style. */
export const opponentFor = (playerId: string): CapStyle =>
  playerId === DEFAULT_OPPONENT_STYLE ? styleById(DEFAULT_PLAYER_STYLE) : styleById(DEFAULT_OPPONENT_STYLE);
