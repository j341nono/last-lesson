import { it, expect } from "vitest";
import { splitText } from "../src/components/Pager";
import { events } from "../src/game/scenarios";
it("turns every authored scene into short cuts without losing the story", () => {
  for (const e of events)
    for (const text of [e.text, ...e.actions.map((a) => a.result)]) {
      const cuts = splitText(text, 44);
      expect(cuts.join("")).toBe(text);
      expect(cuts.every((c) => Array.from(c).length <= 44)).toBe(true);
    }
});
