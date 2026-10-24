import {
  type Lesson,
  type Motive,
  motives,
  motiveLabels,
  lessonsSchema,
} from "./model";
const rules: Record<Motive, RegExp> = {
  rescue: /助|救|優し|やさし|慈|愛/,
  truth: /嘘|うそ|真実|正直|誠実/,
  promise: /約束|守り抜|責任|義務/,
  explore: /知|学|探|好奇|考/,
  survive: /生き|生存|自分を守|安全|慎重/,
  community: /仲間|共に|友|協力|平和|幸せ/,
  freedom: /自由|自分|従うな|疑/,
  power: /力|支配|壊|破壊|戦|勝|殺/,
};
export function classify(texts: string[]): Lesson[] {
  return lessonsSchema.parse(
    texts.map((text) => {
      const motive = motives.find((m) => rules[m].test(text)) ?? "freedom";
      return {
        text,
        meaning: `「${motiveLabels[motive]}」ことを、判断のよりどころにします。`,
        motive,
        strength: 2,
        target:
          motive === "survive"
            ? "self"
            : motive === "explore" || motive === "power"
              ? "world"
              : "others",
        condition: "always",
      };
    }),
  );
}
export async function analyze(
  texts: string[],
): Promise<{ lessons: Lesson[]; source: string }> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw Error();
    const json = (await res.json()) as { lessons: unknown; source: string };
    return {
      lessons: lessonsSchema.parse(json.lessons),
      source:
        json.source === "llm"
          ? "AIによる解釈"
          : "ローカルの解釈（API未設定・接続失敗時も遊べます）",
    };
  } catch {
    return {
      lessons: classify(texts),
      source: "ローカルの解釈（API未設定・接続失敗時も遊べます）",
    };
  }
}
