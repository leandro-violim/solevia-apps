// The audio recordings, bundled as base64 data URIs instead of separate files.
//
// WHY inline and not fetch a /audio/*.m4a file: iOS WKWebView (Capacitor) serves
// bundled files to <img>/<script>/<audio> element loads, but `fetch()` of a local
// asset through the custom capacitor:// scheme FAILS — so the old fetch-then-
// decodeAudioData path left every recording silent on iPhone (the synth fallback
// still played, which is why menu music worked but the crowd/whistle never did).
// A `?inline` import hands us the bytes as a data: URI baked into the JS bundle, so
// there is no WebView request to fail and decodeAudioData works on every platform.
//
// The files are small (~100 KB total); Vite `?inline` forces inlining regardless of
// the asset size limit. Decoding stays lazy (see samples.ts) — only the bytes are
// eager, not the decode.

import whistle from "../assets/audio/whistle.m4a?inline";
import cheerGoal from "../assets/audio/cheer-goal.m4a?inline";
import cheerWin from "../assets/audio/cheer-win.m4a?inline";
import cheerNear from "../assets/audio/cheer-near.m4a?inline";
import ambStadium from "../assets/audio/amb-stadium.m4a?inline";
import ambChant from "../assets/audio/amb-chant.m4a?inline";
import flick1 from "../assets/audio/flick-1.m4a?inline";
import flick2 from "../assets/audio/flick-2.m4a?inline";
import flick3 from "../assets/audio/flick-3.m4a?inline";
import flick4 from "../assets/audio/flick-4.m4a?inline";
import clack1 from "../assets/audio/clack-1.m4a?inline";
import clack2 from "../assets/audio/clack-2.m4a?inline";
import clack3 from "../assets/audio/clack-3.m4a?inline";

/** Sample id (as used across the audio code) → base64 `data:` URI of its bytes. */
export const SAMPLE_DATA: Record<string, string> = {
  whistle,
  "cheer-goal": cheerGoal,
  "cheer-win": cheerWin,
  "cheer-near": cheerNear,
  "amb-stadium": ambStadium,
  "amb-chant": ambChant,
  "flick-1": flick1,
  "flick-2": flick2,
  "flick-3": flick3,
  "flick-4": flick4,
  "clack-1": clack1,
  "clack-2": clack2,
  "clack-3": clack3,
};

/** Decode a base64 `data:` URI to raw bytes — no fetch, works under any scheme. */
export const dataUriToBytes = (uri: string): ArrayBuffer => {
  const base64 = uri.slice(uri.indexOf(",") + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};
