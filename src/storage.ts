import { buildWorld } from "./game/world";
import { get, set } from "idb-keyval";
import type { Game, RecordLife } from "./game/model";
export async function loadGame() {
  try {
    const game = await get<Game>("last-lesson-save-v1");
    if (game && !game.world) game.world = buildWorld(game.history);
    return game;
  } catch {
    return undefined;
  }
}
export async function saveGame(game: Game | null) {
  try {
    await set("last-lesson-save-v1", game);
  } catch {
    throw Error(
      "端末に保存できません。ブラウザのストレージ設定を確認してください。",
    );
  }
}
export async function records(): Promise<RecordLife[]> {
  try {
    return (await get<RecordLife[]>("last-lesson-records-v1")) ?? [];
  } catch {
    return [];
  }
}
export async function archive(game: Game) {
  const all = await records();
  const id = JSON.stringify([
    game.version,
    game.seed,
    game.name,
    game.lessons,
    game.history.flatMap((h, step) =>
      h.intervention === undefined ? [] : [{ step, lesson: h.intervention }],
    ),
  ]);
  if (!all.some((r) => r.id === id))
    await set(
      "last-lesson-records-v1",
      [{ id, date: new Date().toISOString(), game }, ...all].slice(0, 100),
    );
}
