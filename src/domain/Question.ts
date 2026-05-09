import type { Op } from "./tables";

export interface Question {
  readonly a: number;
  readonly b: number;
  readonly op: Op;
  readonly answer: number;
  readonly choices: readonly number[];
}
