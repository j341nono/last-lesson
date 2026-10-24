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
