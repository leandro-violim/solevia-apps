export type TutorialStep = { id: string; title: string; body: string };

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Cap Kickers",
    body: "Flick your bottle caps across the pitch and score in the goal. Here's the trick to it.",
  },
  {
    id: "select",
    title: "Pick a cap",
    body: "You control three caps. Tap one to select it — a gold ring shows which is active.",
  },
  {
    id: "thread",
    title: "Thread the gap",
    body: "Swipe to flick the selected cap so it passes BETWEEN your other two caps. Miss the gap and you lose your turn.",
  },
  {
    id: "advance",
    title: "Advance up the pitch",
    body: "You get four touches per turn. Keep threading the gap to work the caps toward the goal.",
  },
  {
    id: "shoot",
    title: "Shoot!",
    body: "On your fourth touch, fire at the goal and beat the keeper. First to the goal target wins the match.",
  },
];

export const stepCount = TUTORIAL_STEPS.length;
export const isLastStep = (index: number): boolean => index === stepCount - 1;
