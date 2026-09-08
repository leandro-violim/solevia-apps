// Every store asset size we ship, in one place.
//
// px = the exact pixel file the store wants. logical x dpr must equal px, or
// capture.mjs refuses to run — that guard is the whole point of this file.
//
// Apple sizes verified against developer.apple.com screenshot specifications
// on 2026-09-06. NOTE: the 6.9" slot is 1320x2868. The assets shipped with 1.1
// are 1290x2796, which is the 6.7" size — confirm in ASC Media Manager which
// slot they actually occupy before assuming ours are right.
export const DEVICES = [
  // --- App Store ---------------------------------------------------------
  // 6.9" is required unless you supply 6.5". Supplying 6.9" lets every smaller
  // iPhone size scale down from it, so this one file covers the whole iPhone range.
  { store: 'appstore', id: 'iphone-6.9', px: [1320, 2868], logical: [440, 956], dpr: 3, mobile: true },
  // Belt and braces: upload 6.5" too so nothing depends on Apple's scaler.
  { store: 'appstore', id: 'iphone-6.5', px: [1284, 2778], logical: [428, 926], dpr: 3, mobile: true },
  // Required because the app runs on iPad. 11"/10.5"/9.7" scale from this.
  { store: 'appstore', id: 'ipad-13',    px: [2064, 2752], logical: [1032, 1376], dpr: 2, mobile: false },

  // --- Google Play -------------------------------------------------------
  // Phone: min 2, up to 8. >=4 at >=1080px keeps promotional eligibility.
  { store: 'play', id: 'phone',     px: [1080, 1920], logical: [360, 640], dpr: 3, mobile: true },
  // Tablets: min 4 each, 16:9 or 9:16, 1080-7680px.
  { store: 'play', id: 'tablet-7',  px: [1200, 1920], logical: [600, 960], dpr: 2, mobile: true },
  { store: 'play', id: 'tablet-10', px: [1440, 2560], logical: [720, 1280], dpr: 2, mobile: false },
];

export const LOCALES = ['en', 'pt-BR', 'es'];

// Route -> output basename. Reorder freely; the numeric prefix is the store order.
// REVISIT after the new UI lands: routes may be renamed or added.
export const ROUTES = [
  ['01-home',        '/'],
  ['02-gameplay',    '/play'],
  ['03-reward-road', '/campaign'],
  ['05-cabinet',     '/cabinet'],
  ['06-how-to-play', '/tutorial'],
];
// Scene 4 of COWORK-CAPTURE-BRIEF.md ("reward moment" / Unlocked! celebration)
// needs a real phase win and cannot be scripted. Capture it by hand if wanted.
