export interface Question {
  readonly a: number;
  readonly b: number;
  readonly answer: number;
  readonly choices: readonly number[];
}
