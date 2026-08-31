/**
 * F7 — calm ambient music. Loops "Calm Piano" by Alex Morgan (Pixabay Content
 * License — free for commercial use, no attribution required; using it as
 * in-game background music is a permitted use). Plays on Home + between phases +
 * the finish screen; NOT during active popping. Low volume, fades in/out, loops.
 *
 * Uses an HTMLAudioElement (loop) with volume fades. Lazy: the file only fetches
 * when music first plays, so it never blocks first paint. Muteable + persisted
 * (`zb_music_off`, default ON). iOS won't start audio without a user gesture, so
 * the first play() is armed to retry on the next tap. Recovers after backgrounding.
 */
import homeLoop from "../assets/audio/home-loop.m4a";

const KEY = "zb_music_off";
const TARGET_VOL = 0.32; // low, ambient
const FADE_IN_MS = 1100;
const FADE_OUT_MS = 700;

let el: HTMLAudioElement | null = null;
let fadeRaf = 0;
let wantPlaying = false; // do we currently want music audible?
let armed = false;
let muted = false;
try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
} catch {
  /* storage unavailable */
}

function getEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio(homeLoop);
    el.loop = true;
    el.preload = "none"; // don't fetch until we actually play
    el.volume = 0;
  }
  return el;
}

function fadeTo(target: number, ms: number, onDone?: () => void) {
  const a = getEl();
  if (!a) return;
  cancelAnimationFrame(fadeRaf);
  const from = a.volume;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    a.volume = Math.max(0, Math.min(1, from + (target - from) * t));
    if (t < 1) fadeRaf = requestAnimationFrame(step);
    else onDone?.();
  };
  fadeRaf = requestAnimationFrame(step);
}

function armGestureStart() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const start = () => {
    armed = false;
    window.removeEventListener("pointerdown", start);
    if (wantPlaying && !muted) fadeMusicIn();
  };
  window.addEventListener("pointerdown", start, { once: true, passive: true });
}

export function isMusicEnabled(): boolean {
  return !muted;
}

export function fadeMusicIn(): void {
  wantPlaying = true;
  if (muted) return;
  const a = getEl();
  if (!a) return;
  a.play()
    .then(() => fadeTo(TARGET_VOL, FADE_IN_MS))
    .catch(() => armGestureStart()); // iOS: retry on the next user gesture
}

export function fadeMusicOut(): void {
  wantPlaying = false;
  if (!el) return;
  const a = el;
  fadeTo(0, FADE_OUT_MS, () => {
    try {
      a.pause();
    } catch {
      /* ignore */
    }
  });
}

export function setMusicEnabled(on: boolean): void {
  muted = !on;
  try {
    localStorage.setItem(KEY, on ? "0" : "1");
  } catch {
    /* ignore */
  }
  if (on) fadeMusicIn();
  else fadeMusicOut();
}

// Resume music after the app/tab returns to the foreground (if we still want it).
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wantPlaying && !muted && el?.paused) {
      fadeMusicIn();
    }
  });
}
