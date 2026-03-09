/**
 * Pure metric calculation functions — no side effects, easy to unit test.
 */

/**
 * Words per minute using the standard 5-chars-per-word convention.
 * Only counts correctly typed characters.
 */
export function calcWpm(correctChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds < 1) return 0;
  return Math.round((correctChars / 5) / (elapsedSeconds / 60));
}

/**
 * Ratio of correctly typed characters to total characters typed so far.
 * Measures raw keystroke accuracy (not backspace-corrected).
 */
export function calcAccuracy(typed: string, target: string): number {
  if (typed.length === 0) return 1;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return correct / typed.length;
}

/**
 * Number of correctly typed characters at their exact position.
 */
export function countCorrectChars(typed: string, target: string): number {
  let count = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) count++;
  }
  return count;
}

/**
 * Character-level diff between typed input and target sentence.
 * Used to render the coloured typing area.
 */
export type CharState = "pending" | "correct" | "incorrect";

export function getCharStates(typed: string, target: string): CharState[] {
  return target.split("").map((char, i) => {
    if (i >= typed.length) return "pending";
    return typed[i] === char ? "correct" : "incorrect";
  });
}
