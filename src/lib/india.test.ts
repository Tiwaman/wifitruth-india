import { expect, it } from "vitest";
import { inIndiaBbox } from "./india";

it("accepts Indian cities and rejects outside points", () => {
  expect(inIndiaBbox(32.0098, 77.3149)).toBe(true);
  expect(inIndiaBbox(15.5, 73.8)).toBe(true);
  expect(inIndiaBbox(51.5, -0.12)).toBe(false);
  expect(inIndiaBbox(NaN, 77)).toBe(false);
});
