export type TutorialStep = { id: string; title: string; body: string };

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Cap Kickers",
    body: "Flick your bottle caps across the pitch and score in the goal. Here's the trick to it.",
  },
  {
    id: "flick",
    title: "Flick, don't aim",
    body: "You control three caps. Just flick one with your finger — the quicker and harder the flick, the farther it goes. A gentle flick barely moves it, so no arrows, no aiming.",
  },
  {
    id: "thread",
    title: "Thread the gap",
    body: "Flick a cap so it passes BETWEEN your other two caps. Miss the gap and you lose your turn.",
  },
  {
    id: "advance",
    title: "Advance up the pitch",
    body: "You get five touches per turn. Keep threading the gap to work the caps toward the goal.",
  },
  {
    id: "shoot",
    title: "Shoot!",
    body: "On your fifth touch the gate opens — fire at the goal and beat the keeper. First to the goal target wins the match.",
  },
];

export const stepCount = TUTORIAL_STEPS.length;
export const isLastStep = (index: number): boolean => index === stepCount - 1;
