import { useEffect, useState } from "react";
import { PixelWorld, type Motion } from "./PixelWorld";
import { Pager, splitText } from "./Pager";
import type { Event, Game, Entry, Motive } from "../game/model";
const motions: Record<Motive, Motion> = {
  rescue: "rescue",
  truth: "talk",
  promise: "promise",
  explore: "scan",
  survive: "leave",
  community: "build",
  freedom: "release",
  power: "conflict",
};
export function FilmScene({
  event,
  game,
  entry,
  auto,
  onAutoChange,
  paused = false,
}: {
  event: Event;
  game: Game;
  entry?: Entry;
  auto: boolean;
  onAutoChange: (auto: boolean) => void;
  paused?: boolean;
}) {
  const [cut, setCut] = useState(0),
    [replay, setReplay] = useState(0);
  const text = entry?.result ?? event.text,
    beats = splitText(text, 44);
  const action = entry && event.actions.find((a) => a.label === entry.action);
  let motion: Motion = action ? motions[action.motive] : "approach";
  if (action && ((action.effects.damage ?? 0) < 0 || (action.life ?? 0) > 0))
    motion = "repair";
  if (
    action &&
    /命じる|範囲を広げる|像を受け入れる|モーター|規則|引き継ぐ/.test(
      action.label,
    )
  )
    motion = "build";
  if (action && /戦術記録|命令のまま/.test(action.label)) motion = "scan";
  if (event.arc === "war" && event.stage === 0) motion = "talk";
  const scene = entry?.memory === "ミナは海を見た" ? "coast" : event.scene;
  useEffect(() => {
    if (!auto || paused || cut >= beats.length - 1) return;
    const id = setTimeout(
      () => setCut((v) => v + 1),
      Math.max(3200, beats[cut].length * 115),
    );
    return () => clearTimeout(id);
  }, [auto, paused, cut, text, beats.length, replay]);
  return (
    <div
      className={`film-scene motion-${motion}`}
      data-motion={motion}
      data-cut={cut}
    >
      <PixelWorld
        key={`${event.id}-${!!entry}-${replay}`}
        scene={scene}
        age={game.age}
        damage={game.stats.damage}
        arc={event.id === "repair-3" ? "empty" : event.arc}
        motion={motion}
        beat={cut}
        name={game.name}
      />
      <div className="film-top">
        <span>⌖ {event.region}</span>
        <span>{entry ? "その選択が、世界に残したこと" : "旅のひとこま"}</span>
      </div>
      <div className="film-caption" aria-live="polite">
        <span className="eyebrow">
          {entry ? game.name + "の記録" : event.title}
        </span>
        <p key={`${text}-${cut}`}>{beats[cut]}</p>
      </div>
      <div className="film-controls">
        <button
          onClick={() => onAutoChange(!auto)}
          aria-label={auto ? "字幕の自動送りを止める" : "字幕を自動で送る"}
        >
          {auto ? "Ⅱ" : "▷"} <span>{auto ? "自動送り" : "手動"}</span>
        </button>
        <Pager
          index={cut}
          total={beats.length}
          onChange={setCut}
          label="カット"
        />
        <button
          onClick={() => {
            setCut(0);
            setReplay((v) => v + 1);
          }}
          aria-label="映像をもう一度再生"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
