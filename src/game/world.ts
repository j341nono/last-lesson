import type { Entry } from "./model";
import { eventMap } from "./scenarios";
export type World = {
  people: {
    name: string;
    relationship: "出会い" | "友人" | "すれ違い" | "別れ";
    memories: string[];
  }[];
  promises: {
    person: string;
    content: string;
    status: "継続中" | "果たした" | "破った" | "結び直した";
  }[];
  regions: string[];
  knowledge: string[];
  faction: string;
  victims: number;
};
// These ledgers are derived from authored outcomes, never guessed from a global morality score.
const deaths: Record<string, number> = {
  ミナは海を見た: 3,
  砲台を守った: 8,
  反乱の道を開いた: 12,
  戦術を渡した: 16,
  効率の街: 6,
  閉じた門: 4,
};
export function buildWorld(history: Entry[]): World {
  const world: World = {
    people: [],
    promises: [],
    regions: [],
    knowledge: [],
    faction: "どこにも属さない旅人",
    victims: 0,
  };
  for (const h of history) {
    const e = eventMap[h.eventId];
    if (!e) continue;
    if (!world.regions.includes(e.region)) world.regions.push(e.region);
    const person =
      e.arc === "traveler"
        ? "アオ"
        : e.arc === "girl"
          ? "ミナ"
          : e.arc === "repair"
            ? "レン"
            : h.memory.includes("研究者") ||
                h.memory === "生まれた理由" ||
                h.memory === "作り手の修理"
              ? "研究者"
              : undefined;
    if (person) {
      let p = world.people.find((p) => p.name === person);
      if (!p) {
        p = { name: person, relationship: "出会い", memories: [] };
        world.people.push(p);
      }
      p.memories.push(h.memory);
      if (
        /救った|修理された|手紙|和解|学校|好意|工房|花|生まれた理由|作り手/.test(
          h.memory,
        )
      )
        p.relationship = "友人";
      if (/決別|置いて|破った|砲台/.test(h.memory)) p.relationship = "すれ違い";
      if (e.id === "repair-3") p.relationship = "別れ";
    }
    if (h.memory === "ミナとの約束")
      world.promises.push({
        person: "ミナ",
        content: "一緒に海を見る",
        status: "継続中",
      });
    const promise = world.promises.find((p) => p.person === "ミナ");
    if (promise) {
      if (h.memory === "ミナは海を見た") promise.status = "果たした";
      if (h.memory === "ミナとの約束を破った") promise.status = "破った";
      if (h.memory === "新しい約束") promise.status = "結び直した";
    }
    if (h.memory === "受け継いだ工房")
      world.promises.push({
        person: "レン",
        content: "工房を引き継ぐ",
        status: "果たした",
      });
    if (/知識|図面|地図|記録を公開|生まれた理由|薬局|授業/.test(h.memory))
      world.knowledge.push(h.memory);
    if (h.memory === "機械の自治領") world.faction = "機械の自治領";
    if (h.memory === "機械の代表") world.faction = "機械の自治領の代表";
    if (h.memory === "機械と人の協定") world.faction = "人と機械の協定";
    if (h.memory === "抑止の鍵") world.faction = "境界線の調停者";
    world.victims += deaths[h.memory] ?? 0;
  }
  return world;
}
