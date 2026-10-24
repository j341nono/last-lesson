import { describe, it, expect } from "vitest";
import {
  advance,
  createGame,
  replay,
  validateScenarios,
} from "../src/game/engine";
import { classify } from "../src/game/lessons";
import { eventMap, events } from "../src/game/scenarios";
import { lessonsSchema } from "../src/game/model";
const kind = classify(["人を助けて", "嘘をつかない", "約束を守る"]);
describe("life simulation", () => {
  it("validates all 48 event nodes and lesson bounds", () => {
    expect(events).toHaveLength(48);
    expect(validateScenarios()).toEqual([]);
    expect(
      lessonsSchema.safeParse(kind.map((l) => ({ ...l, strength: 999 })))
        .success,
    ).toBe(false);
  });
  it("reproduces a life from its seed and initial rules", () => {
    expect(replay(kind, "test", "ルカ")).toEqual(replay(kind, "test", "ルカ"));
  });
  it("finishes 1000 distinct seeds with 20–28 unique events and causal prerequisites", () => {
    const reached = new Set<string>(),
      paths = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const g = replay(kind, `seed-${i}`, "ルカ");
      expect(g.ended).toBe(true);
      expect(g.history.length).toBeGreaterThanOrEqual(20);
      expect(g.history.length).toBeLessThanOrEqual(28);
      expect(new Set(g.history.map((h) => h.eventId)).size).toBe(
        g.history.length,
      );
      expect(g.age).toBeGreaterThanOrEqual(22);
      expect(g.age).toBeGreaterThanOrEqual(g.life - 0.1);
      let memories: string[] = [];
      for (const h of g.history) {
        reached.add(h.eventId);
        const e = eventMap[h.eventId];
        if (e.requires) expect(memories).toContain(e.requires);
        if (e.gate?.anyMemory)
          expect(e.gate.anyMemory.some((m) => memories.includes(m))).toBe(true);
        memories.push(h.memory);
        expect(h.reason.length).toBeGreaterThan(15);
      }
      paths.add(g.history.map((h) => h.eventId + h.action).join("|"));
    }
    expect(reached.size).toBe(48);
    expect(paths.size).toBeGreaterThan(950);
  });
  it("changes behavior significantly with different teachings", () => {
    const power = classify(["力で世界を支配する", "戦いに勝つ", "破壊する"]);
    let rescueA = 0,
      rescueB = 0,
      harmA = 0,
      harmB = 0;
    for (let i = 0; i < 300; i++) {
      const a = replay(kind, `compare-${i}`, "a"),
        b = replay(power, `compare-${i}`, "b");
      rescueA += a.stats.saved;
      rescueB += b.stats.saved;
      harmA += a.stats.harm;
      harmB += b.stats.harm;
    }
    expect(rescueA).toBeGreaterThan(rescueB * 1.2);
    expect(harmB).toBeGreaterThan(harmA * 1.2);
  });
  it("allows exactly two valid interventions and replays them", () => {
    let g = createGame(kind, "intervene");
    const trace: { step: number; lesson: number }[] = [];
    while (!g.ended) {
      if (eventMap[g.current!].critical && g.interventions > 0) {
        trace.push({ step: g.history.length, lesson: 0 });
        g = advance(g, 0);
      } else if (eventMap[g.current!].critical) {
        expect(() => advance(g, 0)).toThrow();
        g = advance(g);
      } else g = advance(g);
    }
    expect(trace).toHaveLength(2);
    expect(g.interventions).toBe(0);
    expect(replay(kind, "intervene", "ルカ", trace)).toEqual(g);
    expect(advance(g)).toEqual(g);
  });
  it("resumes from a serialized midlife without changing the outcome", () => {
    let g = createGame(kind, "resume");
    for (let i = 0; i < 10; i++) g = advance(g);
    g = JSON.parse(JSON.stringify(g));
    while (!g.ended) g = advance(g);
    expect(g).toEqual(replay(kind, "resume", "ルカ"));
  });
});

describe("world ledgers", () => {
  it("keeps promises and relationships consistent with actual outcomes", () => {
    let fulfilled = 0,
      broken = 0;
    for (let i = 0; i < 100; i++) {
      const g = replay(kind, `ledger-${i}`, "ルカ");
      expect(new Set(g.world.regions).size).toBe(g.world.regions.length);
      if (g.memories.includes("ミナは海を見た")) {
        expect(g.world.promises.find((p) => p.person === "ミナ")?.status).toBe(
          "果たした",
        );
        expect(g.world.victims).toBeGreaterThanOrEqual(3);
        fulfilled++;
      }
      if (g.memories.includes("ミナとの約束を破った")) {
        expect(["破った", "結び直した"]).toContain(
          g.world.promises.find((p) => p.person === "ミナ")?.status,
        );
        broken++;
      }
      if (g.memories.includes("アオを救った"))
        expect(g.world.people.some((p) => p.name === "アオ")).toBe(true);
    }
    expect(fulfilled).toBeGreaterThan(0);
    expect(broken).toBeGreaterThan(0);
  });
});

it("attributes an intervention to the rule that actually contributed most", () => {
  const three = classify(["助ける", "助ける", "助ける"]).map((l, i) => ({
    ...l,
    strength: [1, 3, 2][i],
  }));
  let rescues = 0;
  for (let i = 0; i < 20; i++) {
    const g = createGame(three, `explanation-${i}`);
    g.current = "war-0";
    const result = advance(g, 0);
    const decision = result.history[0];
    if (decision.action === "誰も見ていないと答える") {
      expect(decision.lesson).toBe(0);
      expect(decision.reason).toContain("教え1");
      rescues++;
    }
  }
  expect(rescues).toBeGreaterThan(0);
});
