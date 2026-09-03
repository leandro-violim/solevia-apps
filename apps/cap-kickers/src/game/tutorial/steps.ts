export type TutorialStep = { id: string; title: string; body: string };

// Copy lives in i18n (tutorial.<id>.title / .body); title/body here are only the
// English fallback used if a key is ever missing. Scene art is keyed by `id` in
// routes/tutorial.tsx, so adding/removing a step also needs a scene case there.
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Meet your team",
    body: "You play with three bottle caps. Flick them up the pitch and score in the goal to win.",
  },
  {
    id: "middle",
    title: "Start with the middle cap",
    body: "Every turn, take your FIRST flick with the middle cap. It sits between the other two, so it has the clearest lane forward.",
  },
  {
    id: "flick",
    title: "Flick, don't aim",
    body: "Flick a cap with your finger — the faster and harder you flick, the farther it travels. No arrows, no aiming.",
  },
  {
    id: "thread",
    title: "Pass between your caps",
    body: "A flick only counts if the cap passes BETWEEN your other two caps. Miss that gap and you lose your turn.",
  },
  {
    id: "advance",
    title: "Five touches to the goal",
    body: "You get five touches per turn. Keep threading between your caps to work up the pitch — the goal stays locked until your 4th touch.",
  },
  {
    id: "shoot",
    title: "Shoot on touch 4 or 5",
    body: "Only your 4th and 5th touches can score. Touch 4 is a risky early shot — the keeper almost always saves it, but a rebound that stays in play earns you touch 5. On touch 5, thread the shot between your two caps to slip past the keeper.",
  },
];

export const stepCount = TUTORIAL_STEPS.length;
export const isLastStep = (index: number): boolean => index === stepCount - 1;
