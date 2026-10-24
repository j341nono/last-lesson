import { describe, it, expect, vi } from "vitest";
import worker from "../server/index";
import { classify } from "../src/game/lessons";
const env = {
  ASSETS: { fetch: vi.fn(() => new Response("asset")) },
} as unknown as Cloudflare.Env;
const post = (
  path: string,
  value: unknown,
  headers: Record<string, string> = {},
) =>
  new Request(`https://game.example/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(value),
  });
describe("API boundary", () => {
  it("falls back to validated local lessons without any AI key", async () => {
    const r = await worker.fetch(
      post("analyze", { texts: ["人を助ける", "嘘をつかない", "約束を守る"] }),
      env,
    );
    expect(r.status).toBe(200);
    const d = (await r.json()) as { source: string; lessons: unknown[] };
    expect(d.source).toBe("local");
    expect(d.lessons).toHaveLength(3);
  });
  it("rejects cross-origin submissions and invalid lengths", async () => {
    expect(
      (
        await worker.fetch(
          post(
            "analyze",
            { texts: ["a", "b", "c"] },
            { Origin: "https://evil.example" },
          ),
          env,
        )
      ).status,
    ).toBe(403);
    expect(
      (await worker.fetch(post("analyze", { texts: ["a"] }), env)).status,
    ).toBe(400);
    expect(
      (
        await worker.fetch(
          post("analyze", { texts: ["x".repeat(9000), "b", "c"] }),
          env,
        )
      ).status,
    ).toBe(400);
  });
  it("keeps the game playable and gives explicit unavailable status without a DB", async () => {
    expect(
      (await worker.fetch(new Request("https://game.example/api/records"), env))
        .status,
    ).toBe(503);
    expect(
      (
        await worker.fetch(
          post("records", {
            consent: true,
            name: "ルカ",
            seed: "test",
            lessons: classify(["助ける", "学ぶ", "生きる"]),
            interventions: [],
          }),
          env,
        )
      ).status,
    ).toBe(503);
  });
});

it("recalculates a forged client score, requires consent and enforces the posting limit", async () => {
  let count = 0;
  let stored: unknown;
  const database = {
    prepare: (sql: string) => ({
      bind: (...values: unknown[]) => ({
        first: async () => ({ count: ++count }),
        run: async () => {
          if (sql.startsWith("INSERT OR IGNORE INTO lives"))
            stored = JSON.parse(values[2] as string);
          return { success: true };
        },
      }),
    }),
  };
  const withDB = { ...env, DB: database } as unknown as Cloudflare.Env;
  const data = {
    consent: true,
    name: "ルカ",
    seed: "forgery",
    lessons: classify(["助ける", "約束を守る", "学ぶ"]),
    interventions: [],
    stats: { saved: 999999 },
    score: 999999,
  };
  expect(
    (await worker.fetch(post("records", { ...data, consent: false }), withDB))
      .status,
  ).toBe(400);
  expect((await worker.fetch(post("records", data), withDB)).status).toBe(201);
  const life = stored as {
    stats: { saved: number };
    ended: boolean;
    history: unknown[];
  };
  expect(life.stats.saved).toBeLessThan(999999);
  expect(life.ended).toBe(true);
  expect(life.history.length).toBeGreaterThanOrEqual(20);
  count = 5;
  expect((await worker.fetch(post("records", data), withDB)).status).toBe(429);
});
